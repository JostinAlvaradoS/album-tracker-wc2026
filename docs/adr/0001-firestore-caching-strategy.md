# ADR-0001: Estrategia de caching de Firestore (IndexedDB + shareReplay)

- **Estado:** Aceptado
- **Fecha:** 2026-05-16
- **Deciders:** @jostinalvarados

## Contexto y problema

La app vive en el plan **Spark (gratis)** de Firebase, que limita a
**50.000 reads/día** y **20.000 writes/día** sobre Firestore. El proyecto
es un tracker de cromos: cada usuario consulta el mismo catálogo de
**1.046 documentos** (1 álbum + 51 secciones + 994 cromos) varias veces al
día y muta su inventario decenas o cientos de veces por sesión.

Al implementar las primeras pantallas usamos lo que el SDK ofrece sin
configurar nada: los componentes se suscribían directo con `docData()` y
`collectionData()` (cada uno de AngularFire). Cada `getDoc()` puntual
antes de un write sumaba lecturas adicionales. El comportamiento era
correcto pero el costo escalaba mal.

### Datos del problema

Catálogo estático que cada usuario tiene que leer:

| Recurso | Docs |
|---|---|
| `albums/wc2026` | 1 |
| `albums/wc2026/sections/{id}` | 51 |
| `albums/wc2026/stickers/{code}` | 994 |
| **Total catálogo** | **1.046** |

Inventario por usuario (`users/{uid}/collections/wc2026/items/{code}`):
0 a 994 docs según cuántos cromos tenga pegados/repetidos.

Coste estimado de una sola carga "fría" sin caching:

```
1.046 (catálogo) + N (inventario, hasta 994) ≈ 1.500 reads por carga fría
```

Si un único usuario refresca la app 5 veces al día (cambiar de tab, cerrar
y reabrir, navegar entre rutas que recrean el stream), una sola persona
puede consumir **~7.500 reads/día** sin tocar nada — el 15% de la cuota
diaria del plan gratuito.

Con 3 usuarios activos: **22.500 reads/día solo en cargas frías** = 45%
de la cuota. Inviable a escala incluso modesta.

## Drivers de la decisión

1. **Mantenerse en plan Spark** (gratis) con 2-10 usuarios activos.
2. **Reactividad**: la UI debe reflejar cambios sin polling ni reload manual.
3. **Funcionar offline / con red mala** sin perder el último estado conocido.
4. **No degradar la UX** con loaders cada vez que se navega entre rutas.
5. **Costo de implementación bajo** — esta app es un side project.

## Opciones consideradas

1. **A. Sin caching, listeners directos por componente.**
2. **B. Sustituir listeners por `getDoc()` puntuales con caching manual en memoria.**
3. **C. `shareReplay` sobre los Observables del catálogo (cache en memoria, vivo solo durante la sesión).**
4. **D. `persistentLocalCache` de Firestore (IndexedDB persistente entre sesiones) + `shareReplay`.**

## Decisión

Adoptamos la **opción D** (combinación): `persistentLocalCache` con
`persistentMultipleTabManager` + `shareReplay({ bufferSize: 1, refCount: false })`
en los servicios de catálogo.

```ts
// app.config.ts
provideFirestore(() =>
  initializeFirestore(getApp(), {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  })
)
```

```ts
// album-catalog.service.ts
this.albumCache.set(
  albumId,
  (docData(ref) as Observable<Album | undefined>).pipe(
    shareReplay({ bufferSize: 1, refCount: false })
  )
);
```

Además, las mutaciones que ya tienen el dato actual desde un listener
**no hacen `getDoc()` previo**: el caller pasa `prevCount` por parámetro
para que el batch que muta los stats use `increment()` con el delta.

### Cómo combinan las capas

| Capa | Función | Cuándo evita reads |
|---|---|---|
| `persistentLocalCache` (IndexedDB) | Persistencia local entre sesiones | Refresh, reabrir pestaña, navegar entre rutas |
| `shareReplay` | Compartir el último valor del Observable entre suscriptores | Dos pantallas que consultan el mismo álbum en la misma sesión |
| `prevCount` en parámetro | Evita `getDoc()` antes del write | Cada click de marcar pegado / sumar repe |

## Consecuencias

### Positivas

- **Lecturas en estado estable: ~0/día por usuario** después de la primera
  sesión exitosa. Firestore solo cobra reads cuando hay deltas que
  sincronizar (vía Watch API con resume tokens), y el catálogo es
  estático.
- **Primera carga**: ~1.500 reads (única vez por dispositivo/navegador).
- **Cada click**: pasa de **2 reads + 1 write** (getDoc previo +
  refresh post-write + escritura) a **0 reads + 1 write**.
- **Offline**: la app sigue funcionando con el último estado conocido;
  los writes se encolan y se mandan al recuperar conexión.
- **Multi-pestaña**: `persistentMultipleTabManager` comparte el cache
  entre pestañas del mismo origen — no se duplican listeners.
- **UX sin loaders en navegaciones intra-sesión**: el dato ya está en
  memoria; el render es inmediato.

### Negativas

- **Complejidad de comprensión**: hay tres capas trabajando a la vez.
  Documentado en `CLAUDE.md` para evitar regresiones (ej. alguien
  reemplaza un listener por `getDoc()` sin entender por qué).
- **Listeners "vivos para siempre"** por `refCount: false`. Mitigado:
  `AlbumCatalogService.reset()` se llama desde `AuthService.logout()`
  para evitar `permission-denied` con UID viejo. Ver
  [ADR-0003](0003-whitelist-dual-client-rules.md).
- **Stale data ante cambios externos al catálogo**: si alguien importa
  un catálogo nuevo desde Admin SDK, los clientes con cache antiguo
  pueden tardar en ver los cambios hasta el próximo delta sync. Como
  el catálogo es estático en producción, no es relevante.
- **Bug class de "olvidar pasar `prevCount`"**: mitigado haciendo el
  parámetro obligatorio en la firma de `setStickerCount(albumId,
  stickerId, newCount, prevCount)`.

## Datos comparativos

Modelo de uso por usuario activo:
- Abre la app 5 veces al día (sesiones / refreshes).
- Marca 30 cromos por sesión (clicks).

| Métrica | Sin cache (A) | `shareReplay` sólo (C) | Persistente (D, actual) |
|---|---:|---:|---:|
| Reads de carga fría (1ª vez) | 1.500 | 1.500 | 1.500 |
| Reads por sesión adicional | 1.500 | 1.500 (sesión nueva = stream nuevo) | ~0–3 (delta sync) |
| Reads por click (write) | 2 | 2 | 0 |
| Reads/día/usuario (modelo) | 7.500 + 60 = **7.560** | **7.560** | **~25** |
| Writes/día/usuario | 30 | 30 | 30 |
| Usuarios que entran en quota Spark (50K reads/día) | **~6** | **~6** | **~2.000** |

**Reducción real de lecturas con la opción D: ~300x**.

## Referencias

- [Firebase Spark plan limits](https://firebase.google.com/pricing)
- [Firestore offline persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [AngularFire `provideFirestore`](https://github.com/angular/angularfire)
- `CLAUDE.md` § "Estrategia de caching de Firestore" — guía operativa para mantener el patrón
