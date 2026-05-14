# Animaciones — Línea 26

Todo el movimiento de la app. Regla base para esta estética: **el movimiento es
sutil y funcional, nunca decorativo.** Un diseño limpio y moderno no lleva
efectos llamativos — las animaciones confirman acciones y suavizan transiciones,
nada más. Cada animación tiene su rama `prefers-reduced-motion`. Usar siempre las
duraciones y curvas de los tokens (`--e26-dur-*`, `--e26-ease-*`).

Índice:
1. Principios
2. Revelado de figurita (la "pegada") — sobrio
3. Conteo del marcador
4. Entrada escalonada del grid
5. Transiciones de ruta Angular
6. Micro-interacciones
7. `prefers-reduced-motion`

---

## 1. Principios

- **Discreción.** Las duraciones de los tokens ya son cortas a propósito
  (`--e26-dur-base` = 200ms). Si una animación se nota "de más", quitarla o
  acortarla.
- **Entradas con `--e26-ease-out`**, salidas con `--e26-ease-in`. El
  `--e26-ease-spring` existe pero con rebote contenido — usarlo solo en el flip
  de la figurita y poco más.
- **Animar solo `transform` y `opacity`** siempre que se pueda. La barra de
  progreso anima `width` porque es puntual y corta.
- **Un momento de confirmación > muchos micro-efectos.** El revelado de figurita
  y el conteo del marcador son los únicos momentos "con gracia"; el resto es
  transición pura.
- **Nada de loops infinitos decorativos.** El único movimiento perpetuo
  permitido es el shimmer del skeleton mientras carga — y para porque la carga
  termina.

---

## 2. Revelado de figurita (la "pegada") — sobrio

Cuando el usuario marca una figurita como obtenida, esta confirma el cambio con
un gesto corto y limpio: un fade + scale leve, sin destellos ni rebotes
exagerados. Se dispara añadiendo la clase `.is-revealing` a la `e26-sticker`.

```scss
.e26-sticker.is-revealing .stk__inner {
  animation: stk-reveal var(--e26-dur-reveal) var(--e26-ease-out) both;
}
@keyframes stk-reveal {
  from { transform: scale(.92); opacity: .4; }
  to   { transform: scale(1);   opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .e26-sticker.is-revealing .stk__inner { animation: none; }
}
```

En el componente, quitar la clase tras la animación:

```ts
revealAndSettle(host: HTMLElement) {
  host.classList.add('is-revealing');
  setTimeout(() => host.classList.remove('is-revealing'), 460);
}
```

> El cambio de estado en sí (borde gris punteado → borde verde + check) ya
> comunica el logro. La animación solo lo suaviza; no necesita más.

---

## 3. Conteo del marcador

El número grande del `e26-progress` sube de 0 al valor real al entrar a la
pantalla. Es el toque de "dashboard que se enciende" — discreto pero satisfactorio.
Directiva reutilizable:

```ts
import { Directive, ElementRef, Input, OnInit, inject } from '@angular/core';

@Directive({ selector: '[e26CountUp]', standalone: true })
export class CountUpDirective implements OnInit {
  @Input('e26CountUp') target = 0;
  @Input() durationMs = 500;

  private el = inject(ElementRef<HTMLElement>);

  ngOnInit(): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { this.el.nativeElement.textContent = String(this.target); return; }

    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / this.durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cúbico
      this.el.nativeElement.textContent = String(Math.round(this.target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
```

Uso en el progreso (envolviendo solo el número de pegadas):

```html
<span class="pg__count e26-display">
  <span [e26CountUp]="owned"></span><span class="pg__total">/ {{ total }}</span>
  <span class="pg__pct e26-code">{{ pct() }}%</span>
</span>
```

Sirve igual para los números de las stat cards del Perfil.

---

## 4. Entrada escalonada del grid

Las figuritas del álbum entran con un fade + desplazamiento mínimo (6px) y un
retraso leve entre cada una. El `@keyframes stk-in` ya está en `pantallas.md`
(§2). Para el escalonado, aplicar un `animation-delay` incremental — limitarlo a
las primeras ~10 para no retrasar el resto:

```scss
.grid__item {
  animation: stk-in var(--e26-dur-base) var(--e26-ease-out) both;
}
@for $i from 1 through 10 {
  .grid__item:nth-child(#{$i}) { animation-delay: #{$i * 22}ms; }
}
@media (prefers-reduced-motion: reduce) {
  .grid__item { animation: none; }
}
```

> No escalonar al **filtrar** (sería molesto en cada toque de chip). El stagger es
> solo para la carga inicial de la pantalla. Si se quiere ser estricto, aplicar
> la clase de animación solo en el primer render.

---

## 5. Transiciones de ruta Angular

Transición suave y rápida entre pantallas. Definir una vez y aplicarla al
`router-outlet` del shell. Duración corta — la navegación debe sentirse
instantánea.

```ts
// route-animations.ts
import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeFade = trigger('routeFade', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({ position: 'absolute', width: '100%' }),
    ], { optional: true }),
    group([
      query(':leave', [
        animate('140ms cubic-bezier(.55,0,1,.45)', style({ opacity: 0 })),
      ], { optional: true }),
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(6px)' }),
        animate('200ms cubic-bezier(.22,1,.36,1)', style({ opacity: 1, transform: 'none' })),
      ], { optional: true }),
    ]),
  ]),
]);
```

En el shell:

```ts
import { routeFade } from './route-animations';
// ...
@Component({
  // ...
  animations: [routeFade],
  template: `
    ...
    <main class="shell__content" [@routeFade]="currentUrl()">
      <router-outlet></router-outlet>
    </main>
    ...
  `,
})
// Exponer la URL actual como signal desde el Router y usarla como estado del trigger.
```

> Asegurar `provideAnimationsAsync()` en el bootstrap. Mantener las duraciones
> cortas (≤200ms) para que cambiar de pestaña no se sienta lento.

---

## 6. Micro-interacciones

Ya integradas en los componentes — referencia rápida de qué hace cada una. Todas
mínimas, sin glow ni rebotes:

- **Botón** (`e26-button`): `translateY(1px)` al `:active` + cambio de fondo en
  `:hover`. Sensación de pulsado físico, nada más.
- **Chip** (`e26-chip`): `translateY(1px)` al `:active`, transición de
  fondo/color al seleccionar.
- **Sticker flip**: `rotateY(180deg)` al tocar — el único uso de
  `--e26-ease-spring`, y con rebote contenido.
- **Bottom-nav**: el ítem activo cambia de color (texto + icono) a
  `--e26-primary`. Sin glow, sin escala.
- **Barra de progreso**: el `width` anima con `--e26-dur-slow`; al 100% el fill
  cambia a `--e26-accent` (señal de logro, sin efectos).

Para añadir una nueva: mantener ≤`--e26-dur-base`, animar solo
`transform`/`opacity`, y preferir cambios de estado claros sobre movimiento.

---

## 7. `prefers-reduced-motion`

No es opcional. Patrón estándar al final de cada bloque de estilos con animación:

```scss
@media (prefers-reduced-motion: reduce) {
  .lo-que-anima {
    animation: none;
    transition-duration: 1ms;
  }
}
```

Para lógica en TS (como `CountUpDirective`), comprobar con
`window.matchMedia('(prefers-reduced-motion: reduce)').matches` y saltar directo
al estado final.

Checklist: revelado de figurita, conteo del marcador, stagger del grid,
transición de ruta, shimmer del skeleton, flip de figurita — **todos** tienen su
rama reduce. Si se añade movimiento nuevo, añadir la rama también.