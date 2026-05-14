# Componentes — Línea 26

Componentes Angular 17+ standalone, mobile-first, estética moderna y limpia.
Todos asumen que los tokens (`_estadio26-tokens.scss`) ya están cargados
globalmente. Cada componente trae `.ts` + plantilla inline + estilos. Adaptar
nombres de carpeta/selector al proyecto. Para NgModules clásicos, mover lo de
`imports:` al módulo.

Índice:
1. Botón (`e26-button`)
2. Chip / filtro (`e26-chip`)
3. Tarjeta de figurita (`e26-sticker`) — tres estados, limpia
4. Barra de progreso (`e26-progress`)
5. Badge de cantidad (`e26-badge`)
6. Stat card (`e26-stat`)
7. App-bar (`e26-app-bar`)
8. Bottom-nav (`e26-bottom-nav`)
9. Skeleton de carga (`e26-skeleton`)

---

## 1. Botón — `e26-button`

Variantes: `primary` (verde sólido, acción principal), `soft` (fondo tenue,
acción secundaria discreta), `ghost` (solo borde). Tamaños `md` y `lg`.
Estética limpia: sin glow, sombras mínimas, el peso lo da el color sólido.

```ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'e26-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="e26-btn"
      [class.e26-btn--primary]="variant === 'primary'"
      [class.e26-btn--soft]="variant === 'soft'"
      [class.e26-btn--ghost]="variant === 'ghost'"
      [class.e26-btn--lg]="size === 'lg'"
      [class.e26-btn--block]="block"
      [disabled]="disabled">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .e26-btn {
      font-family: var(--e26-font-body);
      font-weight: 600;
      font-size: var(--e26-fs-md);
      border: 1px solid transparent;
      border-radius: var(--e26-radius-md);
      padding: var(--e26-space-3) var(--e26-space-5);
      min-height: 44px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--e26-space-2);
      transition: background var(--e26-dur-fast) var(--e26-ease-out),
                  transform var(--e26-dur-fast) var(--e26-ease-out);
      outline: none;
    }
    .e26-btn:active:not(:disabled) { transform: translateY(1px); }
    .e26-btn:focus-visible {
      box-shadow: 0 0 0 2px var(--e26-bg), 0 0 0 4px var(--e26-info);
    }
    .e26-btn:disabled { opacity: .45; cursor: not-allowed; }

    .e26-btn--primary {
      background: var(--e26-primary);
      color: var(--e26-primary-on);
    }
    .e26-btn--primary:hover:not(:disabled) { background: var(--e26-primary-press); }

    .e26-btn--soft {
      background: var(--e26-primary-soft);
      color: var(--e26-primary);
    }
    .e26-btn--soft:hover:not(:disabled) { background: var(--e26-surface-3); }

    .e26-btn--ghost {
      background: transparent;
      color: var(--e26-text);
      border-color: var(--e26-border-strong);
    }
    .e26-btn--ghost:hover:not(:disabled) { background: var(--e26-surface-2); }

    .e26-btn--lg { font-size: var(--e26-fs-lg); min-height: 52px; padding: var(--e26-space-4) var(--e26-space-6); }
    .e26-btn--block { width: 100%; }
  `],
})
export class E26ButtonComponent {
  @Input() variant: 'primary' | 'soft' | 'ghost' = 'primary';
  @Input() size: 'md' | 'lg' = 'md';
  @Input() block = false;
  @Input() disabled = false;
}
```

---

## 2. Chip / filtro — `e26-chip`

Para filtrar el álbum ("Todas", "Faltan", "Repes", "Tengo"). Seleccionado = fondo
tenue de color + texto de color; no seleccionado = neutro. Discreto.

```ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'e26-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="e26-chip"
      [class.e26-chip--selected]="selected"
      [attr.aria-pressed]="selected"
      (click)="toggle.emit()">
      <ng-content></ng-content>
      @if (count != null) { <span class="e26-chip__count">{{ count }}</span> }
    </button>
  `,
  styles: [`
    .e26-chip {
      font-family: var(--e26-font-body);
      font-weight: 600;
      font-size: var(--e26-fs-sm);
      color: var(--e26-text-muted);
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-pill);
      padding: var(--e26-space-2) var(--e26-space-4);
      min-height: 38px;
      display: inline-flex;
      align-items: center;
      gap: var(--e26-space-2);
      cursor: pointer;
      white-space: nowrap;
      transition: background var(--e26-dur-fast) var(--e26-ease-out),
                  color var(--e26-dur-fast) var(--e26-ease-out),
                  border-color var(--e26-dur-fast) var(--e26-ease-out);
    }
    .e26-chip:active { transform: translateY(1px); }
    .e26-chip:focus-visible {
      box-shadow: 0 0 0 2px var(--e26-bg), 0 0 0 4px var(--e26-info);
      outline: none;
    }
    .e26-chip--selected {
      color: var(--e26-primary);
      background: var(--e26-primary-soft);
      border-color: transparent;
    }
    .e26-chip__count {
      font-family: var(--e26-font-mono);
      font-size: var(--e26-fs-xs);
      color: var(--e26-text-subtle);
    }
    .e26-chip--selected .e26-chip__count { color: var(--e26-primary); }
  `],
})
export class E26ChipComponent {
  @Input() selected = false;
  @Input() count: number | null = null;
  @Output() toggle = new EventEmitter<void>();
}
```

---

## 3. Tarjeta de figurita — `e26-sticker`

El componente estrella. Tres estados (`owned` / `missing` / `dupe`) legibles de
un vistazo. Limpia: sin barridos de luz ni efectos; la diferencia es nitidez,
borde y un indicador discreto. Mantiene el flip al tocar para ver el reverso.

```ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export interface StickerVM {
  code: string;          // "ARG-07"
  name: string;          // "Jugador / escudo"
  team: string;          // "Argentina"
  imageUrl?: string;     // arte de la figurita (opcional)
  status: 'owned' | 'missing' | 'dupe';
  dupes?: number;        // nº de repetidas si status === 'dupe'
}

@Component({
  selector: 'e26-sticker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="stk"
      [class.stk--owned]="data.status === 'owned'"
      [class.stk--missing]="data.status === 'missing'"
      [class.stk--dupe]="data.status === 'dupe'"
      [class.stk--flipped]="flipped"
      [attr.aria-label]="ariaLabel"
      (click)="flipped = !flipped">

      <div class="stk__inner">
        <!-- ANVERSO -->
        <div class="stk__face stk__front">
          @if (data.imageUrl && data.status !== 'missing') {
            <img class="stk__img" [src]="data.imageUrl" [alt]="data.name" />
          } @else {
            <div class="stk__placeholder e26-display">{{ data.team.slice(0,3) }}</div>
          }
          <span class="stk__code e26-code">{{ data.code }}</span>

          @if (data.status === 'owned') {
            <span class="stk__check" aria-hidden="true">✓</span>
          }
          @if (data.status === 'dupe' && data.dupes) {
            <span class="stk__dupe-badge">×{{ data.dupes }}</span>
          }
        </div>

        <!-- REVERSO -->
        <div class="stk__face stk__back">
          <span class="stk__code e26-code">{{ data.code }}</span>
          <strong class="stk__name">{{ data.name }}</strong>
          <span class="stk__team">{{ data.team }}</span>
        </div>
      </div>
    </button>
  `,
  styles: [`
    .stk {
      all: unset;
      cursor: pointer;
      aspect-ratio: 3 / 4;
      width: 100%;
      perspective: 800px;
      display: block;
    }
    .stk:focus-visible .stk__inner {
      box-shadow: 0 0 0 2px var(--e26-bg), 0 0 0 4px var(--e26-info);
    }
    .stk__inner {
      position: relative;
      width: 100%; height: 100%;
      border-radius: var(--e26-radius-md);
      transition: transform var(--e26-dur-slow) var(--e26-ease-spring);
      transform-style: preserve-3d;
    }
    .stk--flipped .stk__inner { transform: rotateY(180deg); }

    .stk__face {
      position: absolute; inset: 0;
      border-radius: var(--e26-radius-md);
      backface-visibility: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
    }

    /* ----- anverso por estado: diferencias sobrias ----- */
    .stk--owned   .stk__front {
      border-color: var(--e26-primary);
      box-shadow: var(--e26-shadow-sm);
    }
    .stk--missing .stk__front {
      background: var(--e26-surface-2);
      border-style: dashed;
      border-color: var(--e26-border-strong);
    }
    .stk--missing .stk__img,
    .stk--missing .stk__placeholder { opacity: .35; filter: grayscale(1); }
    .stk--dupe    .stk__front {
      border-color: var(--e26-accent);
      box-shadow: var(--e26-shadow-sm);
    }

    .stk__img { width: 100%; height: 100%; object-fit: cover; }
    .stk__placeholder {
      font-size: var(--e26-fs-2xl);
      color: var(--e26-text);
    }
    .stk--missing .stk__placeholder { color: var(--e26-text-subtle); }

    .stk__code {
      position: absolute;
      bottom: var(--e26-space-1);
      left: var(--e26-space-1);
      font-size: var(--e26-fs-xs);
      color: var(--e26-text-muted);
      background: var(--e26-surface);
      padding: 1px var(--e26-space-1);
      border-radius: var(--e26-radius-sm);
    }
    /* indicador "obtenida": check verde discreto, esquina sup. */
    .stk__check {
      position: absolute;
      top: var(--e26-space-1);
      right: var(--e26-space-1);
      width: 18px; height: 18px;
      display: grid; place-items: center;
      font-size: 11px; font-weight: 700;
      color: var(--e26-primary-on);
      background: var(--e26-primary);
      border-radius: var(--e26-radius-pill);
    }
    .stk__dupe-badge {
      position: absolute;
      top: var(--e26-space-1);
      right: var(--e26-space-1);
      font-family: var(--e26-font-mono);
      font-size: var(--e26-fs-xs);
      font-weight: 700;
      color: var(--e26-accent-on);
      background: var(--e26-accent);
      border-radius: var(--e26-radius-pill);
      padding: 1px var(--e26-space-2);
    }

    /* ----- reverso ----- */
    .stk__back {
      transform: rotateY(180deg);
      gap: var(--e26-space-1);
      padding: var(--e26-space-3);
      text-align: center;
    }
    .stk__back .stk__code { position: static; background: none; padding: 0; color: var(--e26-info); }
    .stk__name { font-size: var(--e26-fs-sm); color: var(--e26-text); }
    .stk__team { font-size: var(--e26-fs-xs); color: var(--e26-text-subtle); }

    @media (prefers-reduced-motion: reduce) {
      .stk__inner { transition-duration: 1ms; }
    }
  `],
})
export class E26StickerComponent {
  @Input({ required: true }) data!: StickerVM;
  flipped = false;

  get ariaLabel(): string {
    const estado = this.data.status === 'owned' ? 'obtenida'
      : this.data.status === 'dupe' ? `repetida ${this.data.dupes ?? ''}` : 'faltante';
    return `Figurita ${this.data.code}, ${this.data.name}, ${estado}`;
  }
}
```

---

## 4. Barra de progreso — `e26-progress`

El progreso del álbum tratado como pieza de dashboard: número grande y limpio
con la display font, porcentaje discreto, barra fina. Sin gradientes ni glow —
verde sólido sobre carril neutro.

```ts
import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'e26-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="pg" [attr.aria-label]="'Progreso del álbum: ' + pct() + ' por ciento'">
      <span class="e26-eyebrow">Progreso del álbum</span>

      <div class="pg__count e26-display">
        {{ owned }}<span class="pg__total">/ {{ total }}</span>
        <span class="pg__pct e26-code">{{ pct() }}%</span>
      </div>

      <div class="pg__track" role="progressbar"
           [attr.aria-valuenow]="pct()" aria-valuemin="0" aria-valuemax="100">
        <div class="pg__fill" [style.width.%]="pct()"
             [class.pg__fill--complete]="pct() === 100"></div>
      </div>

      <div class="pg__meta">
        <span>{{ total - owned }} te faltan</span>
        @if (dupes != null) { <span class="pg__dupes">{{ dupes }} repes</span> }
      </div>
    </section>
  `,
  styles: [`
    .pg {
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-lg);
      padding: var(--e26-space-5);
      box-shadow: var(--e26-shadow-sm);
    }
    .pg__count {
      font-size: var(--e26-fs-3xl);
      color: var(--e26-text);
      margin: var(--e26-space-2) 0 var(--e26-space-4);
      display: flex;
      align-items: baseline;
      gap: var(--e26-space-2);
    }
    .pg__total {
      font-size: var(--e26-fs-lg);
      color: var(--e26-text-subtle);
      font-family: var(--e26-font-body);
    }
    .pg__pct {
      margin-left: auto;
      font-size: var(--e26-fs-sm);
      color: var(--e26-primary);
    }
    .pg__track {
      height: 8px;
      background: var(--e26-surface-2);
      border-radius: var(--e26-radius-pill);
      overflow: hidden;
    }
    .pg__fill {
      height: 100%;
      background: var(--e26-primary);
      border-radius: var(--e26-radius-pill);
      transition: width var(--e26-dur-slow) var(--e26-ease-out);
    }
    .pg__fill--complete { background: var(--e26-accent); }
    .pg__meta {
      display: flex;
      gap: var(--e26-space-4);
      margin-top: var(--e26-space-3);
      font-size: var(--e26-fs-sm);
      color: var(--e26-text-muted);
    }
    .pg__dupes { color: var(--e26-accent); }
    @media (prefers-reduced-motion: reduce) {
      .pg__fill { transition-duration: 1ms; }
    }
  `],
})
export class E26ProgressComponent {
  @Input({ required: true }) set ownedCount(v: number) { this._owned.set(v); }
  @Input({ required: true }) total = 0;
  @Input() dupes: number | null = null;

  private _owned = signal(0);
  get owned() { return this._owned(); }
  pct = computed(() =>
    this.total ? Math.round((this._owned() / this.total) * 100) : 0
  );
}
```

> Para el conteo animado del número (que suba de 0 al valor real), ver
> `animaciones.md` § "Conteo del marcador".

---

## 5. Badge de cantidad — `e26-badge`

Pequeño indicador numérico. Variantes `primary`, `accent`, `info`. Usa los
fondos `-soft` para no gritar — acorde a la estética limpia.

```ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'e26-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="bdg"
      [class.bdg--primary]="variant === 'primary'"
      [class.bdg--accent]="variant === 'accent'"
      [class.bdg--info]="variant === 'info'"
      [class.bdg--solid]="solid">{{ value }}</span>
  `,
  styles: [`
    .bdg {
      font-family: var(--e26-font-mono);
      font-size: var(--e26-fs-xs);
      font-weight: 700;
      border-radius: var(--e26-radius-pill);
      padding: 2px var(--e26-space-2);
      min-width: 18px;
      text-align: center;
      display: inline-block;
      line-height: 1.45;
    }
    /* por defecto: fondo tenue + texto de color (discreto) */
    .bdg--primary { background: var(--e26-primary-soft); color: var(--e26-primary); }
    .bdg--accent  { background: var(--e26-accent-soft);  color: var(--e26-accent); }
    .bdg--info    { background: var(--e26-info-soft);    color: var(--e26-info); }
    /* sólido: para cuando necesita destacar de verdad (notif. en nav) */
    .bdg--solid.bdg--primary { background: var(--e26-primary); color: var(--e26-primary-on); }
    .bdg--solid.bdg--accent  { background: var(--e26-accent);  color: var(--e26-accent-on); }
    .bdg--solid.bdg--info    { background: var(--e26-info);    color: var(--e26-info-on); }
  `],
})
export class E26BadgeComponent {
  @Input({ required: true }) value: number | string = 0;
  @Input() variant: 'primary' | 'accent' | 'info' = 'primary';
  @Input() solid = false;
}
```

---

## 6. Stat card — `e26-stat`

Tarjeta de estadística para la pantalla de Perfil: un número grande, una
etiqueta. Limpia, neutra, con un acento opcional de color en el número.

```ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'e26-stat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat" [class.stat--accent]="accent">
      <span class="stat__num e26-display"
        [class.stat__num--primary]="accent === 'primary'"
        [class.stat__num--amber]="accent === 'amber'"
        [class.stat__num--info]="accent === 'info'">
        <ng-content></ng-content>
      </span>
      <span class="stat__label e26-eyebrow">{{ label }}</span>
    </div>
  `,
  styles: [`
    .stat {
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-lg);
      padding: var(--e26-space-4);
      box-shadow: var(--e26-shadow-sm);
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-1);
    }
    .stat__num {
      font-size: var(--e26-fs-2xl);
      color: var(--e26-text);
    }
    .stat__num--primary { color: var(--e26-primary); }
    .stat__num--amber   { color: var(--e26-accent); }
    .stat__num--info    { color: var(--e26-info); }
    .stat__label { color: var(--e26-text-subtle); }
  `],
})
export class E26StatComponent {
  @Input({ required: true }) label = '';
  @Input() accent: 'primary' | 'amber' | 'info' | null = null;
}
```

---

## 7. App-bar — `e26-app-bar`

Barra superior, respeta el área segura del notch. Fondo de la app con blur sutil,
borde inferior fino. Título con display font. Slots opcionales a los lados.

```ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'e26-app-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <div class="bar__slot bar__slot--start"><ng-content select="[bar-start]"></ng-content></div>
      <h1 class="bar__title e26-display">{{ title }}</h1>
      <div class="bar__slot bar__slot--end"><ng-content select="[bar-end]"></ng-content></div>
    </header>
  `,
  styles: [`
    .bar {
      position: sticky;
      top: 0;
      z-index: var(--e26-z-sticky);
      display: grid;
      grid-template-columns: 44px 1fr 44px;
      align-items: center;
      gap: var(--e26-space-2);
      padding: var(--e26-space-3) var(--e26-space-4);
      padding-top: calc(var(--e26-space-3) + var(--e26-safe-top));
      background: color-mix(in srgb, var(--e26-bg) 85%, transparent);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--e26-border);
    }
    .bar__title {
      font-size: var(--e26-fs-xl);
      color: var(--e26-text);
      text-align: center;
      margin: 0;
    }
    .bar__slot { display: flex; align-items: center; }
    .bar__slot--end { justify-content: flex-end; }
  `],
})
export class E26AppBarComponent {
  @Input() title = '';
}
```

---

## 8. Bottom-nav — `e26-bottom-nav`

Navegación principal mobile, fija abajo, respeta gesture bar. El ítem activo se
marca con color (texto + icono), sin glow. Discreta y clara.

```ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

export interface NavItem {
  id: string;
  label: string;
  icon: string;     // nombre de icono (resuelto fuera)
  badge?: number;
}

@Component({
  selector: 'e26-bottom-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="nav" role="navigation" aria-label="Navegación principal">
      @for (item of items; track item.id) {
        <button
          class="nav__item"
          [class.nav__item--active]="item.id === activeId"
          [attr.aria-current]="item.id === activeId ? 'page' : null"
          (click)="select.emit(item.id)">
          <span class="nav__icon">
            <span [attr.data-icon]="item.icon"></span>
          </span>
          <span class="nav__label">{{ item.label }}</span>
          @if (item.badge) { <span class="nav__badge">{{ item.badge }}</span> }
        </button>
      }
    </nav>
  `,
  styles: [`
    .nav {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: var(--e26-z-nav);
      display: flex;
      justify-content: space-around;
      background: color-mix(in srgb, var(--e26-surface) 92%, transparent);
      backdrop-filter: blur(12px);
      border-top: 1px solid var(--e26-border);
      padding: var(--e26-space-2);
      padding-bottom: calc(var(--e26-space-2) + var(--e26-safe-bottom));
    }
    .nav__item {
      all: unset;
      flex: 1;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: var(--e26-space-2) 0;
      color: var(--e26-text-subtle);
      position: relative;
      transition: color var(--e26-dur-fast) var(--e26-ease-out);
    }
    .nav__item:focus-visible {
      box-shadow: 0 0 0 2px var(--e26-surface), 0 0 0 4px var(--e26-info);
      border-radius: var(--e26-radius-sm);
    }
    .nav__icon { font-size: 22px; line-height: 1; }
    .nav__label { font-size: var(--e26-fs-xs); font-weight: 600; }
    .nav__item--active { color: var(--e26-primary); }
    .nav__badge {
      position: absolute;
      top: 2px;
      left: 56%;
      font-family: var(--e26-font-mono);
      font-size: 10px;
      font-weight: 700;
      color: var(--e26-accent-on);
      background: var(--e26-accent);
      border-radius: var(--e26-radius-pill);
      padding: 0 5px;
    }
  `],
})
export class E26BottomNavComponent {
  @Input({ required: true }) items: NavItem[] = [];
  @Input() activeId = '';
  @Output() select = new EventEmitter<string>();
}
```

> En la práctica, conviene proyectar los iconos reales (Lucide) con un mapa de
> iconos en el padre, en vez del `data-icon` placeholder. Ver `pantallas.md` para
> el shell completo que conecta esto al router.

---

## 9. Skeleton de carga — `e26-skeleton`

Para el grid del álbum mientras carga. Forma de figurita, shimmer muy suave —
neutro, sin color.

```ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'e26-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="sk" [class.sk--sticker]="shape === 'sticker'"
                   [class.sk--line]="shape === 'line'" [style.width]="width"></div>`,
  styles: [`
    .sk {
      background: linear-gradient(100deg,
        var(--e26-surface-2) 30%,
        var(--e26-surface-3) 50%,
        var(--e26-surface-2) 70%);
      background-size: 220% 100%;
      animation: sk-shimmer 1.5s linear infinite;
      border-radius: var(--e26-radius-md);
    }
    .sk--sticker { aspect-ratio: 3 / 4; width: 100%; }
    .sk--line { height: 12px; border-radius: var(--e26-radius-pill); }
    @keyframes sk-shimmer {
      from { background-position: 200% 0; }
      to   { background-position: -200% 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .sk { animation: none; }
    }
  `],
})
export class E26SkeletonComponent {
  @Input() shape: 'sticker' | 'line' = 'sticker';
  @Input() width = '100%';
}
```

---

## Notas de integración

- Todos son `OnPush` — pasar datos inmutables o señales.
- Los selectores usan prefijo `e26-`; renombrar al prefijo del proyecto si hace
  falta evitar colisiones.
- Ningún componente importa los tokens: dependen de que `_estadio26-tokens.scss`
  esté cargado en `styles.scss`. Si un componente se ve "sin estilo", falta ese
  import global.
- La estética es limpia: si al componer se acumula mucho color, retroceder —
  superficies neutras, color solo en el detalle que comunica algo.
- Para el grid que contiene las `e26-sticker` y las pantallas completas, ver
  `pantallas.md`.