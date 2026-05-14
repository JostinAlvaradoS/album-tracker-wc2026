# Layout responsive — Línea 26

Reglas para que la app se diseñe primero para teléfono (una mano) y escale
limpiamente a tablet y desktop sin rehacer nada.

Índice:
1. Mobile-first: la regla
2. Breakpoints
3. El grid del álbum
4. Navegación: bottom-nav → side-rail
5. Contenedor y anchos máximos
6. Áreas seguras (notch, gesture bar)
7. Densidad táctil
8. Checklist de comprobación

---

## 1. Mobile-first: la regla

Escribir **siempre** los estilos base para el teléfono más chico (~360px de
ancho) y **subir** con `min-width`. Nunca al revés.

```scss
.cosa {
  // base = teléfono
  grid-template-columns: repeat(3, 1fr);

  @include e26-bp(md) {   // 768px+
    grid-template-columns: repeat(6, 1fr);
  }
}
```

Motivo: el caso más restringido (pantalla chica, pulgar, datos limitados) es el
que define el producto. Si funciona ahí, escalar hacia arriba es fácil.

---

## 2. Breakpoints

Definidos en el mixin `e26-bp` de los tokens. Cuatro escalones:

| Nombre | Ancho | Pensado para |
|---|---|---|
| (base) | < 480px | Teléfonos. **El diseño por defecto.** |
| `sm` | ≥ 480px | Teléfonos grandes / phablets. |
| `md` | ≥ 768px | Tablets vertical. |
| `lg` | ≥ 1024px | Tablets horizontal / laptops chicas. |
| `xl` | ≥ 1280px | Desktop. |

Uso: `@include e26-bp(md) { ... }`. No inventar breakpoints intermedios salvo
necesidad real y puntual.

---

## 3. El grid del álbum

El grid de figuritas es el corazón visual. Columnas que crecen con el ancho —
nunca figuritas gigantes en desktop ni minúsculas en móvil:

| Viewport | Columnas | Gap |
|---|---|---|
| base (teléfono) | 3 | `--e26-space-3` |
| `sm` ≥480px | 4 | `--e26-space-3` |
| `md` ≥768px | 6 | `--e26-space-4` |
| `lg` ≥1024px | 8 | `--e26-space-4` |

```scss
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--e26-space-3);

  @include e26-bp(sm) { grid-template-columns: repeat(4, 1fr); }
  @include e26-bp(md) { grid-template-columns: repeat(6, 1fr); gap: var(--e26-space-4); }
  @include e26-bp(lg) { grid-template-columns: repeat(8, 1fr); }
}
```

La `e26-sticker` usa `aspect-ratio: 3/4` y `width: 100%`, así que se adapta sola
a la columna — no hay que tocar la tarjeta al cambiar el grid.

Alternativa "auto" (si se prefiere que el navegador decida y no fijar números):

```scss
.grid {
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  @include e26-bp(md) { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
}
```

Usar la tabla de columnas fijas cuando se quiere control exacto; la versión
`auto-fill` cuando el contenido es muy variable.

---

## 4. Navegación: bottom-nav → side-rail

En teléfono la navegación va **abajo** (`e26-bottom-nav`, fija, alcanzable con el
pulgar). En pantallas grandes la barra inferior se siente desperdiciada — pasarla
a un **rail lateral** a la izquierda.

Patrón: el shell decide según breakpoint. Mantener el mismo componente de ítems,
solo cambia la disposición:

```scss
.shell {
  @include e26-bp(lg) {
    display: grid;
    grid-template-columns: 88px 1fr;  // rail + contenido
  }
}
.shell__nav {
  // móvil: el componente ya es fixed-bottom
  @include e26-bp(lg) {
    position: sticky;
    top: 0;
    height: 100dvh;
    /* re-orientar la nav a columna vertical */
  }
}
```

En la práctica, lo más simple es tener dos presentaciones del mismo `items[]`:
`e26-bottom-nav` visible en `< lg` y un rail vertical visible en `≥ lg`, ambos
emitiendo el mismo `select`. Ocultar/mostrar con `display` por breakpoint, no
duplicar lógica.

La app-bar se mantiene arriba en todos los tamaños; en desktop puede ganar ancho
máximo junto con el contenido (§5).

---

## 5. Contenedor y anchos máximos

El contenido no debe estirarse infinitamente en monitores anchos — se vuelve
incómodo de leer y las figuritas quedan ridículas.

```scss
.shell__content {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding: var(--e26-space-4);
  padding-bottom: calc(var(--e26-space-8) + var(--e26-safe-bottom));

  @include e26-bp(md) { padding: var(--e26-space-5); }
  @include e26-bp(lg) { padding: var(--e26-space-6); }
}
```

- Pantallas de contenido tabular o de lectura (perfil, detalle): `max-width` más
  estrecho aún (~640–720px) para que no se dispersen.
- El grid del álbum sí puede usar todo el ancho del contenedor (1200px).

---

## 6. Áreas seguras (notch, gesture bar)

Los teléfonos modernos tienen notch arriba y barra de gestos abajo. Los tokens ya
exponen `--e26-safe-top` y `--e26-safe-bottom` (vía `env(safe-area-inset-*)`).

Requisitos:
- En `index.html`, el viewport debe permitir las safe areas:
  ```html
  <meta name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover">
  ```
- La `e26-app-bar` ya suma `--e26-safe-top` a su padding superior.
- La `e26-bottom-nav` ya suma `--e26-safe-bottom` a su padding inferior.
- El `.shell__content` ya reserva `--e26-safe-bottom` extra para que el último
  contenido no quede tapado por la nav.

Si se crea un elemento nuevo pegado a un borde de la pantalla, sumarle el inset
correspondiente.

---

## 7. Densidad táctil

- **Objetivo mínimo 44×44 px** real para cualquier cosa tocable en móvil. Los
  componentes ya cumplen (`min-height: 44px` en botones, 36px+padding en chips
  con área efectiva ≥44, etc.).
- En el grid del álbum las figuritas son chicas a propósito (es una colección),
  pero **toda la tarjeta es el área de toque** — no un botoncito dentro.
- Separación mínima entre objetivos táctiles: `--e26-space-2` (8px). En el grid se
  usa `--e26-space-3`.
- En desktop se puede reducir la densidad de aire (más columnas, gaps un poco
  mayores) — pero nunca hacer los objetivos más chicos que en móvil.

---

## 8. Checklist de comprobación

Antes de dar por buena una pantalla, revisarla en tres anchos:

- **~360px** — teléfono chico. ¿Entra todo sin scroll horizontal? ¿La acción
  principal se alcanza con el pulgar? ¿El texto no se corta raro?
- **~768px** — tablet. ¿El grid pasó a más columnas? ¿Hay demasiado aire vacío a
  los lados? Si sí, falta `max-width` o más columnas.
- **~1280px** — desktop. ¿La nav pasó a rail lateral (o al menos no se ve
  perdida abajo)? ¿El contenido tiene `max-width` y está centrado? ¿Las
  figuritas tienen tamaño razonable, ni gigantes ni diminutas?

Y en cualquier ancho: probar con `prefers-reduced-motion` activado y con modo
claro, no solo oscuro.