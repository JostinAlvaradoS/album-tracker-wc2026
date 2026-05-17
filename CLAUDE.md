# Panini WC2026 — Copa Tracker

App Angular 18 (standalone + signals) para llevar la colección del álbum de figuritas del mundial. Backend: Firebase (Firestore + Auth).

Working directory de Angular: `angular/`.

## Estructura

```
angular/src/app/
  app.config.ts                          provideFirebaseApp + provideFirestore + InjectionTokens (CURRENT_ALBUM_ID, ALLOWED_EMAILS)
  app.routes.ts                          rutas standalone
  core/
    config/app.tokens.ts                 CURRENT_ALBUM_ID, ALLOWED_EMAILS (vienen de environment)
    models/album.model.ts                Album, Section, Sticker, CollectionItem, etc.
    services/
      auth.service.ts                    Firebase Auth + whitelist (UnauthorizedEmailError) + reset de caches en logout
      album-catalog.service.ts           Lee catálogo (estático) de Firestore, cache vía shareReplay + reset() para limpiar listeners
      collection.service.ts              Inventario del usuario (writes + listeners)
      album-view.service.ts              Combina catálogo + inventario → vistas listas para UI
    guards/auth.guard.ts                 authGuard
  features/
    login/                               Login solo con Google + chequeo post-login contra ALLOWED_EMAILS
    album-view/                          Grid principal
      sticker-cell/                      Sub-componente presentacional de la celda (extraído del grid)
    duplicates/                          Lista de repetidas
    missing-list/                        Lista de faltas
    comparator/                          Consulta rápida del estado de un cromo (intercambios)
    stats/                               Progreso global y por sección
```

## Configuración OSS

- `environment.albumId` se inyecta vía `CURRENT_ALBUM_ID`. Default `'wc2026'`.
- `environment.allowedEmails` se inyecta vía `ALLOWED_EMAILS`. Vacío = modo abierto.
- Ambas se popular desde `angular/.env` (`NG_APP_ALBUM_ID`, `NG_APP_ALLOWED_EMAILS`) vía `scripts/set-env.js`.
- La whitelist en cliente es UX. La autoridad real es `firestore.rules` (mantener manual sync).

## Modelo de datos en Firestore

```
albums/{albumId}                         # catálogo (estático)
  sections/{sectionId}                   # secciones del álbum
  stickers/{stickerId}                   # ~1000+ docs por álbum

users/{uid}/collections/{albumId}        # inventario del usuario
  (campos: albumId, startedAt, stats: { owned, missing, duplicates, total })
  items/{stickerId}                      # un doc POR CROMO POSEÍDO (count >= 1)
    (campos: stickerId, count, updatedAt)
```

**Diseño:** un cromo SIN documento en `items/` = no se tiene. El doc se crea solo cuando `count >= 1` y se borra cuando vuelve a 0. Esto evita ~1000 escrituras al iniciar un álbum vacío.

## Estrategia de caching de Firestore

El catálogo es **estático y grande** (~1000 docs por álbum). El inventario es **dinámico pero pequeño** (solo los cromos que el usuario tiene). Las lecturas crecen rápido si no se cachea bien.

### Capa 1 — Persistencia IndexedDB (habilitada)

En `app.config.ts` se provee Firestore con `persistentLocalCache` + `persistentMultipleTabManager`:

```ts
provideFirestore(() =>
  initializeFirestore(getApp(), {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  })
)
```

**Qué hace:**
- Guarda copia local en IndexedDB de cada doc/query que se lee.
- Refresh / reabrir pestaña / navegar entre rutas → 0 reads, sirve desde IndexedDB.
- Sincroniza solo deltas con el servidor vía Watch API (resume tokens). Solo se cobran reads de los docs que cambiaron desde la última sync.
- Soporta múltiples pestañas (la sync se comparte entre ellas).
- Escrituras se aplican **optimísticamente al caché local** → la UI se actualiza en el siguiente frame, sin esperar al round-trip al servidor.
- Funciona offline: writes se encolan y se mandan al volver online.

**Implicancia para el código:** los listeners (`docData`/`collectionData`) siguen siendo la forma correcta de leer, porque ahora son baratos. NO reemplazar por `getDoc` puntuales — eso pierde la reactividad sin ahorrar reads (un listener sobre datos cacheados también es 0 reads en estado estable).

### Capa 2 — `shareReplay` en el catálogo

`AlbumCatalogService` mantiene un `Map<albumId, Observable>` por entidad (álbum, secciones, stickers) con `shareReplay({ bufferSize: 1, refCount: false })`. Combinado con la persistencia IndexedDB:

- Primer suscriptor: lee de IndexedDB (instant) y abre listener al servidor (0 reads si no hubo cambios).
- Suscriptores siguientes en la misma sesión: comparten el último valor emitido sin tocar Firestore.
- `refCount: false` mantiene el listener vivo aunque no haya suscriptores (evita re-abrir el stream al volver a la pantalla).

### Capa 3 — Sin `getDoc` redundantes antes de writes

**Regla:** si el componente ya está suscrito a un listener que tiene el valor actual, **pasalo como parámetro al servicio** en vez de hacer otro `getDoc` adentro.

`CollectionService.setStickerCount` recibe `prevCount` obligatorio. Los componentes lo pasan desde `StickerView.count` (que ya viene del listener vía `AlbumViewService`):

```ts
// album-view.component.ts
await this.collectionService.addDuplicate(ALBUM_ID, s.code, s.count);
await this.collectionService.markOwned(ALBUM_ID, s.code, s.count);
await this.collectionService.removeOne(ALBUM_ID, s.code, s.count);
```

Cada click pasa de **2 reads + 1 write** a **0 reads + 1 write**. Más importante: elimina los ~300-800ms de delay porque los dos round-trips desaparecen y el write se aplica optimísticamente.

### Capa 4 — `getDocFromCache` para chequeos puntuales

`ensureCollection` usa `getDocFromCache` con fallback a `getDocFromServer`. Tras la primera ejecución exitosa, ese chequeo cuesta 0 reads en todas las visitas siguientes.

## Reglas para futuras features

1. **Nunca hagas `getDoc` antes de un write si ya hay un listener activo con ese dato.** Pasá el valor por parámetro.
2. **Para datos estáticos del catálogo**, usá `AlbumCatalogService` (ya cacheado). No leas `albums/...` directamente desde un componente.
3. **Para datos derivados** (progreso, faltantes, repes), usá `AlbumViewService` que combina catálogo + inventario reactivamente. No dupliques esa lógica en componentes.
4. **Las stats denormalizadas** en `users/{uid}/collections/{albumId}` se actualizan vía `increment()` dentro del batch que muta el item. No las recalcules del cliente y las sobreescribas — perdés atomicidad.
5. **Para una pantalla nueva que necesita una vista distinta del catálogo**, agregá un método derivado en `AlbumViewService`, no leas Firestore directo.
6. **Si necesitás un dato puntual sin reactividad** (ej: chequeo de existencia previo a un write), usá `getDocFromCache` con fallback a `getDocFromServer`. Nunca uses el `getDoc()` legacy salvo que sepas que el dato cambia muy seguido en otro device.

## Comandos

```bash
cd angular
npm install
npm start            # ng serve
npm run build        # build producción
npx tsc --noEmit -p tsconfig.app.json    # type check sin emitir
```

## Stack

- Angular 18.2 standalone + signals (sin NgModules)
- AngularFire 18.0.1 / Firebase 10.13 (Firestore modular + Auth)
- RxJS para streams compuestos (`combineLatest`, `shareReplay`)
- SCSS por componente
