# Fundamentos — Línea 26

Leer esto al inicio de cualquier trabajo con la skill. Cubre paleta, tipografía,
cómo cargar el tema, modo claro/oscuro, accesibilidad e iconografía. La estética
es **moderna y limpia**: superficies neutras, mucho aire, color como acento.

## 1. Instalar los tokens

Copiar `assets/_estadio26-tokens.scss` a la carpeta de estilos del proyecto
(p. ej. `src/styles/_estadio26-tokens.scss`) y en `src/styles.scss`:

```scss
@use 'styles/estadio26-tokens' as *;
```

Eso ya deja disponibles todas las CSS custom properties (`--e26-*`), el reset
base, las clases `.e26-display` / `.e26-code` / `.e26-eyebrow` y los mixins
(`e26-bp`, `e26-focus-ring`, `e26-clamp`).

Si el proyecto **no** usa SCSS, copiar solo los bloques `:root` a un `.css`
global; las variables funcionan igual. Los mixins SCSS no estarían disponibles —
sustituir por media queries normales.

## 2. Tipografía

Tres fuentes, todas libres. En `index.html`, dentro de `<head>`:

```html
<!-- Inter y JetBrains Mono desde Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<!-- Clash Grotesk se sirve gratis desde Fontshare -->
<link href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@500,600&display=swap" rel="stylesheet">
```

- **Clash Grotesk** → `--e26-font-display`. Geométrica, contemporánea, con
  carácter sin ser estridente. Para titulares de pantalla y el número grande del
  progreso. La clase `.e26-display` ya aplica el tracking ajustado (`-0.02em`)
  que la hace ver moderna.
- **Inter** → `--e26-font-body`. El estándar de UI por buenas razones: legible a
  todo tamaño. Toda la interfaz: párrafos, botones, etiquetas, navegación.
- **JetBrains Mono** → `--e26-font-mono`. Solo para el código de la figurita
  (ej. `ARG-07`) y números de serie. Da un toque técnico-coleccionable discreto.

Si Clash Grotesk no carga, el fallback es Archivo y luego la fuente del sistema —
aceptable. Para `--e26-font-body`, Inter → system-ui también es seguro. La escala
tipográfica sale de los tokens `--e26-fs-*`; no inventar tamaños sueltos.

## 3. Paleta y cuándo usar cada color

La app vive en **modo claro por defecto**: fondo casi blanco, tarjetas blancas,
texto tinta. La jerarquía la dan las sombras suaves y los bordes sutiles, **no**
el color.

### Neutros (la base — el 90% de lo que se ve)

| Token | Uso |
|---|---|
| `--e26-bg` | Fondo de la app. Gris muy claro. |
| `--e26-surface` | Tarjetas. Blanco. La superficie de trabajo. |
| `--e26-surface-2` | Inputs, tarjetas anidadas, estado "falta" de figurita. |
| `--e26-surface-3` | Hover / activo. |
| `--e26-text` / `--e26-text-muted` / `--e26-text-subtle` | Jerarquía de texto: principal, secundario, terciario (etiquetas, hints). |
| `--e26-border` / `--e26-border-strong` | Líneas y separadores. |

### Acentos (uso puntual — el 10% restante)

| Token | Uso | Versión `-soft` |
|---|---|---|
| `--e26-primary` (verde) | Acción principal y estado **"figurita obtenida"**. | `--e26-primary-soft`: fondo tenue para chips/badges sin gritar. |
| `--e26-accent` (ámbar) | Estado **"repe / disponible para cambio"**. | `--e26-accent-soft`. |
| `--e26-info` (azul) | Datos, números de stats, enlaces, anillo de foco. | `--e26-info-soft`. |

Regla de oro: **el color es un acento, no un relleno.** Un badge verde, un
borde, un número grande en color — sí. Una tarjeta entera pintada de verde — no.
Cuando dudes, deja la superficie neutra y pon el color solo en el detalle que
importa. Las versiones `-soft` existen justo para esto: dar un toque de color
(fondo de un chip, un badge) sin saturar.

### Estados de figurita (núcleo del producto)

Tres estados, legibles de un vistazo — y no solo por color:

- **La tienes** → borde/acento `--e26-sticker-owned` (verde), figurita a color y
  nítida, una marca de check.
- **Te falta** → fondo `--e26-sticker-missing` (gris superficie), figurita en
  silueta tenue, borde punteado.
- **Repe** → acento `--e26-sticker-dupe` (ámbar), badge con el número de
  repetidas (`×2`).

La diferencia es de **forma y estado** (nítida vs silueta, check vs badge), no
solo de matiz — así funciona también para daltonismo.

## 4. Modo claro/oscuro

Claro es el default. Para ofrecer oscuro, poner `data-theme="dark"` en `<html>`
o la clase `.e26-dark` en un contenedor. El bloque de modo oscuro de los tokens
ya redefine las variables — los componentes no necesitan saber en qué modo están.
El modo oscuro mantiene la misma filosofía limpia: neutros oscuros, acentos
ligeramente más claros para conservar contraste.

Toggle típico en Angular (servicio simple con signals):

```ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<'light' | 'dark'>('light');

  toggle(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next);
  }
}
```

## 5. Accesibilidad

- **Contraste**: estas combinaciones están validadas AA o mejor — usarlas con
  confianza:
  - `--e26-text` sobre `--e26-bg`, `--e26-surface`, `--e26-surface-2`
  - `--e26-text-muted` sobre `--e26-bg` y `--e26-surface` (AA para texto normal)
  - `--e26-text-subtle` sobre `--e26-surface`: AA solo para texto ≥ `--e26-fs-sm`
    en negrita o ≥ `--e26-fs-lg` normal; no usarlo para texto chico fino.
  - `--e26-primary-on` sobre `--e26-primary`; `--e26-accent-on` sobre
    `--e26-accent`; `--e26-info-on` sobre `--e26-info`.
  - Texto de color sobre fondo `-soft`: `--e26-primary` sobre
    `--e26-primary-soft` cumple AA — patrón típico de chip/badge.
  Si se crea una combinación nueva, verificar contraste antes de usarla.
- **Foco**: todo elemento interactivo usa el mixin `e26-focus-ring` (o el
  `box-shadow` equivalente con `--e26-info`). Nunca quitar el outline sin
  reemplazo.
- **Tamaño táctil**: objetivos interactivos mínimo 44×44 px reales en móvil.
- **No depender solo del color**: el estado de figurita lleva además forma y/o
  badge, no solo el matiz.
- **Movimiento**: ver `animaciones.md`, todo respeta `prefers-reduced-motion`.

## 6. Iconografía

Usar un set de iconos de trazo, libre y consistente — recomendado **Lucide**
(`lucide-angular`). Encaja perfecto con la estética limpia: trazo fino y
geométrico. No mezclar sets. Trazo `1.5px`, tamaño base 20–22 px.

```bash
npm i lucide-angular
```

```ts
import { LucideAngularModule, Trophy, ArrowLeftRight, User, LayoutGrid } from 'lucide-angular';
// importar LucideAngularModule en el componente standalone
```

## 7. Principios de composición

- **Aire primero.** El espacio en blanco no es vacío desperdiciado: es lo que
  hace que el diseño se sienta calmo y moderno. Generoso con el padding y los
  gaps; la única excepción densa es el grid del álbum.
- **Jerarquía por elevación, no por color.** Una tarjeta destaca por su sombra
  suave y su borde sutil sobre el fondo gris claro — no por pintarla de un color.
- **El número manda.** En Álbum y Perfil, los números (progreso, stats) son la
  pieza visual fuerte: grandes, con la display font, limpios. Es lo que el
  usuario viene a ver.
- **Color como señal.** Cada uso de color comunica algo: verde = logro/acción,
  ámbar = repe, azul = dato. Si un color no está comunicando nada, sobra.
- **Mano única.** La acción principal de cada pantalla queda en el tercio
  inferior, alcanzable con el pulgar.
- **Consistencia sobre novedad.** Mismos radios, mismas sombras, mismos
  espaciados en todas partes. La sensación "pulida" viene de la repetición
  disciplinada de los tokens, no de efectos llamativos.