# Changelog

Todos los cambios relevantes del proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y el proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] — 2026-05-16

Primera release pública del tracker.

### Features

- **Álbum** — grid completo del Mundial 2026 con 994 cromos. Tres estados
  por cromo (pegado / falta / repe) con click izquierdo y derecho para
  acciones rápidas.
- **Faltas** — lista agrupada por selección, copiable a clipboard para
  compartir.
- **Repes** — gestión de duplicados con `+/−` y lista copiable para
  organizar intercambios.
- **Comparador** — input rápido para consultar el estado de un cromo
  durante un intercambio. Resultado con código de color (pegado / repes /
  falta) y stack de últimas búsquedas.
- **Stats** — anillo de progreso global + desglose por selección.
- **Login** con Google + whitelist configurable por email (modo abierto
  si no se setea).

### Arquitectura

- Angular 18 standalone + signals.
- Firestore con `persistentLocalCache` (IndexedDB) + `shareReplay` →
  ~0 reads/día/usuario en estado estable después de la primera carga.
- Documento por cromo poseído (no por cromo del catálogo): inventario
  proporcional al progreso real, no al tamaño del álbum.
- Whitelist dual: cliente (UX, vía `ALLOWED_EMAILS` InjectionToken) +
  servidor (`firestore.rules`, autoridad real).
- 4 ADRs documentando las decisiones técnicas relevantes con datos.

### Calidad

- **116 tests** con Jest + jest-preset-angular cubriendo servicios,
  componentes, guards y helpers.
- **Coverage ~88%** global, con thresholds enforzados en CI:
  - 90%+ en `core/services/`
  - 100% en `core/guards/` y `core/config/`
- **CI** con lint (ESLint + angular-eslint) + tests + build en cada
  push y PR.
- **Type-check estricto** (strict mode + Angular strict templates).

### OSS

- LICENSE MIT.
- README con diagramas de arquitectura en Mermaid.
- CONTRIBUTING, SECURITY, CODE_OF_CONDUCT.
- ADRs en `docs/adr/` (formato MADR 3.0).
- `.editorconfig`, `.nvmrc` (Node 20).
- Catálogo (`scripts/catalog.json`) versionado para setup en 2 pasos.
- Variables configurables vía `.env` (Firebase + albumId + whitelist).

[1.0.0]: https://github.com/JostinAlvaradoS/album-tracker-wc2026/releases/tag/v1.0.0
