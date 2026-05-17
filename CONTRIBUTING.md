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

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm test` pasa.
- [ ] `npm run build` pasa sin warnings nuevos.
- [ ] Probaste el flujo en `npm start` (login, álbum, faltas, repes,
      comparador).
- [ ] Si agregaste lógica de servicios, sumaste su test.
- [ ] No hay strings hardcoded que deberían ser tokens.
- [ ] No agregaste libs nuevas sin discutirlo en el issue.
- [ ] El copy nuevo está en español neutro y sin marcas oficiales.

## Tests

El proyecto usa **Jest** con `jest-preset-angular`. Los tests viven al
lado del código que cubren (`*.spec.ts`).

```bash
npm test             # corre todos los tests
npm run test:watch   # modo watch
npm run test:ci      # con coverage (igual que en CI)
```

Cobertura inicial: helpers presentacionales del `StickerCellComponent`,
servicio de autenticación (whitelist) y el `AlbumViewService` (combinación
catálogo + inventario). Si agregas lógica nueva en servicios, agregá tests.

Para mockear Firestore en tests de servicios, inyectá un mock parcial via
`TestBed.configureTestingModule` — mirá `auth.service.spec.ts` y
`album-view.service.spec.ts` como referencia.

## Reportar vulnerabilidades

No abras un issue público. Ver [SECURITY.md](SECURITY.md).

## Código de conducta

Sé respetuoso. Si algo cruza la línea, el mantenedor cierra el thread y
sigue adelante.
