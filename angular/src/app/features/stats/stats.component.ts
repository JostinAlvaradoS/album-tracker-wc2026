import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlbumViewService } from '../../core/services/album-view.service';
import { AlbumProgress, SectionProgress } from '../../core/models/album.model';

const ALBUM_ID = 'wc2026';

@Component({
  selector: 'app-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor],
  template: `
    <div class="page" *ngIf="progress() as p; else loading">

      <!-- ====== KPI HERO ====== -->
      <section class="hero">
        <div class="hero__main">
          <span class="e26-eyebrow">Progreso global</span>
          <div class="hero__numbers">
            <span class="hero__pct e26-display">
              {{ p.percent }}<span class="hero__pct-sym">%</span>
            </span>
            <div class="hero__sub">
              <span class="hero__ratio e26-code">{{ p.owned }} / {{ p.total }}</span>
              <span class="hero__detail">cromos pegados</span>
            </div>
          </div>
        </div>

        <div class="hero__ring" aria-hidden="true">
          <svg viewBox="0 0 140 140">
            <defs>
              <linearGradient id="ringG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="var(--e26-primary)"/>
                <stop offset="100%" stop-color="var(--e26-primary-press)"/>
              </linearGradient>
            </defs>
            <circle cx="70" cy="70" r="60"
                    fill="none" stroke="var(--e26-surface-2)" stroke-width="12"/>
            <circle cx="70" cy="70" r="60"
                    fill="none"
                    stroke="url(#ringG)"
                    stroke-width="12"
                    stroke-linecap="round"
                    transform="rotate(-90 70 70)"
                    [attr.stroke-dasharray]="circumference"
                    [attr.stroke-dashoffset]="dashOffset()"
                    class="ring__fill"/>
            <!-- 4 tickets cada 25% -->
            <g class="ring__ticks">
              <circle cx="70" cy="6" r="1.5" fill="var(--e26-text-subtle)"/>
              <circle cx="134" cy="70" r="1.5" fill="var(--e26-text-subtle)"/>
              <circle cx="70" cy="134" r="1.5" fill="var(--e26-text-subtle)"/>
              <circle cx="6" cy="70" r="1.5" fill="var(--e26-text-subtle)"/>
            </g>
          </svg>
        </div>
      </section>

      <!-- ====== STAT CARDS ====== -->
      <section class="stats">
        <article class="stat">
          <span class="stat__label e26-eyebrow">Pegados</span>
          <span class="stat__num e26-display">{{ p.owned }}</span>
          <span class="stat__foot">de {{ p.total }}</span>
        </article>
        <article class="stat stat--missing">
          <span class="stat__label e26-eyebrow">Faltan</span>
          <span class="stat__num e26-display">{{ p.missing }}</span>
          <span class="stat__foot">por conseguir</span>
        </article>
        <article class="stat stat--dup">
          <span class="stat__label e26-eyebrow">Repes</span>
          <span class="stat__num e26-display">{{ p.duplicates }}</span>
          <span class="stat__foot">para cambiar</span>
        </article>
        <article class="stat stat--sections">
          <span class="stat__label e26-eyebrow">Secciones</span>
          <span class="stat__num e26-display">
            {{ p.sectionsComplete }}<span class="stat__num-sub">/{{ p.sectionsTotal }}</span>
          </span>
          <span class="stat__foot">completas</span>
        </article>
      </section>

      <!-- ====== NOTA ====== -->
      <p class="note">
        Tienes <strong class="note__big">{{ p.totalStickersOwned }}</strong>
        cromos en total <span class="note__split">·</span>
        <span class="e26-code">{{ p.owned }}</span> distintos
        <span class="note__plus">+</span>
        <span class="e26-code">{{ p.duplicates }}</span> repes.
      </p>

      <!-- ====== POR SELECCIÓN ====== -->
      <section class="by-section">
        <header class="by-section__head">
          <span class="e26-eyebrow">Por selección</span>
          <h2 class="e26-display by-section__title">Progreso equipo a equipo</h2>
        </header>

        <div class="rows">
          <article class="row"
                   *ngFor="let s of p.sections; trackBy: track"
                   [class.row--complete]="s.complete">

            <div class="row__left">
              <span class="row__name">{{ s.name }}</span>
              <span class="row__badge" *ngIf="s.complete">completa</span>
            </div>

            <div class="row__bar">
              <div class="row__fill"
                   [style.width.%]="s.percent"
                   [class.row__fill--full]="s.complete"></div>
            </div>

            <div class="row__nums">
              <span class="row__pct e26-code">{{ s.percent }}%</span>
              <span class="row__count e26-code">
                {{ s.owned }}<span class="muted">/{{ s.total }}</span>
              </span>
              <span class="row__dup e26-code"
                    [class.row__dup--zero]="s.duplicates === 0">
                {{ s.duplicates ? '+' + s.duplicates : '—' }}
              </span>
            </div>
          </article>
        </div>
      </section>
    </div>

    <ng-template #loading>
      <div class="loading">
        <span class="loading__dot"></span>
        <span class="loading__dot"></span>
        <span class="loading__dot"></span>
      </div>
    </ng-template>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-5);
    }

    /* ===== HERO ===== */
    .hero {
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-xl);
      padding: var(--e26-space-5) var(--e26-space-5) var(--e26-space-6);
      box-shadow: var(--e26-shadow-sm);
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: var(--e26-space-4);
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      left: -60px;
      bottom: -60px;
      width: 220px;
      height: 220px;
      border-radius: 50%;
      background: var(--e26-primary-soft);
      opacity: .35;
      pointer-events: none;
    }
    .hero__main {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-2);
    }
    .hero__numbers {
      display: flex;
      align-items: baseline;
      gap: var(--e26-space-3);
      flex-wrap: wrap;
    }
    .hero__pct {
      font-size: clamp(3rem, 12vw, 5rem);
      color: var(--e26-text);
      font-weight: 700;
      letter-spacing: -0.05em;
      line-height: 1;
    }
    .hero__pct-sym {
      font-size: 0.4em;
      color: var(--e26-primary);
      margin-left: 4px;
    }
    .hero__sub { display: flex; flex-direction: column; gap: 2px; }
    .hero__ratio {
      font-size: var(--e26-fs-md);
      color: var(--e26-text);
      font-weight: 700;
    }
    .hero__detail {
      font-size: var(--e26-fs-xs);
      color: var(--e26-text-subtle);
      text-transform: uppercase;
      letter-spacing: var(--e26-tracking-caps);
    }

    .hero__ring {
      width: 110px;
      height: 110px;
      position: relative;
    }
    .hero__ring svg { width: 100%; height: 100%; }
    .ring__fill {
      transition: stroke-dashoffset 800ms var(--e26-ease-out);
    }
    @media (min-width: 768px) {
      .hero__ring { width: 140px; height: 140px; }
    }

    /* ===== STAT CARDS ===== */
    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--e26-space-3);
    }
    @media (min-width: 768px) {
      .stats { grid-template-columns: repeat(4, 1fr); }
    }

    .stat {
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-lg);
      padding: var(--e26-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-1);
      position: relative;
      overflow: hidden;
      transition: border-color var(--e26-dur-base) var(--e26-ease-out);
    }
    .stat:hover { border-color: var(--e26-border-strong); }
    .stat__label {
      color: var(--e26-text-subtle);
    }
    .stat__num {
      font-size: clamp(1.75rem, 7vw, 2.5rem);
      color: var(--e26-text);
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1.1;
    }
    .stat__num-sub {
      font-size: 0.5em;
      color: var(--e26-text-subtle);
      font-family: var(--e26-font-body);
      font-weight: 500;
      margin-left: 2px;
    }
    .stat__foot {
      font-size: var(--e26-fs-xs);
      color: var(--e26-text-subtle);
    }
    .stat--missing .stat__num { color: var(--e26-text); }
    .stat--missing .stat__label { color: var(--e26-text-subtle); }
    .stat--dup .stat__num { color: var(--e26-accent); }
    .stat--sections .stat__num { color: var(--e26-info); }

    /* línea decorativa inferior, color por tipo */
    .stat::after {
      content: '';
      position: absolute;
      left: var(--e26-space-4);
      right: var(--e26-space-4);
      bottom: 0;
      height: 2px;
      background: var(--e26-text);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform var(--e26-dur-slow) var(--e26-ease-out);
    }
    .stat:hover::after { transform: scaleX(1); }
    .stat--dup::after { background: var(--e26-accent); }
    .stat--sections::after { background: var(--e26-info); }
    .stat--missing::after { background: var(--e26-border-strong); }

    /* ===== NOTA ===== */
    .note {
      font-size: var(--e26-fs-sm);
      color: var(--e26-text-muted);
      margin: 0;
      padding: var(--e26-space-3) var(--e26-space-4);
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-md);
      display: flex;
      flex-wrap: wrap;
      gap: var(--e26-space-2);
      align-items: baseline;
    }
    .note__big {
      color: var(--e26-text);
      font-family: var(--e26-font-display);
      font-size: var(--e26-fs-lg);
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .note__split, .note__plus { color: var(--e26-text-subtle); }
    .note .e26-code {
      background: var(--e26-surface-2);
      padding: 1px 5px;
      border-radius: 4px;
      color: var(--e26-text);
      font-size: 11px;
    }

    /* ===== BY SECTION ===== */
    .by-section { display: flex; flex-direction: column; gap: var(--e26-space-4); }
    .by-section__head { display: flex; flex-direction: column; gap: 2px; }
    .by-section__title {
      font-size: var(--e26-fs-xl);
      color: var(--e26-text);
      margin: 0;
    }

    .rows {
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-lg);
      overflow: hidden;
    }

    .row {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--e26-space-2);
      padding: var(--e26-space-3) var(--e26-space-4);
      border-bottom: 1px solid var(--e26-border);
      transition: background var(--e26-dur-fast) var(--e26-ease-out);
    }
    .row:last-child { border-bottom: 0; }
    .row:hover { background: var(--e26-surface-2); }
    .row--complete { background: var(--e26-primary-soft); }
    .row--complete:hover { background: var(--e26-primary-soft); }

    @media (min-width: 768px) {
      .row {
        grid-template-columns: minmax(140px, 1.4fr) 2fr auto;
        align-items: center;
        gap: var(--e26-space-4);
      }
    }

    .row__left {
      display: flex;
      align-items: center;
      gap: var(--e26-space-2);
      min-width: 0;
    }
    .row__name {
      font-size: var(--e26-fs-sm);
      color: var(--e26-text);
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .row__badge {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: var(--e26-tracking-caps);
      text-transform: uppercase;
      color: var(--e26-primary);
      background: var(--e26-surface);
      border: 1px solid var(--e26-primary);
      border-radius: var(--e26-radius-pill);
      padding: 1px 6px;
    }

    .row__bar {
      height: 6px;
      background: var(--e26-surface-2);
      border-radius: var(--e26-radius-pill);
      overflow: hidden;
    }
    .row--complete .row__bar { background: rgba(255,255,255,.5); }
    .row__fill {
      height: 100%;
      background: var(--e26-primary);
      border-radius: var(--e26-radius-pill);
      transition: width var(--e26-dur-slow) var(--e26-ease-out);
    }
    .row__fill--full { background: var(--e26-accent); }

    .row__nums {
      display: flex;
      align-items: baseline;
      gap: var(--e26-space-3);
      justify-content: flex-end;
      font-size: var(--e26-fs-xs);
    }
    .row__pct {
      color: var(--e26-text);
      font-weight: 700;
      min-width: 32px;
      text-align: right;
    }
    .row__count {
      color: var(--e26-text-muted);
    }
    .row__count .muted { color: var(--e26-text-subtle); }
    .row__dup {
      color: var(--e26-accent);
      font-weight: 700;
      min-width: 32px;
      text-align: right;
    }
    .row__dup--zero { color: var(--e26-text-subtle); font-weight: 500; }

    /* ===== loading ===== */
    .loading {
      display: flex;
      justify-content: center;
      gap: var(--e26-space-2);
      padding: var(--e26-space-8);
    }
    .loading__dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--e26-border-strong);
      animation: dot-pulse 1.2s var(--e26-ease-in-out, ease) infinite;
    }
    .loading__dot:nth-child(2) { animation-delay: .15s; }
    .loading__dot:nth-child(3) { animation-delay: .3s; }
    @keyframes dot-pulse {
      0%, 80%, 100% { transform: scale(.6); opacity: .4; }
      40% { transform: scale(1); opacity: 1; }
    }
  `],
})
export class StatsComponent {
  private viewService = inject(AlbumViewService);

  readonly circumference = 2 * Math.PI * 60;

  progress = toSignal<AlbumProgress | null>(
    this.viewService.getProgress(ALBUM_ID),
    { initialValue: null }
  );

  dashOffset = computed(() => {
    const p = this.progress();
    if (!p) return this.circumference;
    return this.circumference * (1 - p.percent / 100);
  });

  track = (_: number, s: SectionProgress) => s.id;
}
