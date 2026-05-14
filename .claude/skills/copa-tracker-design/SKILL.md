---
name: copa-tracker-design
description: >-
  Sistema de diseño original "Línea 26" para apps Angular de tracker/colección
  de álbum de figuritas del mundial de fútbol — mobile-first y también pantallas
  grandes. Estética moderna y limpia: superficies neutras, mucho aire, color como
  acento puntual. Entrega tokens SCSS, tema, tipografía, componentes Angular
  standalone (sticker grid, barra de progreso, tarjetas, perfil/stats) y patrones
  de pantalla con animaciones sutiles. Usar SIEMPRE que el usuario pida diseñar,
  estilizar, "dejar increíble" o construir UI de un tracker de álbum del mundial,
  colección de figuritas/cromos/stickers, app de intercambios, o mencione una
  estética relacionada con el mundial de fútbol en Angular — aunque no diga
  "skill" ni "sistema de diseño". NO reproduce marca, logos, tipografías
  licenciadas, mascota ni emblema oficial de FIFA: genera una identidad propia.
license: Identidad visual original. No incluye ni replica propiedad intelectual de FIFA.
---

# Copa Tracker Design — sistema "Línea 26"

Sistema de diseño para construir la UI de una app Angular de seguimiento de un
álbum de figuritas del mundial: cuánto llevas pegado, qué te falta, qué tienes
repetido y tus estadísticas de colección. Mobile-first, pero los componentes
escalan a tablet y desktop.

## Aviso legal — leer antes de empezar

Esta skill **no** reproduce ni imita la marca oficial de FIFA / Copa del Mundo
2026: nada de logos oficiales, emblema, mascota, nombres de producto registrados,
ni tipografías licenciadas. Lo que se entrega es una identidad **original**
("Línea 26"). Si el usuario pide explícitamente meter assets oficiales de FIFA,
explicar con tacto que no se puede y ofrecer la alternativa original. Esto
protege legalmente el proyecto del usuario.

## Concepto de la identidad "Línea 26"

Dirección visual: **moderna y limpia, con acentos de color**. No es una estética
recargada de "estadio de noche" — es una app de producto contemporánea:

- **Superficies neutras y claras** (modo claro por defecto), con jerarquía dada
  por sombras suaves y bordes sutiles, no por color de fondo.
- **Mucho aire.** El espacio en blanco es parte del diseño. Las pantallas
  respiran; la única zona densa a propósito es el grid del álbum (es una
  colección, tiene que sentirse llena).
- **El color es un acento, no un relleno.** Verde = "obtenida" / acción
  principal. Ámbar = "repe". Azul = datos y foco. Se usan en dosis pequeñas:
  un badge, un borde, un número — nunca tiñendo pantallas enteras.
- **Tipografía con carácter pero legible.** Una display geométrica para
  titulares y números grandes; Inter para toda la UI.

Diferenciador memorable: el **número de progreso** tratado como pieza
tipográfica grande y limpia (estilo dashboard de producto), y la transición
clara entre los tres estados de figurita — obtenida / falta / repe — legible de
un vistazo.

## Cómo usar esta skill

1. **Siempre** copiar primero el archivo de tokens a los estilos globales del
   proyecto: ver `assets/_estadio26-tokens.scss`. Es la fuente de verdad de
   colores, tipos, espaciados, radios, sombras y duración de animaciones. Todo lo
   demás referencia estas variables — nunca hardcodear un hex.
2. Cargar el tema y las fuentes según `references/fundamentos.md` (paleta,
   tipografía, modo claro/oscuro, accesibilidad de contraste).
3. Para construir una pantalla o componente concreto, leer el archivo de
   referencia que corresponda (ver tabla abajo). Cada uno trae el componente
   Angular standalone completo: `.ts`, plantilla y `.scss`.
4. Respetar las reglas mobile-first de `references/layout-responsive.md` para que
   todo escale de teléfono a pantalla grande sin rehacer nada.

## Prioridad de pantallas

Las dos pantallas centrales de este tracker son:

1. **Álbum** — grid de figuritas + progreso del álbum. Es la pantalla que define
   la app.
2. **Perfil y estadísticas** — resumen de la colección, stat cards, progreso por
   equipo.

La pantalla de **Intercambios** está documentada como secundaria: existe el
patrón por si se necesita, pero no es el foco. Al construir "toda la app",
invertir el esfuerzo de pulido en Álbum y Perfil.

## Mapa de archivos de referencia

Leer solo el que haga falta para la tarea actual.

| Archivo | Cuándo leerlo |
|---|---|
| `references/fundamentos.md` | Siempre al inicio. Paleta completa, tipografía, modo claro/oscuro, contraste, iconografía, principios. |
| `references/componentes.md` | Construir o estilizar componentes base: botones, chips, tarjeta de figurita, barra de progreso, badges, app-bar, bottom-nav, skeletons. |
| `references/pantallas.md` | Construir pantallas completas. Foco en Álbum (grid + progreso) y Perfil/estadísticas; Intercambios incluido como secundario. Trae layout y estado vacío de cada una. |
| `references/animaciones.md` | Cualquier movimiento: revelado de figurita, conteo del marcador, transiciones de ruta Angular, stagger de entrada, micro-interacciones, `prefers-reduced-motion`. Todo sutil — acorde a la estética limpia. |
| `references/layout-responsive.md` | Reglas mobile-first, breakpoints, cómo el grid y la navegación cambian de teléfono a tablet/desktop, áreas seguras (notch), densidad. |

## Stack

Angular 17+ standalone components + SCSS. Es la decisión por defecto de esta
skill: standalone es el camino actual de Angular y SCSS da el control fino que
pide un sistema de diseño. Si el proyecto del usuario resulta usar NgModules
clásicos, los componentes funcionan igual: solo mover lo de `imports:` del
decorador al módulo. Si usa Tailwind, los tokens sirven como capa `:root` de CSS
variables; avisar de que el SCSS de los componentes habría que portarlo.

## Reglas no negociables

- **Mobile-first siempre.** Escribir los estilos para teléfono primero y subir
  con `min-width`. La pantalla principal de la app se diseña para una mano.
- **Tokens, no valores sueltos.** Cualquier color, espaciado, radio o sombra sale
  de `_estadio26-tokens.scss`. Esto mantiene la coherencia y permite cambiar el
  tema entero desde un punto.
- **Color con moderación.** La estética es limpia: el color es acento, no fondo.
  Si una pantalla se ve "teñida" de un color, está mal — volver a superficies
  neutras y dejar el color en los detalles.
- **Contraste accesible.** Texto siempre AA mínimo sobre su fondo. Las
  combinaciones validadas están en `references/fundamentos.md`.
- **El movimiento es sutil y se respeta.** Animaciones discretas, y toda animación
  tiene su rama `prefers-reduced-motion: reduce`. Ver `references/animaciones.md`.
- **Nada de marca oficial.** Releer el aviso legal de arriba.
- **Componentes standalone y tipados.** Inputs/outputs tipados, `OnPush` donde
  tenga sentido, sin `any`.

## Flujo recomendado para "déjame increíble el tracker"

Cuando el pedido es amplio ("rediseña / mejora toda la app"):

1. Instalar tokens + tema (`assets/` + `references/fundamentos.md`).
2. Montar el shell: app-bar arriba, bottom-nav abajo, área segura — de
   `references/componentes.md` y `references/layout-responsive.md`.
3. Las dos pantallas centrales primero: Álbum (grid + progreso) y luego
   Perfil/estadísticas (`references/pantallas.md`). Aquí va el grueso del pulido.
4. Si se necesita, Intercambios como pantalla secundaria.
5. Capa de animación al final, sin reescribir: revelado, conteo del marcador,
   transiciones de ruta (`references/animaciones.md`). Mantenerla discreta.
6. Pasada responsive: comprobar en ~360px, ~768px y ~1280px.

Entregar siempre código Angular real y funcional, no pseudocódigo.