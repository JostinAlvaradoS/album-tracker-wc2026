import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgIf, NgFor, NgSwitch, NgSwitchCase } from '@angular/common';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

interface NavRoute {
  id: string;
  path: string;
  label: string;
  title: string;
  icon: 'grid' | 'list' | 'swap' | 'chart' | 'search';
}

const NAV_ROUTES: NavRoute[] = [
  { id: 'home',       path: '/home',       label: 'Home',     title: 'Home',         icon: 'chart'  },
  { id: 'album',      path: '/album',      label: 'Álbum',    title: 'Mi álbum',     icon: 'grid'   },
  { id: 'faltas',     path: '/faltas',     label: 'Faltas',   title: 'Me faltan',    icon: 'list'   },
  { id: 'repes',      path: '/repes',      label: 'Repes',    title: 'Mis repes',    icon: 'swap'   },
  { id: 'comparador', path: '/comparador', label: 'Buscar',   title: 'Comparador',   icon: 'search' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, NgSwitch, NgSwitchCase, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <ng-container *ngIf="user() as u; else noShell">
      <div class="shell" [class.shell--dark]="theme() === 'dark'">

        <!-- ====== APP BAR ====== -->
        <header class="bar">
          <div class="bar__inner">
            <a class="brand" routerLink="/home" aria-label="Inicio">
              <span class="brand__mark" aria-hidden="true">
                <span class="brand__mark-line"></span>
                <span class="brand__mark-num e26-display">26</span>
              </span>
              <span class="brand__copy">
                <span class="e26-eyebrow brand__eyebrow">FWC 2026</span>
                <span class="brand__title e26-display">{{ pageTitle() }}</span>
              </span>
            </a>

            <div class="bar__actions">
              <button class="icon-btn" type="button"
                      (click)="toggleTheme()"
                      [attr.aria-label]="theme() === 'dark' ? 'Tema claro' : 'Tema oscuro'">
                <ng-container *ngIf="theme() === 'dark'; else moonIcon">
                  <!-- sun -->
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                       stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
                  </svg>
                </ng-container>
                <ng-template #moonIcon>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                       stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"></path>
                  </svg>
                </ng-template>
              </button>

              <div class="who" [title]="userLabel(u)">
                <span class="who__dot" [class.who__dot--anon]="u.isAnonymous"></span>
                <span class="who__label">{{ userLabel(u) }}</span>
              </div>

              <button class="icon-btn icon-btn--ghost" type="button"
                      (click)="logout()" aria-label="Salir">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                     stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <path d="m16 17 5-5-5-5"></path>
                  <path d="M21 12H9"></path>
                </svg>
              </button>
            </div>
          </div>
        </header>

        <!-- ====== CONTENIDO ====== -->
        <main class="content">
          <div class="content__inner">
            <router-outlet></router-outlet>
          </div>
        </main>

        <!-- ====== BOTTOM NAV (móvil/tablet) / SIDE RAIL (desktop) ====== -->
        <nav class="nav" aria-label="Navegación principal">
          <a *ngFor="let r of routes; trackBy: trackRoute"
             class="nav__item"
             [routerLink]="r.path"
             routerLinkActive="nav__item--active">
            <span class="nav__icon" aria-hidden="true">
              <ng-container [ngSwitch]="r.icon">
                <svg *ngSwitchCase="'grid'" viewBox="0 0 24 24" width="22" height="22"
                     fill="none" stroke="currentColor" stroke-width="1.6"
                     stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                  <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                </svg>
                <svg *ngSwitchCase="'list'" viewBox="0 0 24 24" width="22" height="22"
                     fill="none" stroke="currentColor" stroke-width="1.6"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 6h13M8 12h13M8 18h13"/>
                  <circle cx="3.5" cy="6" r="1"/>
                  <circle cx="3.5" cy="12" r="1"/>
                  <circle cx="3.5" cy="18" r="1"/>
                </svg>
                <svg *ngSwitchCase="'swap'" viewBox="0 0 24 24" width="22" height="22"
                     fill="none" stroke="currentColor" stroke-width="1.6"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 3 21 7l-4 4"/>
                  <path d="M21 7H9a4 4 0 0 0-4 4"/>
                  <path d="M7 21 3 17l4-4"/>
                  <path d="M3 17h12a4 4 0 0 0 4-4"/>
                </svg>
                <svg *ngSwitchCase="'chart'" viewBox="0 0 24 24" width="22" height="22"
                     fill="none" stroke="currentColor" stroke-width="1.6"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3v18h18"/>
                  <path d="M7 16V11"/>
                  <path d="M12 16V7"/>
                  <path d="M17 16v-3"/>
                </svg>
                <svg *ngSwitchCase="'search'" viewBox="0 0 24 24" width="22" height="22"
                     fill="none" stroke="currentColor" stroke-width="1.6"
                     stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="7"/>
                  <path d="m20 20-4-4"/>
                </svg>
              </ng-container>
            </span>
            <span class="nav__label">{{ r.label }}</span>
          </a>
        </nav>

      </div>
    </ng-container>

    <ng-template #noShell>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .shell {
      min-height: 100dvh;
      background: var(--e26-bg);
      display: grid;
      grid-template-rows: auto 1fr;
    }

    /* ===== APP BAR ===== */
    .bar {
      position: sticky;
      top: 0;
      z-index: var(--e26-z-sticky);
      background: color-mix(in srgb, var(--e26-bg) 86%, transparent);
      backdrop-filter: saturate(140%) blur(14px);
      -webkit-backdrop-filter: saturate(140%) blur(14px);
      border-bottom: 1px solid var(--e26-border);
      padding-top: var(--e26-safe-top);
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
    }
    .bar__inner {
      max-width: 1280px;
      margin-inline: auto;
      padding: var(--e26-space-3) var(--e26-space-4);
      display: flex;
      align-items: center;
      gap: var(--e26-space-3);
      min-height: 64px;
    }
    @media (min-width: 768px) {
      .bar__inner { padding: var(--e26-space-3) var(--e26-space-5); min-height: 72px; }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: var(--e26-space-3);
      text-decoration: none;
      color: var(--e26-text);
      flex: 1;
      min-width: 0;
      padding: var(--e26-space-1);
      margin: calc(-1 * var(--e26-space-1));
      border-radius: var(--e26-radius-md);
    }
    .brand__mark {
      position: relative;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      background: var(--e26-text);
      color: var(--e26-text-inverse);
      border-radius: var(--e26-radius-sm);
      flex-shrink: 0;
      overflow: hidden;
    }
    .brand__mark-line {
      position: absolute;
      left: 0; right: 0; bottom: 6px;
      height: 2px;
      background: var(--e26-primary);
    }
    .brand__mark-num {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1;
    }
    .brand__copy {
      display: flex;
      flex-direction: column;
      min-width: 0;
      line-height: 1.1;
    }
    .brand__eyebrow {
      font-size: 9px;
      margin-bottom: 2px;
    }
    .brand__title {
      font-size: var(--e26-fs-lg);
      color: var(--e26-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar__actions {
      display: flex;
      align-items: center;
      gap: var(--e26-space-2);
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: var(--e26-radius-pill);
      border: 1px solid var(--e26-border);
      background: var(--e26-surface);
      color: var(--e26-text-muted);
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: background var(--e26-dur-fast) var(--e26-ease-out),
                  color var(--e26-dur-fast) var(--e26-ease-out),
                  border-color var(--e26-dur-fast) var(--e26-ease-out);
    }
    .icon-btn:hover { color: var(--e26-text); border-color: var(--e26-border-strong); }
    .icon-btn:active { transform: translateY(1px); }
    .icon-btn--ghost { border-color: transparent; background: transparent; }
    .icon-btn--ghost:hover { background: var(--e26-surface-2); }

    .who {
      display: none;
      align-items: center;
      gap: var(--e26-space-2);
      padding: var(--e26-space-2) var(--e26-space-3);
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-pill);
      font-size: var(--e26-fs-sm);
      color: var(--e26-text-muted);
      max-width: 220px;
    }
    .who__label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .who__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--e26-primary);
      box-shadow: 0 0 0 3px var(--e26-primary-soft);
      flex-shrink: 0;
    }
    .who__dot--anon { background: var(--e26-accent); box-shadow: 0 0 0 3px var(--e26-accent-soft); }
    @media (min-width: 640px) { .who { display: inline-flex; } }

    /* ===== CONTENIDO ===== */
    .content {
      width: 100%;
      /* deja aire para el bottom-nav fijo en móvil */
      padding-bottom: calc(82px + var(--e26-safe-bottom));
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
      min-width: 0; /* evita que el grid se desborde por hijos largos */
    }
    .content__inner {
      max-width: 1200px;
      margin-inline: auto;
      padding: var(--e26-space-4);
      animation: page-in var(--e26-dur-slow) var(--e26-ease-out) both;
    }
    @media (min-width: 768px) {
      .content__inner { padding: var(--e26-space-5); }
    }
    @media (min-width: 1024px) {
      .shell {
        grid-template-columns: 92px minmax(0, 1fr);
        grid-template-rows: auto 1fr;
      }
      /* Colocación explícita — sin esto el flujo automático mete
         el contenido en la columna del rail y rompe el layout. */
      .bar     { grid-column: 1 / -1; grid-row: 1; }
      .nav     { grid-column: 1; grid-row: 2; }
      .content { grid-column: 2; grid-row: 2; padding-bottom: var(--e26-space-6); padding-left: 0; }
      .content__inner { padding: var(--e26-space-6) var(--e26-space-7); }
    }
    @media (min-width: 1280px) {
      .shell { grid-template-columns: 112px minmax(0, 1fr); }
    }

    @keyframes page-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .content__inner { animation: none; }
    }

    /* ===== NAV: bottom móvil → rail desktop ===== */
    .nav {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: var(--e26-z-nav);
      display: flex;
      justify-content: space-around;
      gap: var(--e26-space-1);
      padding-top: var(--e26-space-2);
      padding-bottom: calc(var(--e26-space-2) + var(--e26-safe-bottom));
      padding-left: calc(var(--e26-space-3) + env(safe-area-inset-left, 0px));
      padding-right: calc(var(--e26-space-3) + env(safe-area-inset-right, 0px));
      background: color-mix(in srgb, var(--e26-surface) 92%, transparent);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-top: 1px solid var(--e26-border);
    }
    .nav__item {
      flex: 1;
      max-width: 96px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: var(--e26-space-2) var(--e26-space-1);
      border-radius: var(--e26-radius-md);
      color: var(--e26-text-subtle);
      text-decoration: none;
      position: relative;
      transition: color var(--e26-dur-fast) var(--e26-ease-out),
                  background var(--e26-dur-fast) var(--e26-ease-out);
    }
    .nav__item:hover { color: var(--e26-text-muted); }
    .nav__item--active {
      color: var(--e26-primary);
    }
    .nav__item--active::before {
      content: '';
      position: absolute;
      top: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 22px;
      height: 3px;
      border-radius: var(--e26-radius-pill);
      background: var(--e26-primary);
    }
    .nav__icon { display: grid; place-items: center; height: 22px; }
    .nav__label { font-size: 11px; font-weight: 600; letter-spacing: 0.02em; }

    @media (min-width: 1024px) {
      .nav {
        position: sticky;
        top: 72px;
        bottom: auto;
        left: 0;
        right: auto;
        width: 100%;
        height: calc(100dvh - 72px);
        flex-direction: column;
        justify-content: flex-start;
        align-self: start;
        gap: var(--e26-space-1);
        padding-top: var(--e26-space-4);
        padding-bottom: var(--e26-space-4);
        padding-left: calc(var(--e26-space-3) + env(safe-area-inset-left, 0px));
        padding-right: var(--e26-space-3);
        border-top: 0;
        border-right: 1px solid var(--e26-border);
        background: transparent;
        backdrop-filter: none;
      }
      .nav__item {
        flex: 0 0 auto;
        width: 100%;
        max-width: none;
        flex-direction: column;
        gap: var(--e26-space-1);
        padding: var(--e26-space-3) 0;
      }
      .nav__item--active { background: var(--e26-primary-soft); }
      .nav__item--active::before {
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        width: 3px;
        height: 22px;
      }
      .nav__label { font-size: 11px; }
    }
  `],
})
export class AppComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly routes = NAV_ROUTES;

  user = toSignal(this.auth.user$, { initialValue: null });

  theme = signal<'light' | 'dark'>(this.readInitialTheme());

  /** URL actual (signal) para derivar el título del bar. */
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  pageTitle = computed(() => {
    const url = this.currentUrl();
    const r = this.routes.find(x => url.startsWith(x.path));
    return r?.title ?? 'Home';
  });

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.theme());
      try { localStorage.setItem('e26-theme', this.theme()); } catch {}
    });
  }

  toggleTheme() {
    this.theme.set(this.theme() === 'light' ? 'dark' : 'light');
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }

  userLabel(u: { isAnonymous: boolean; displayName?: string | null; email?: string | null }): string {
    if (u.isAnonymous) return 'Invitado';
    return u.displayName ?? u.email ?? 'Coleccionista';
  }

  trackRoute = (_: number, r: NavRoute) => r.id;

  private readInitialTheme(): 'light' | 'dark' {
    try {
      const stored = localStorage.getItem('e26-theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {}
    return 'light';
  }
}
