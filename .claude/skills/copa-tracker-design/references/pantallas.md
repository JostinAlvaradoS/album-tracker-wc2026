# Pantallas — Línea 26

Patrones de pantalla completos para el tracker del álbum. **Las dos pantallas
centrales son Álbum y Perfil/estadísticas** — ahí va el grueso del pulido.
Intercambios se incluye como pantalla secundaria. Todas asumen que los
componentes de `componentes.md` ya existen y los tokens están cargados.

Índice:
1. Shell de la app (app-bar + bottom-nav + router)
2. **Álbum** — grid de figuritas + progreso  ← central
3. **Perfil y estadísticas**  ← central
4. Detalle de figurita
5. Intercambios — faltan / repes  (secundaria)

---

## 1. Shell de la app

Contenedor raíz: app-bar arriba, `<router-outlet>` en medio, bottom-nav abajo.
Fondo neutro de la app (sin gradientes — estética limpia). Maneja el padding para
que el contenido no quede bajo las barras.

```ts
import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { E26AppBarComponent } from './ui/e26-app-bar.component';
import { E26BottomNavComponent, NavItem } from './ui/e26-bottom-nav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, E26AppBarComponent, E26BottomNavComponent],
  template: `
    <div class="shell">
      <e26-app-bar [title]="title()"></e26-app-bar>

      <main class="shell__content">
        <router-outlet></router-outlet>
      </main>

      <e26-bottom-nav
        [items]="navItems"
        [activeId]="activeNav()"
        (select)="go($event)">
      </e26-bottom-nav>
    </div>
  `,
  styles: [`
    .shell {
      min-height: 100dvh;
      background: var(--e26-bg);
    }
    .shell__content {
      /* deja aire para app-bar (sticky) y bottom-nav (fixed ~70px + safe) */
      padding: var(--e26-space-4);
      padding-bottom: calc(var(--e26-space-8) + var(--e26-safe-bottom));
      max-width: 1200px;
      margin-inline: auto;
    }
  `],
})
export class AppShellComponent {
  title = signal('Mi Álbum');
  activeNav = signal('album');

  // Intercambios va último — es la pantalla secundaria
  navItems: NavItem[] = [
    { id: 'album',   label: 'Álbum',  icon: 'layout-grid' },
    { id: 'profile', label: 'Perfil', icon: 'user' },
    { id: 'swaps',   label: 'Cambios', icon: 'arrow-left-right' },
  ];

  constructor(private router: Router) {}

  go(id: string) {
    this.activeNav.set(id);
    this.router.navigate(['/', id]);
    const titles: Record<string, string> = {
      album: 'Mi Álbum', profile: 'Mi Perfil', swaps: 'Intercambios',
    };
    this.title.set(titles[id] ?? '');
  }
}
```

---

## 2. Álbum — grid de figuritas + progreso  ← PANTALLA CENTRAL

La pantalla que define la app. De arriba abajo: tarjeta de progreso → fila de
chips de filtro (scroll horizontal) → grid de figuritas. Mucho aire entre
bloques; el grid es la única zona densa. Mobile-first: 3 columnas que crecen en
pantallas grandes (regla en `layout-responsive.md`).

```ts
import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { E26ProgressComponent } from '../ui/e26-progress.component';
import { E26ChipComponent } from '../ui/e26-chip.component';
import { E26StickerComponent, StickerVM } from '../ui/e26-sticker.component';
import { E26SkeletonComponent } from '../ui/e26-skeleton.component';

type Filtro = 'all' | 'owned' | 'missing' | 'dupe';

@Component({
  selector: 'page-album',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [E26ProgressComponent, E26ChipComponent, E26StickerComponent, E26SkeletonComponent],
  template: `
    <e26-progress
      [ownedCount]="ownedCount()"
      [total]="stickers().length"
      [dupes]="dupeCount()">
    </e26-progress>

    <div class="filters" role="tablist" aria-label="Filtrar figuritas">
      <e26-chip [selected]="filter() === 'all'"     [count]="stickers().length"
                (toggle)="filter.set('all')">Todas</e26-chip>
      <e26-chip [selected]="filter() === 'missing'" [count]="missingCount()"
                (toggle)="filter.set('missing')">Faltan</e26-chip>
      <e26-chip [selected]="filter() === 'dupe'"    [count]="dupeCount()"
                (toggle)="filter.set('dupe')">Repes</e26-chip>
      <e26-chip [selected]="filter() === 'owned'"   [count]="ownedCount()"
                (toggle)="filter.set('owned')">Tengo</e26-chip>
    </div>

    @if (loading()) {
      <div class="grid">
        @for (i of skeletons; track i) { <e26-skeleton shape="sticker" /> }
      </div>
    } @else if (visible().length === 0) {
      <div class="empty">
        <p class="empty__title">Nada por aquí</p>
        <p class="empty__text">No tienes figuritas en este filtro todavía.</p>
      </div>
    } @else {
      <div class="grid">
        @for (s of visible(); track s.code) {
          <e26-sticker [data]="s" class="grid__item" />
        }
      </div>
    }
  `,
  styles: [`
    .filters {
      display: flex;
      gap: var(--e26-space-2);
      overflow-x: auto;
      padding: var(--e26-space-5) 0;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }
    .filters::-webkit-scrollbar { display: none; }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--e26-space-3);
    }
    @media (min-width: 480px)  { .grid { grid-template-columns: repeat(4, 1fr); } }
    @media (min-width: 768px)  { .grid { grid-template-columns: repeat(6, 1fr); gap: var(--e26-space-4); } }
    @media (min-width: 1024px) { .grid { grid-template-columns: repeat(8, 1fr); } }

    /* entrada escalonada sutil — ver animaciones.md */
    .grid__item {
      animation: stk-in var(--e26-dur-base) var(--e26-ease-out) both;
    }
    @keyframes stk-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .grid__item { animation: none; }
    }

    .empty {
      text-align: center;
      padding: var(--e26-space-8) var(--e26-space-4);
    }
    .empty__title {
      font-size: var(--e26-fs-lg);
      color: var(--e26-text);
      margin: 0 0 var(--e26-space-1);
    }
    .empty__text { font-size: var(--e26-fs-sm); color: var(--e26-text-muted); margin: 0; }
  `],
})
export class PageAlbumComponent {
  loading = signal(false);
  skeletons = Array.from({ length: 18 }, (_, i) => i);
  filter = signal<Filtro>('all');

  // sustituir por datos reales del servicio del proyecto
  stickers = signal<StickerVM[]>([]);

  ownedCount   = computed(() => this.stickers().filter(s => s.status === 'owned').length);
  missingCount = computed(() => this.stickers().filter(s => s.status === 'missing').length);
  dupeCount    = computed(() => this.stickers().filter(s => s.status === 'dupe').length);

  visible = computed(() => {
    const f = this.filter();
    return f === 'all' ? this.stickers() : this.stickers().filter(s => s.status === f);
  });
}
```

Notas:
- Los `track` por `code` evitan recrear el DOM al filtrar — clave con muchas
  figuritas.
- Para listas muy largas (cientos), considerar `@defer` o virtual scroll del CDK.
- El estado vacío puede afinar su texto según filtro con un `@switch` sobre
  `filter()` si se quiere más específico.

---

## 3. Perfil y estadísticas  ← PANTALLA CENTRAL

La otra pantalla central. Cabecera con avatar + nombre, una rejilla de stat cards
(porcentaje, total pegadas, repes, equipos completos) y el progreso por equipo en
mini barras. Limpia, con aire, los números como protagonistas.

```ts
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { E26StatComponent } from '../ui/e26-stat.component';

interface TeamProgress { name: string; pct: number; }

@Component({
  selector: 'page-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [E26StatComponent],
  template: `
    <header class="profile__head">
      <div class="profile__avatar e26-display">{{ initials() }}</div>
      <div>
        <h2 class="e26-display profile__name">{{ user().name }}</h2>
        <span class="profile__since">Coleccionando desde {{ user().since }}</span>
      </div>
    </header>

    <div class="stats">
      <e26-stat label="Completado" accent="primary">{{ pct() }}%</e26-stat>
      <e26-stat label="Pegadas">{{ owned() }}</e26-stat>
      <e26-stat label="Repes" accent="amber">{{ dupes() }}</e26-stat>
      <e26-stat label="Equipos full" accent="info">{{ teamsDone() }}</e26-stat>
    </div>

    <section class="by-team">
      <span class="e26-eyebrow">Progreso por equipo</span>
      <div class="by-team__list">
        @for (t of teams(); track t.name) {
          <div class="team-row">
            <span class="team-row__name">{{ t.name }}</span>
            <div class="team-row__track">
              <div class="team-row__fill" [style.width.%]="t.pct"></div>
            </div>
            <span class="team-row__pct e26-code">{{ t.pct }}%</span>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .profile__head {
      display: flex;
      align-items: center;
      gap: var(--e26-space-4);
      margin-bottom: var(--e26-space-6);
    }
    .profile__avatar {
      width: 60px; height: 60px;
      display: grid; place-items: center;
      border-radius: var(--e26-radius-pill);
      background: var(--e26-primary-soft);
      color: var(--e26-primary);
      font-size: var(--e26-fs-xl);
    }
    .profile__name { font-size: var(--e26-fs-2xl); margin: 0; color: var(--e26-text); }
    .profile__since { font-size: var(--e26-fs-sm); color: var(--e26-text-subtle); }

    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--e26-space-3);
      margin-bottom: var(--e26-space-6);
    }
    @media (min-width: 768px) { .stats { grid-template-columns: repeat(4, 1fr); } }

    .by-team__list { margin-top: var(--e26-space-4); }
    .team-row {
      display: grid;
      grid-template-columns: 1fr 2fr auto;
      align-items: center;
      gap: var(--e26-space-3);
      margin-bottom: var(--e26-space-3);
    }
    .team-row__name { font-size: var(--e26-fs-sm); color: var(--e26-text); }
    .team-row__track {
      height: 6px;
      background: var(--e26-surface-2);
      border-radius: var(--e26-radius-pill);
      overflow: hidden;
    }
    .team-row__fill {
      height: 100%;
      background: var(--e26-primary);
      border-radius: var(--e26-radius-pill);
      transition: width var(--e26-dur-slow) var(--e26-ease-out);
    }
    .team-row__pct { font-size: var(--e26-fs-xs); color: var(--e26-text-subtle); }
    @media (prefers-reduced-motion: reduce) {
      .team-row__fill { transition-duration: 1ms; }
    }
  `],
})
export class PageProfileComponent {
  // sustituir por datos reales del servicio
  user = signal({ name: 'Coleccionista', since: '2026' });
  owned = signal(0);
  total = signal(0);
  dupes = signal(0);
  teamsDone = signal(0);
  teams = signal<TeamProgress[]>([]);

  initials = () => this.user().name.slice(0, 2).toUpperCase();
  pct = () => this.total() ? Math.round((this.owned() / this.total()) * 100) : 0;
}
```

> Las stat cards usan el acento solo en el número (`accent="primary|amber|info"`),
> el resto de la tarjeta queda neutro — así el color comunica sin saturar. Para
> el conteo animado de los números, ver `animaciones.md`.

---

## 4. Detalle de figurita

Se abre al tocar una figurita (ruta `/album/:code` o como sheet inferior). Figura
grande, código mono, equipo, estado, y acción contextual abajo (tercio inferior,
pulgar). Mucho aire, fondo neutro.

```html
<div class="detail">
  <div class="detail__hero">
    <e26-sticker [data]="sticker" class="detail__card"></e26-sticker>
  </div>

  <div class="detail__info">
    <span class="e26-code detail__code">{{ sticker.code }}</span>
    <h2 class="e26-display detail__name">{{ sticker.name }}</h2>
    <span class="detail__team">{{ sticker.team }}</span>
  </div>

  <div class="detail__action">
    @if (sticker.status === 'missing') {
      <e26-button variant="primary" size="lg" [block]="true">Marcar como pegada</e26-button>
    } @else if (sticker.status === 'dupe') {
      <e26-button variant="soft" size="lg" [block]="true">Tengo {{ sticker.dupes }} repes</e26-button>
    } @else {
      <e26-button variant="ghost" size="lg" [block]="true">Ya la tienes ✓</e26-button>
    }
  </div>
</div>
```

```scss
.detail {
  display: flex;
  flex-direction: column;
  gap: var(--e26-space-6);
  min-height: 70dvh;
}
.detail__hero { display: flex; justify-content: center; padding-top: var(--e26-space-5); }
.detail__card { width: 66%; max-width: 300px; }
.detail__info { text-align: center; }
.detail__code { color: var(--e26-info); font-size: var(--e26-fs-sm); }
.detail__name { font-size: var(--e26-fs-2xl); color: var(--e26-text); margin: var(--e26-space-1) 0; }
.detail__team { color: var(--e26-text-subtle); }
.detail__action { margin-top: auto; }
```

---

## 5. Intercambios — faltan / repes  (PANTALLA SECUNDARIA)

No es el foco de la app, pero el patrón existe por si se necesita. Dos secciones:
"Mis repes" (lo que ofreces) y "Me faltan" (lo que buscas). Cada fila: figurita
chica + datos + acción.

```html
<section class="swaps">
  <header class="swaps__head">
    <h2 class="e26-display">Mis repes</h2>
    <e26-badge [value]="dupes.length" variant="accent"></e26-badge>
  </header>

  @if (dupes.length === 0) {
    <p class="swaps__empty">Cuando tengas figuritas repetidas, aparecerán aquí
      listas para intercambiar.</p>
  } @else {
    @for (s of dupes; track s.code) {
      <article class="swap-row">
        <e26-sticker [data]="s" class="swap-row__thumb"></e26-sticker>
        <div class="swap-row__info">
          <span class="e26-code">{{ s.code }}</span>
          <strong>{{ s.name }}</strong>
          <span class="swap-row__team">{{ s.team }} · ×{{ s.dupes }}</span>
        </div>
        <e26-button variant="soft">Ofrecer</e26-button>
      </article>
    }
  }
</section>

<section class="swaps">
  <header class="swaps__head">
    <h2 class="e26-display">Me faltan</h2>
    <e26-badge [value]="missing.length" variant="info"></e26-badge>
  </header>
  <!-- mismo patrón de fila, acción "Buscar" -->
</section>
```

```scss
.swaps { margin-bottom: var(--e26-space-6); }
.swaps__head {
  display: flex;
  align-items: center;
  gap: var(--e26-space-3);
  margin-bottom: var(--e26-space-4);
}
.swaps__head h2 { font-size: var(--e26-fs-xl); margin: 0; color: var(--e26-text); }
.swaps__empty {
  color: var(--e26-text-muted);
  font-size: var(--e26-fs-sm);
  background: var(--e26-surface);
  border: 1px solid var(--e26-border);
  border-radius: var(--e26-radius-md);
  padding: var(--e26-space-5);
  margin: 0;
}
.swap-row {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: center;
  gap: var(--e26-space-3);
  background: var(--e26-surface);
  border: 1px solid var(--e26-border);
  border-radius: var(--e26-radius-md);
  padding: var(--e26-space-3);
  margin-bottom: var(--e26-space-2);
  box-shadow: var(--e26-shadow-sm);
}
.swap-row__thumb { width: 52px; }
.swap-row__info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.swap-row__info strong { font-size: var(--e26-fs-md); color: var(--e26-text); }
.swap-row__info .e26-code { font-size: var(--e26-fs-xs); color: var(--e26-info); }
.swap-row__team { font-size: var(--e26-fs-xs); color: var(--e26-text-subtle); }
@media (min-width: 768px) {
  /* en tablet+, las dos secciones lado a lado */
  .swaps-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: var(--e26-space-6); }
}
```

---

## Orden de construcción sugerido

1. Shell (§1) — sin esto no hay dónde montar nada.
2. **Álbum (§2)** — pantalla central, define la app. Aquí el grueso del pulido.
3. **Perfil (§3)** — la otra pantalla central.
4. Detalle (§4) — cierra el loop de "tocar una figurita".
5. Intercambios (§5) — secundaria, solo si se necesita.

Para el detalle de animaciones de entrada, transición de ruta y revelado de
figurita, ver `animaciones.md` (todas sutiles). Para que estos grids y layouts
escalen bien de teléfono a desktop, ver `layout-responsive.md`.