# ADR-0002: Un documento Firestore por cromo poseído (vs blob de inventario)

- **Estado:** Aceptado
- **Fecha:** 2026-05-16
- **Deciders:** @jostinalvarados

## Contexto y problema

El inventario del usuario tiene que representar 994 cromos posibles, cada
uno con un estado: faltante (count = 0), pegado (count = 1) o pegado +
repes (count ≥ 2). Hay tres formas naturales de modelarlo en Firestore:

1. Un único documento con un mapa `{ stickerId → count }` (994 claves
   potenciales).
2. Un documento por cromo en una subcolección, **siempre** los 994 existen.
3. Un documento por cromo poseído, los faltantes **no tienen documento**.

Cada cromo cambia varias veces por sesión (marcar, desmarcar, sumar repe,
restar). Los reads y writes deben ser baratos y atómicos.

## Drivers de la decisión

1. **Cero writes innecesarios al iniciar el álbum**: un usuario nuevo
   con álbum vacío no debería disparar 994 escrituras.
2. **Mutaciones atómicas con stats denormalizadas**: marcar un cromo
   debe actualizar `stats.owned/missing/duplicates` en la misma operación.
3. **Reactividad por cromo**: poder suscribirse a cambios granulares sin
   re-fetch del inventario completo.
4. **Reglas de Firestore simples**: facilitar el control de acceso por
   path (`users/{uid}/...`).
5. **Tamaño del documento**: Firestore limita docs a 1 MB. 994 entries
   en un solo doc cabe (~30 KB en JSON), pero es frágil ante crecimiento.

## Opciones consideradas

### A. Blob: doc único `users/{uid}/collections/{albumId}` con `items: { ARG13: 2, MEX5: 1, ... }`

- **Bueno**: 1 doc total, 1 read trae todo el inventario.
- **Bueno**: una sola transacción para modificar.
- **Malo**: write completo del doc en cada cambio (Firestore no soporta
  edits parciales de mapas anidados sin reescribir el doc entero — solo
  campos top-level).
- **Malo**: imposible suscribirse a un cromo específico; toda la UI re-
  renderiza con cada cambio.
- **Malo**: no escala si el catálogo crece a varios miles de cromos.

### B. Subcolección con TODOS los cromos pre-creados (count = 0 por default)

- **Bueno**: estructura uniforme, query "todo lo poseído" es directa.
- **Malo**: **994 writes al iniciar** cualquier álbum nuevo. Con 3
  usuarios nuevos = 2.982 writes solo de bootstrap, 15% de la cuota
  diaria del plan Spark, para guardar ceros.
- **Malo**: storage desperdiciado.

### C. Subcolección con doc **solo si el cromo es poseído** (count ≥ 1)

- **Bueno**: 0 writes al iniciar — el inventario nace vacío.
- **Bueno**: writes baratos: 1 doc por mutación, batch con stats.
- **Bueno**: query `getItems()` trae solo lo que hay (típicamente <500
  docs, no 994).
- **Bueno**: granular: subscribir a un item específico es trivial.
- **Malo**: lógica "no existe = count 0" hay que recordarla en el
  cliente al combinar catálogo + inventario.
- **Malo**: borrar el doc cuando `count` vuelve a 0 agrega complejidad
  al método de mutación.

## Decisión

Adoptamos la **opción C**.

Estructura final:

```
users/{uid}/collections/{albumId}              # doc con stats denormalizadas
  └─ items/{stickerId}                         # SOLO si count >= 1
```

`CollectionService.setStickerCount` aplica la lógica en un único batch:

- `count = 0` → `batch.delete(itemRef)`
- `count ≥ 1` → `batch.set(itemRef, { stickerId, count, updatedAt })`
- En el mismo batch: `increment()` sobre `stats.owned/missing/duplicates`.

`AlbumViewService` combina catálogo + items y, para los cromos sin
documento, asume `count = 0` automáticamente.

## Consecuencias

### Positivas

- **0 writes al iniciar un álbum nuevo**. El doc de colección se crea
  con `ensureCollection()` (1 write) solo cuando hace falta.
- **Storage proporcional al progreso real del usuario**, no al tamaño del
  catálogo. Un usuario que tiene 200 cromos pegados ocupa ~200 docs, no
  994.
- **Mutaciones atómicas**: el batch garantiza que stats y el item se
  actualicen juntos. Sin race conditions.
- **Listeners granulares**: cada cromo es su propio stream si se necesita.
- **Reglas de Firestore simples**: el path `users/{uid}/...` da el
  control de acceso natural.

### Negativas

- **Lógica de "ausencia = 0"** distribuida en el cliente:
  `AlbumViewService.getAlbumView` hace `countById.get(s.code) ?? 0`.
  Documentado en `CLAUDE.md`.
- **Borrar al volver a 0**: hay que recordar usar `batch.delete()` en
  vez de `set({ count: 0 })`. Si se olvida, se ensucia con docs vacíos.
  Mitigado: encapsulado en `setStickerCount`, todos los callers
  obligados a pasar por ahí.
- **Migración a futuro**: si el catálogo cambia (nuevo álbum), el
  formato sigue funcionando sin migración.

## Datos comparativos

Para un usuario que va a completar el álbum gradualmente durante el
Mundial (~94 días, 994 cromos):

| Métrica | Opción A (blob) | Opción B (todos pre-creados) | Opción C (solo poseídos) |
|---|---:|---:|---:|
| Writes al iniciar el álbum | 1 | 994 | 1 (solo el doc de stats) |
| Writes por marcar 1 cromo | 1 (reescribe blob entero) | 1 | 1 |
| Docs en storage al completar | 1 (con 994 entries) | 994 | 994 |
| Docs en storage al 50% | 1 | 994 | 497 |
| Reactividad por cromo | No | Sí | Sí |
| Riesgo de exceder 1 MB/doc | Sí (~1.500 cromos+) | No | No |

## Referencias

- [Firestore document size limits](https://firebase.google.com/docs/firestore/quotas)
- [Firestore atomic batch writes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- `core/services/collection.service.ts` — implementación
- `CLAUDE.md` § "Modelo de datos en Firestore"
