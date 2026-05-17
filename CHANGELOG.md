# Changelog

Todos los cambios relevantes del proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y el proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.1.0] — 2026-05-17

Filtro de secciones compartido en todas las pantallas con listas, mejoras
de UX en repes y refactor interno hacia componentes reutilizables.

### Features

- **Filtro de secciones en faltas y repes.** Antes solo el álbum tenía
  selector + chips de equipos. Ahora también `faltas` y `repes` permiten
  filtrar por sección de un toque.
- **Secciones especiales en los chips.** Los chips ya no muestran solo
  los 48 equipos: ahora aparecen también FWC intro, Champions y
  Coca-Cola con un estilo punteado para distinguirlos. La etiqueta del
  carrusel pasa de "Equipos" a "Secciones".
- **Copia de lista respeta el filtro activo.** Si filtras por una
  sección, el botón "Copiar lista completa" cambia a "Copiar sección" y
  copia solo lo visible. Se acabaron los exportes accidentales de todo
  el álbum.
- **Desglose claro en repes.** Cada fila ahora muestra dos chips
  explícitos: "1 pegado" (verde) + "N para cambio" (ámbar). Antes solo
  había un número total que confundía sobre cuál era el del álbum y
  cuáles los repes.

### Mejoras

- **`SectionFilterComponent` reutilizable** con 3 modos
  (`progress` / `missing-count` / `dupe-count`) en
  `features/shared/section-filter/`. Antes el selector vivía solo
  inline en `album-view`.
- **Alineación de controles `+/−` en repes** al borde derecho de la
  columna en desktop.
- **Empty states contextuales** en faltas y repes: si la lista está
  vacía por un filtro activo, el mensaje lo aclara y sugiere quitar el
  filtro.
- **Captures organizadas** en el README con tablas HTML para mostrar
  pantallas en grilla y los tres estados de un cromo en fila comparativa.

### Calidad

- **145 tests** (+29 desde v1.0.0) con `94%` de cobertura.
- Nuevos specs para `SectionFilterComponent` (chipsSections,
  chipLabel, modos, eventos) y para el flujo de filtro+copyList en
  faltas y repes.

[1.1.0]: https://github.com/JostinAlvaradoS/album-tracker-wc2026/releases/tag/v1.1.0

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
