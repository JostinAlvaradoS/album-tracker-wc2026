# Architecture Decision Records (ADR)

Este directorio contiene los registros de decisiones arquitectónicas del
proyecto. Cada ADR documenta una decisión técnica relevante: el contexto
que la motivó, las opciones consideradas, la decisión tomada y sus
consecuencias.

Formato: [MADR 3.0](https://adr.github.io/madr/) (Markdown Architectural
Decision Records).

## Índice

| Nº | Título | Estado |
|----|--------|--------|
| [0001](0001-firestore-caching-strategy.md) | Estrategia de caching de Firestore (IndexedDB + shareReplay) | Aceptado |
| [0002](0002-single-doc-per-owned-sticker.md) | Un documento Firestore por cromo poseído (vs blob de inventario) | Aceptado |
| [0003](0003-whitelist-dual-client-rules.md) | Whitelist dual: cliente (UX) + reglas Firestore (autoridad) | Aceptado |
| [0004](0004-stack-firebase-angular.md) | Stack: Firebase + Angular (vs Supabase, serverless, self-hosted) | Aceptado |

## Cómo agregar un ADR

1. Copia el template de cualquier ADR existente.
2. Numera con el siguiente entero disponible y un slug descriptivo:
   `NNNN-titulo-corto.md`.
3. Actualiza este índice.
4. Estado inicial: `Propuesto`. Cambia a `Aceptado` cuando se merge la
   implementación.

## Estados posibles

- **Propuesto** — bajo discusión.
- **Aceptado** — vigente; el código lo refleja.
- **Deprecado** — ya no aplica pero el ADR queda como histórico.
- **Reemplazado por [NNNN](NNNN-...md)** — una decisión posterior lo
  invalidó; siempre enlazar al ADR que lo reemplaza.
