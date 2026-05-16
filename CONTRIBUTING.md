# Cómo contribuir

¡Gracias por interesarte en mejorar Copa Tracker! Esta guía cubre el flujo de
trabajo y las convenciones del proyecto.

## Antes de empezar

1. Abre un [issue](../../issues) describiendo lo que quieres cambiar antes de
   invertir tiempo en código. Cambios chicos (typos, fixes de un solo
   archivo) pueden ir directo a PR.
2. Para features grandes, espera feedback antes de codear — quizás haya
   trabajo en curso o el alcance se puede ajustar.

## Setup local

Sigue las instrucciones de [README.md](README.md#setup). El stack es Angular
18 + Firebase. No necesitas una cuenta de Firebase real para hacer cambios
de UI; solo para probar la integración.

## Estilo de código

### TypeScript / Angular

- **Standalone components** con `ChangeDetectionStrategy.OnPush` por defecto.
- **Signals** para estado local de componentes; **RxJS** solo donde aporta
  (combinaciones, retry, etc).
- **`trackBy`** en todo `*ngFor` con más de ~10 elementos.
- Sin `any` salvo en boundaries con Firestore (`docData()` y `collectionData()`
  ya están encapsulados en los servicios).
- Imports relativos para módulos internos; sin barrels innecesarios.
- Cero comentarios decorativos. Comentar solo el **por qué** cuando no sea
  obvio.

### SCSS

- Usa solo los tokens `--e26-*` del sistema de diseño. **No hardcodees colores
  o espaciados.**
- Mobile-first: media queries con `min-width`.
- Componentes con estilos inline (`styles: [...]`) son OK hasta ~250 líneas.
  Si crece más, considera extraer un sub-componente.

### UX / Copy

- **Español neutro (tuteo).** Usa "entra", "comparte", "ten", no "entrá",
  "compartí", "tené". El proyecto está pensado para audiencia panhispana.
- Sin referencias a marcas oficiales (FIFA, Panini, mascotas, logos).
  Esta es una app de identidad propia.
- Mensajes de error claros y accionables. No "Algo salió mal" genérico.

## Convenciones de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>: <descripción corta>

<cuerpo opcional, explicando el porqué del cambio>
```

Tipos comunes:
- `feat` — nueva funcionalidad visible al usuario
- `fix` — corrección de bug
- `refactor` — cambio interno sin alterar comportamiento
- `docs` — documentación
- `chore` — tooling, deps, config
- `style` — formato, sin cambio de lógica
- `test` — tests

Ejemplos:
- `feat: add comparator screen for trade lookups`
- `fix: resolve race in ensureCollection on cold start`
- `refactor: extract StickerCellComponent from album-view`

## Pull requests

1. Trabaja en una rama desde `main`: `git checkout -b feat/mi-cambio`.
2. Hace tu cambio. **Compila local sin warnings nuevos**:
   ```bash
   cd angular
   npm run build                     # producción
   npx tsc --noEmit -p tsconfig.app.json   # type-check
   ```
3. Commit y push.
4. Abre PR con descripción clara: qué cambia y por qué.
5. Vinculá el issue relacionado (`Closes #NN`).

### Checklist antes de pedir review

- [ ] El build pasa sin warnings nuevos.
- [ ] El type-check pasa.
- [ ] Probaste el flujo en `npm start` (login, álbum, faltas, repes,
      comparador).
- [ ] No hay strings hardcoded que deberían ser tokens.
- [ ] No agregaste libs nuevas sin discutirlo en el issue.
- [ ] El copy nuevo está en español neutro y sin marcas oficiales.

## Tests

El proyecto no tiene tests automatizados todavía (es un tracker personal).
Si querés sumar, empezá por los servicios de `core/services/` — son los más
fáciles de testear porque la lógica de Firestore está encapsulada.

## Reportar vulnerabilidades

No abras un issue público. Ver [SECURITY.md](SECURITY.md).

## Código de conducta

Sé respetuoso. Si algo cruza la línea, el mantenedor cierra el thread y
sigue adelante.
