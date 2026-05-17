# Copa Tracker — Álbum WC 2026

Aplicación web para llevar la cuenta de los cromos del álbum del Mundial 2026.
Marca lo que ya tienes pegado, registra repetidos para intercambio y consulta
estados de cromos en segundos durante un cambio.

> **Identidad propia.** Este proyecto no usa marcas, logos, mascotas ni
> tipografías oficiales de FIFA o Panini. La estética es original.

**Stack:** Angular 18 (standalone + signals) · Firestore + Firebase Auth · SCSS.

## Features

- **Álbum** — grid completo con tres estados por cromo: pegado / falta / repe.
  Click izquierdo alterna pegado, click derecho suma una repetida.
- **Faltas** — lista agrupada por selección, copiable para compartir.
- **Repes** — gestión de repetidos con +/−, lista copiable para organizar
  intercambios.
- **Comparador** — input rápido para consultar el estado de un cromo durante
  un intercambio. Muestra si te falta, si ya lo tienes o cuántas copias tienes
  para cambiar.
- **Stats** — progreso global y por selección, con anillo de progreso.
- **Whitelist opcional** — limita el acceso a cuentas de Google específicas.
  Si no la configuras, cualquier cuenta de Google puede entrar.

## Capturas

> _Pendiente — agregar GIFs/screenshots cuando estén disponibles._

## Setup

### Requisitos

- Node 20+ (ver `.nvmrc`)
- npm o pnpm
- Una cuenta de Firebase (plan Spark gratuito alcanza para uso personal)

### 1. Clonar e instalar

```bash
git clone <tu-fork>.git copa-tracker
cd copa-tracker
cd scripts && npm install && cd ..
cd angular && npm install
```

### 2. Configurar Firebase

1. Crea un proyecto en https://console.firebase.google.com.
2. Habilita **Firestore Database** (modo producción).
3. Habilita **Authentication → Sign-in method → Google**.
4. Desde **Project settings → Your apps** copia los valores del SDK Web.

### 3. Configurar variables de entorno

```bash
cd angular
cp .env.example .env
# Edita .env y rellena los valores de Firebase
```

Variables disponibles:

| Variable | Obligatorio | Default |
|---|---|---|
| `NG_APP_FIREBASE_*` (6 vars) | Sí | — |
| `NG_APP_ALBUM_ID` | No | `wc2026` |
| `NG_APP_ALLOWED_EMAILS` | No | (vacío = modo abierto) |

`set-env.js` genera `angular/src/environments/environment.ts` automáticamente
antes de cada `npm start` / `npm run build`. El `.env` está en `.gitignore`.

### 4. Importar el catálogo

`scripts/catalog.json` ya viene en el repo (994 cromos del Mundial 2026, ~232KB).
Solo lo subes a tu Firestore.

Necesitas una clave de servicio para que el script tenga permisos:

1. Firebase Console → **Project settings → Service accounts → Generate new private key**.
2. Guarda el JSON como `scripts/serviceAccountKey.json` (en `.gitignore`).

```bash
cd scripts
npm install                       # solo la primera vez
node import-to-firestore.js       # sube los 994 cromos
```

> **¿Quieres modificar el catálogo?** Edita `scripts/generate-catalog.js`
> (es la fuente de verdad de la estructura) y corre `node generate-catalog.js`
> para regenerar `catalog.json` antes del import.

### 5. Reglas de Firestore

El archivo `firestore.rules` ya implementa el modelo:

- Catálogo (`albums/*`) — lectura para usuarios autorizados, escritura bloqueada.
- Inventario (`users/{uid}/...`) — solo el dueño autorizado.

Si configuraste `NG_APP_ALLOWED_EMAILS`, **edita también `firestore.rules`**
para que la función `isAllowlisted()` contenga la misma lista, o las reglas
rechazarán las operaciones. Si la dejas vacía, comenta o ajusta la función
para que solo valide `request.auth != null`.

### 6. Ejecutar en local

```bash
cd angular
npm start                         # http://localhost:4200
```

### 7. Deploy

```bash
cd angular && npm run build && cd ..
firebase login                    # si no estás logueado
firebase use <tu-project-id>
firebase deploy --only firestore:rules,hosting
```

## Estructura del catálogo

| Sección | Cromos | Códigos |
|---|---|---|
| Intro / oficiales | 9 | `00`, `FWC1`–`FWC8` |
| Selecciones (48 × 20) | 960 | `MEX1`–`MEX20`, `ARG1`–`ARG20`, etc. |
| Campeones | 11 | `FWC9`–`FWC19` |
| Coca-Cola | 14 | `CC1`–`CC14` |
| **Total** | **994** | |

Estructura editable en `scripts/generate-catalog.js`.

## Modelo de datos en Firestore

```
albums/{albumId}                            (doc del álbum, estático)
albums/{albumId}/sections/{id}              (51 secciones)
albums/{albumId}/stickers/{code}            (994 docs, ID = código)

users/{uid}/collections/{albumId}           (stats denormalizadas)
users/{uid}/collections/{albumId}/items/{code}
                                            (1 doc SOLO por cromo poseído)
```

**Diseño:** un cromo sin doc en `items/` = no se tiene. Evita crear ~1000
documentos vacíos al iniciar un álbum.

## Arquitectura

```
angular/src/app/
  app.config.ts                  Bootstrap, providers, InjectionTokens
  app.routes.ts                  Rutas standalone + authGuard
  core/
    config/app.tokens.ts         CURRENT_ALBUM_ID, ALLOWED_EMAILS
    models/album.model.ts        Tipos puros del dominio
    services/
      auth.service.ts            Login Google + whitelist + UnauthorizedEmailError
      album-catalog.service.ts   Lee catálogo, cacheado por shareReplay
      collection.service.ts      Inventario del usuario (writes atómicos)
      album-view.service.ts      Fachada: combina catálogo + inventario
    guards/auth.guard.ts         authGuard
  features/
    login/                       Pantalla de login con whitelist check
    album-view/                  Grid principal
      sticker-cell/              Sub-componente presentacional
    missing-list/                Lista de faltas
    duplicates/                  Gestión de repes
    comparator/                  Consulta rápida para intercambios
    stats/                       Resumen y progreso
```

Más detalle de la estrategia de caching (IndexedDB persistente, shareReplay,
0 reads antes de writes) en `CLAUDE.md`.

## Contribuir

PRs bienvenidos. Lee [CONTRIBUTING.md](CONTRIBUTING.md) antes de empezar.

Reportes de seguridad: ver [SECURITY.md](SECURITY.md).

## Personalización

- **Nombres de jugadores reales:** salen como "Jugador 1, 2…". Edita
  `scripts/generate-catalog.js` y regenera el catálogo.
- **Otros álbumes:** cambia `NG_APP_ALBUM_ID` en `.env` y genera un catálogo
  con el nuevo id.

## Limitaciones conocidas

- Solo soporta autenticación con Google (Anonymous fue removido por la
  whitelist).
- La whitelist en cliente es UX: la seguridad real la imponen las reglas
  de Firestore. Mantener ambas en sync.
- El bundle inicial está sobre los 512KB (warning de Angular CLI); razonable
  para una app Firebase con AngularFire.

## Licencia

[MIT](LICENSE) © 2026 Jostin Alvarado
