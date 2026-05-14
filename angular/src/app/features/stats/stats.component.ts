import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlbumViewService } from '../../core/services/album-view.service';
import { AlbumProgress, SectionProgress } from '../../core/models/album.model';

const ALBUM_ID = 'wc2026';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wrap" *ngIf="progress() as p">
      <h1>Progreso</h1>

      <!-- Resumen global -->
      <div class="summary">
        <div class="donut">
          <svg viewBox="0 0 120 120">
            <circle class="donut__track" cx="60" cy="60" r="52" />
            <circle
              class="donut__fill"
              cx="60"
              cy="60"
              r="52"
              [style.stroke-dasharray]="circumference"
              [style.stroke-dashoffset]="dashOffset()"
            />
            <text x="60" y="56" class="donut__pct">{{ p.percent }}%</text>
            <text x="60" y="74" class="donut__sub">
              {{ p.owned }}/{{ p.total }}
            </text>
          </svg>
        </div>

        <div class="cards">
          <div class="stat">
            <span class="stat__num">{{ p.owned }}</span>
            <span class="stat__label">Pegados</span>
          </div>
          <div class="stat stat--missing">
            <span class="stat__num">{{ p.missing }}</span>
            <span class="stat__label">Faltan</span>
          </div>
          <div class="stat stat--dup">
            <span class="stat__num">{{ p.duplicates }}</span>
            <span class="stat__label">Repes</span>
          </div>
          <div class="stat">
            <span class="stat__num">
              {{ p.sectionsComplete }}/{{ p.sectionsTotal }}
            </span>
            <span class="stat__label">Secciones completas</span>
          </div>
        </div>
      </div>

      <p class="note">
        Tienes {{ p.totalStickersOwned }} cromos en total
        ({{ p.owned }} distintos + {{ p.duplicates }} repetidos).
      </p>

      <!-- Desglose por sección -->
      <h2>Por selección</h2>
      <div class="sections">
        <div
          class="row"
          *ngFor="let s of progress()!.sections; trackBy: track"
          [class.row--complete]="s.complete"
        >
          <span class="row__name">
            {{ s.name }}
            <span class="row__badge" *ngIf="s.complete">completa</span>
          </span>
          <div class="row__bar">
            <div class="row__fill" [style.width.%]="s.percent"></div>
          </div>
          <span class="row__count">{{ s.owned }}/{{ s.total }}</span>
          <span class="row__dup" [class.row__dup--zero]="s.duplicates === 0">
            {{ s.duplicates ? '+' + s.duplicates : '—' }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .wrap {
        max-width: 760px;
        margin: 0 auto;
        padding: 1rem;
      }
      .summary {
        display: flex;
        gap: 1.5rem;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 0.5rem;
      }
      .donut {
        width: 160px;
        flex-shrink: 0;
      }
      .donut svg {
        width: 100%;
        transform: rotate(-90deg);
      }
      .donut__track {
        fill: none;
        stroke: #eee;
        stroke-width: 12;
      }
      .donut__fill {
        fill: none;
        stroke: var(--green);
        stroke-width: 12;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.5s ease;
      }
      .donut__pct {
        transform: rotate(90deg);
        transform-origin: 60px 60px;
        text-anchor: middle;
        font-size: 22px;
        font-weight: 700;
        fill: #222;
      }
      .donut__sub {
        transform: rotate(90deg);
        transform-origin: 60px 60px;
        text-anchor: middle;
        font-size: 11px;
        fill: var(--gray);
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        flex: 1;
        min-width: 240px;
      }
      .stat {
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        text-align: center;
      }
      .stat__num {
        display: block;
        font-size: 1.6rem;
        font-weight: 700;
      }
      .stat__label {
        font-size: 0.8rem;
        color: var(--gray);
      }
      .stat--missing .stat__num {
        color: #c62828;
      }
      .stat--dup .stat__num {
        color: var(--orange);
      }
      .note {
        color: var(--gray);
        font-size: 0.9rem;
      }
      h2 {
        margin-top: 1.5rem;
      }
      .sections {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 2fr auto auto;
        gap: 0.75rem;
        align-items: center;
        padding: 0.45rem 0.6rem;
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 0.9rem;
      }
      .row--complete {
        border-color: var(--green);
        background: var(--green-light);
      }
      .row__name {
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .row__badge {
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--green);
        background: #fff;
        border: 1px solid var(--green);
        border-radius: 8px;
        padding: 0 5px;
        margin-left: 4px;
      }
      .row__bar {
        height: 10px;
        background: #eee;
        border-radius: 5px;
        overflow: hidden;
      }
      .row__fill {
        height: 100%;
        background: var(--green);
        transition: width 0.4s;
      }
      .row__count {
        font-variant-numeric: tabular-nums;
        color: #555;
        white-space: nowrap;
      }
      .row__dup {
        font-variant-numeric: tabular-nums;
        color: var(--orange);
        font-weight: 600;
        min-width: 32px;
        text-align: right;
      }
      .row__dup--zero {
        color: #ccc;
        font-weight: normal;
      }
    `,
  ],
})
export class StatsComponent {
  private viewService = inject(AlbumViewService);

  // radio 52 -> circunferencia para el donut SVG
  readonly circumference = 2 * Math.PI * 52;

  progress = toSignal<AlbumProgress | null>(
    this.viewService.getProgress(ALBUM_ID),
    { initialValue: null }
  );

  /** offset del trazo del donut según el porcentaje */
  dashOffset = computed(() => {
    const p = this.progress();
    if (!p) return this.circumference;
    return this.circumference * (1 - p.percent / 100);
  });

  track = (_: number, s: SectionProgress) => s.id;
}
