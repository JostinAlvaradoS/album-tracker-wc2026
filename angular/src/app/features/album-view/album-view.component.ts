import {
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgIf, NgFor, NgClass, UpperCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlbumViewService } from '../../core/services/album-view.service';
import { CollectionService } from '../../core/services/collection.service';
import { AlbumCatalogService } from '../../core/services/album-catalog.service';
import { SectionView, StickerView } from '../../core/models/album.model';

const ALBUM_ID = 'wc2026';
type Filter = 'all' | 'owned' | 'missing' | 'dupe';

@Component({
  selector: 'app-album-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, NgClass, UpperCasePipe],
  template: `
    <div class="page">

      <!-- ====== HERO: progreso ====== -->
      <section class="progress" *ngIf="collection() as col">
        <div class="progress__row">
          <div class="progress__main">
            <span class="e26-eyebrow">Progreso del álbum</span>
            <div class="progress__count">
              <span class="progress__owned e26-display">{{ col.stats.owned }}</span>
              <span class="progress__total">/ {{ col.stats.total }}</span>
            </div>
            <div class="progress__meta">
              <span class="meta-item">
                <span class="dot dot--missing"></span>
                {{ col.stats.missing }} faltan
              </span>
              <span class="meta-item" *ngIf="col.stats.duplicates > 0">
                <span class="dot dot--dupe"></span>
                {{ col.stats.duplicates }} repes
              </span>
            </div>
          </div>

          <div class="progress__ring" aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52"
                      fill="none" stroke="var(--e26-surface-2)" stroke-width="10"/>
              <circle cx="60" cy="60" r="52"
                      fill="none"
                      [attr.stroke]="ringComplete(col.stats) ? 'var(--e26-accent)' : 'var(--e26-primary)'"
                      stroke-width="10"
                      stroke-linecap="round"
                      transform="rotate(-90 60 60)"
                      [attr.stroke-dasharray]="ringCircumference"
                      [attr.stroke-dashoffset]="ringOffset(col.stats)"
                      class="ring__fill"/>
            </svg>
            <span class="progress__pct e26-display">
              {{ ringPercent(col.stats) }}<span class="progress__pct-sym">%</span>
            </span>
          </div>
        </div>

        <p class="progress__hint">
          <span class="e26-code">TAP</span> alterna pegada/falta ·
          <span class="e26-code">＋</span> suma repe ·
          <span class="e26-code">－</span> quita una
        </p>
      </section>

      <!-- ====== SELECTOR DE SECCIÓN ====== -->
      <div class="section-picker">
        <label class="select" [class.select--active]="sectionFilter() !== ''">
          <span class="select__label e26-eyebrow">Sección</span>
          <select [value]="sectionFilter()"
                  (change)="onSectionChange($event)"
                  aria-label="Filtrar por sección o equipo">
            <option value="">Todas las secciones</option>
            <optgroup *ngIf="specialSections().length > 0" label="Especiales">
              <option *ngFor="let s of specialSections()"
                      [value]="s.id">
                {{ s.name }} · {{ s.ownedCount }}/{{ s.stickers.length }}
              </option>
            </optgroup>
            <optgroup *ngIf="teamSections().length > 0" label="Selecciones">
              <option *ngFor="let s of teamSections()"
                      [value]="s.id">
                {{ s.code ? s.code + ' · ' : '' }}{{ s.name }} · {{ s.ownedCount }}/{{ s.stickers.length }}
              </option>
            </optgroup>
          </select>
          <svg class="select__caret" viewBox="0 0 12 8" width="12" height="8"
               fill="none" stroke="currentColor" stroke-width="1.5"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m1 1.5 5 5 5-5"/>
          </svg>
        </label>

        <button type="button"
                class="section-picker__clear"
                *ngIf="sectionFilter() !== ''"
                (click)="clearSectionFilter()"
                aria-label="Quitar filtro de sección">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M3 3l10 10M13 3 3 13"/>
          </svg>
          <span>Limpiar</span>
        </button>
      </div>

      <!-- ====== CHIPS RÁPIDOS DE EQUIPO ====== -->
      <div class="team-chips" *ngIf="teamSections().length > 0">
        <span class="e26-eyebrow team-chips__label">Equipos</span>
        <div class="team-chips__scroll">
          <button type="button"
                  class="team-chip"
                  *ngFor="let s of teamSections(); trackBy: trackSection"
                  [class.team-chip--selected]="sectionFilter() === s.id"
                  [class.team-chip--complete]="s.ownedCount === s.stickers.length"
                  (click)="setSectionFilter(s.id)"
                  [attr.aria-pressed]="sectionFilter() === s.id"
                  [title]="s.name + ' · ' + s.ownedCount + '/' + s.stickers.length">
            <span class="team-chip__code e26-code">{{ s.code }}</span>
            <span class="team-chip__pct" aria-hidden="true">
              <span class="team-chip__fill"
                    [style.width.%]="sectionPct(s)"></span>
            </span>
          </button>
        </div>
      </div>

      <!-- ====== FILTROS DE ESTADO ====== -->
      <div class="filters" role="tablist" aria-label="Filtrar figuritas por estado">
        <button class="chip"
                [class.chip--selected]="filter() === 'all'"
                role="tab" [attr.aria-selected]="filter() === 'all'"
                (click)="setFilter('all')">
          <span>Todas</span>
          <span class="chip__count e26-code">{{ totalCount() }}</span>
        </button>
        <button class="chip"
                [class.chip--selected]="filter() === 'missing'"
                role="tab" [attr.aria-selected]="filter() === 'missing'"
                (click)="setFilter('missing')">
          <span>Faltan</span>
          <span class="chip__count e26-code">{{ missingCount() }}</span>
        </button>
        <button class="chip chip--accent"
                [class.chip--selected]="filter() === 'dupe'"
                role="tab" [attr.aria-selected]="filter() === 'dupe'"
                (click)="setFilter('dupe')">
          <span>Repes</span>
          <span class="chip__count e26-code">{{ dupeCount() }}</span>
        </button>
        <button class="chip chip--primary"
                [class.chip--selected]="filter() === 'owned'"
                role="tab" [attr.aria-selected]="filter() === 'owned'"
                (click)="setFilter('owned')">
          <span>Tengo</span>
          <span class="chip__count e26-code">{{ ownedCount() }}</span>
        </button>
      </div>

      <!-- ====== SECCIONES ====== -->
      <ng-container *ngIf="visibleSections().length > 0; else emptyTpl">
        <section class="section"
                 *ngFor="let section of visibleSections(); trackBy: trackSection">

          <header class="section__head">
            <div class="section__title">
              <span class="section__index e26-code">
                {{ formatIndex(section.order) }}
              </span>
              <h2 class="section__name e26-display">{{ section.name }}</h2>
            </div>
            <div class="section__progress">
              <span class="section__count e26-code">
                {{ section.ownedCount }}<span class="muted">/{{ section.stickers.length }}</span>
              </span>
              <span class="section__bar" aria-hidden="true">
                <span class="section__fill"
                      [style.width.%]="sectionPct(section)"
                      [class.section__fill--full]="section.ownedCount === section.stickers.length && section.stickers.length > 0"></span>
              </span>
            </div>
          </header>

          <div class="grid">
            <button
              *ngFor="let s of filteredStickers(section); trackBy: trackSticker"
              type="button"
              class="cell"
              [ngClass]="{
                'cell--owned':    s.status === 'owned',
                'cell--dupe':     s.status === 'duplicate',
                'cell--missing':  s.status === 'missing',
                'cell--emblem':   s.kind === 'emblem',
                'cell--special':  s.kind === 'special',
                'cell--photo':    s.kind === 'teamPhoto',
                'cell--foil':     s.foil
              }"
              [attr.aria-label]="ariaFor(s)"
              [attr.aria-pressed]="s.status !== 'missing'"
              (click)="cycle(s)"
              (contextmenu)="addDup($event, s)">

              <span class="cell__face">
                <span class="cell__kind e26-code" aria-hidden="true">
                  {{ kindLabel(s.kind) }}
                </span>

                <span class="cell__big e26-display">
                  {{ bigLabel(s) }}
                </span>

                <span class="cell__code e26-code">{{ s.code }}</span>
              </span>

              <span class="cell__check" *ngIf="s.status === 'owned'" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="11" height="11">
                  <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>

              <span class="cell__dupes e26-code" *ngIf="s.status === 'duplicate'">
                ×{{ s.count }}
              </span>

              <span class="cell__actions">
                <button type="button" class="act act--minus"
                        *ngIf="s.count > 0"
                        (click)="dec($event, s)"
                        aria-label="Quitar una">−</button>
                <button type="button" class="act act--plus"
                        (click)="inc($event, s)"
                        [attr.aria-label]="s.count === 0 ? 'Marcar pegada' : 'Sumar repe'">+</button>
              </span>
            </button>
          </div>
        </section>
      </ng-container>

      <ng-template #emptyTpl>
        <div class="empty">
          <span class="e26-display empty__num">∅</span>
          <p class="empty__title e26-display">Nada para mostrar</p>
          <p class="empty__text">
            No hay figuritas con el filtro
            <strong class="e26-code">{{ filter() | uppercase }}</strong>.
          </p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-5);
    }

    /* ===== HERO PROGRESO ===== */
    .progress {
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-lg);
      padding: var(--e26-space-5);
      box-shadow: var(--e26-shadow-sm);
    }
    .progress__row {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: var(--e26-space-4);
    }
    .progress__main { display: flex; flex-direction: column; gap: var(--e26-space-2); }
    .progress__count {
      display: flex;
      align-items: baseline;
      gap: var(--e26-space-2);
      line-height: 1;
    }
    .progress__owned {
      font-size: clamp(2.5rem, 8vw, 3.75rem);
      color: var(--e26-text);
      font-weight: 700;
      letter-spacing: -0.04em;
    }
    .progress__total {
      font-size: var(--e26-fs-xl);
      color: var(--e26-text-subtle);
      font-family: var(--e26-font-body);
      font-weight: 500;
    }
    .progress__meta {
      display: flex;
      gap: var(--e26-space-4);
      flex-wrap: wrap;
      margin-top: var(--e26-space-2);
    }
    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: var(--e26-space-2);
      font-size: var(--e26-fs-sm);
      color: var(--e26-text-muted);
    }
    .dot {
      width: 9px; height: 9px; border-radius: 50%;
      background: var(--e26-surface-3);
    }
    .dot--missing { background: var(--e26-border-strong); }
    .dot--dupe { background: var(--e26-accent); }

    .progress__ring {
      position: relative;
      width: 96px;
      height: 96px;
      flex-shrink: 0;
    }
    .progress__ring svg { width: 100%; height: 100%; }
    .ring__fill {
      transition: stroke-dashoffset var(--e26-dur-slow) var(--e26-ease-out);
    }
    .progress__pct {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-size: 1.25rem;
      color: var(--e26-text);
      line-height: 1;
    }
    .progress__pct-sym {
      font-size: 0.75rem;
      color: var(--e26-text-subtle);
      margin-left: 1px;
    }
    @media (min-width: 768px) {
      .progress__ring { width: 120px; height: 120px; }
      .progress__pct { font-size: 1.5rem; }
    }

    .progress__hint {
      margin: var(--e26-space-4) 0 0;
      font-size: var(--e26-fs-xs);
      color: var(--e26-text-subtle);
      display: flex;
      flex-wrap: wrap;
      gap: var(--e26-space-2) var(--e26-space-3);
      align-items: center;
    }
    .progress__hint .e26-code {
      background: var(--e26-surface-2);
      color: var(--e26-text-muted);
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 10px;
    }

    /* ===== SELECTOR DE SECCIÓN ===== */
    .section-picker {
      display: flex;
      align-items: stretch;
      gap: var(--e26-space-2);
      flex-wrap: wrap;
    }
    .select {
      position: relative;
      flex: 1;
      min-width: 220px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: var(--e26-space-2) var(--e26-space-3);
      padding-right: var(--e26-space-6);
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-md);
      cursor: pointer;
      transition: border-color var(--e26-dur-fast) var(--e26-ease-out),
                  background var(--e26-dur-fast) var(--e26-ease-out);
    }
    .select:hover { border-color: var(--e26-border-strong); }
    .select--active {
      background: var(--e26-info-soft);
      border-color: var(--e26-info);
    }
    .select__label {
      pointer-events: none;
      color: var(--e26-text-subtle);
      line-height: 1;
    }
    .select--active .select__label { color: var(--e26-info); }
    .select select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background: transparent;
      border: 0;
      outline: 0;
      padding: 0;
      font-family: var(--e26-font-body);
      font-size: var(--e26-fs-md);
      font-weight: 600;
      color: var(--e26-text);
      cursor: pointer;
      width: 100%;
      line-height: 1.25;
    }
    .select select::-ms-expand { display: none; }
    .select__caret {
      position: absolute;
      right: var(--e26-space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--e26-text-muted);
      pointer-events: none;
    }
    .select--active .select__caret { color: var(--e26-info); }

    .section-picker__clear {
      display: inline-flex;
      align-items: center;
      gap: var(--e26-space-2);
      padding: var(--e26-space-2) var(--e26-space-4);
      border-radius: var(--e26-radius-md);
      border: 1px solid var(--e26-border);
      background: var(--e26-surface);
      color: var(--e26-text-muted);
      font-family: var(--e26-font-body);
      font-size: var(--e26-fs-sm);
      font-weight: 600;
      cursor: pointer;
      transition: color var(--e26-dur-fast) var(--e26-ease-out),
                  border-color var(--e26-dur-fast) var(--e26-ease-out);
    }
    .section-picker__clear:hover {
      color: var(--e26-text);
      border-color: var(--e26-border-strong);
    }

    /* ===== TEAM CHIPS (atajo visual) ===== */
    .team-chips {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-2);
    }
    .team-chips__label {
      color: var(--e26-text-subtle);
    }
    .team-chips__scroll {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding: 2px 0 var(--e26-space-2);
      margin: 0 calc(-1 * var(--e26-space-4));
      padding-inline: var(--e26-space-4);
      scrollbar-width: thin;
      scrollbar-color: var(--e26-border-strong) transparent;
    }
    .team-chips__scroll::-webkit-scrollbar { height: 4px; }
    .team-chips__scroll::-webkit-scrollbar-thumb {
      background: var(--e26-border); border-radius: 2px;
    }
    @media (min-width: 768px) {
      .team-chips__scroll {
        margin: 0;
        padding-inline: 0;
        flex-wrap: wrap;
        overflow-x: visible;
      }
    }

    .team-chip {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 6px 10px 8px;
      min-width: 52px;
      border-radius: var(--e26-radius-sm);
      border: 1px solid var(--e26-border);
      background: var(--e26-surface);
      color: var(--e26-text-muted);
      cursor: pointer;
      transition: background var(--e26-dur-fast) var(--e26-ease-out),
                  color var(--e26-dur-fast) var(--e26-ease-out),
                  border-color var(--e26-dur-fast) var(--e26-ease-out);
    }
    .team-chip:hover {
      color: var(--e26-text);
      border-color: var(--e26-border-strong);
    }
    .team-chip__code {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .team-chip__pct {
      width: 32px;
      height: 3px;
      background: var(--e26-surface-2);
      border-radius: var(--e26-radius-pill);
      overflow: hidden;
    }
    .team-chip__fill {
      display: block;
      height: 100%;
      background: var(--e26-primary);
      border-radius: var(--e26-radius-pill);
      transition: width var(--e26-dur-base) var(--e26-ease-out);
    }
    .team-chip--selected {
      background: var(--e26-text);
      color: var(--e26-text-inverse);
      border-color: var(--e26-text);
    }
    .team-chip--selected .team-chip__pct { background: rgba(255,255,255,.22); }
    .team-chip--complete {
      border-color: var(--e26-primary);
    }
    .team-chip--complete::after {
      content: '✓';
      font-size: 9px;
      font-weight: 700;
      color: var(--e26-primary);
      margin-top: -2px;
    }
    .team-chip--complete.team-chip--selected::after { color: var(--e26-primary-on); }

    /* ===== FILTROS ===== */
    .filters {
      display: flex;
      gap: var(--e26-space-2);
      overflow-x: auto;
      padding: var(--e26-space-1) 0;
      margin: 0 calc(-1 * var(--e26-space-4));
      padding-inline: var(--e26-space-4);
      scrollbar-width: none;
    }
    .filters::-webkit-scrollbar { display: none; }
    @media (min-width: 768px) {
      .filters {
        margin: 0;
        padding-inline: 0;
        overflow: visible;
        flex-wrap: wrap;
      }
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--e26-space-2);
      padding: var(--e26-space-2) var(--e26-space-4);
      min-height: 40px;
      border-radius: var(--e26-radius-pill);
      border: 1px solid var(--e26-border);
      background: var(--e26-surface);
      color: var(--e26-text-muted);
      font-size: var(--e26-fs-sm);
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: background var(--e26-dur-fast) var(--e26-ease-out),
                  color var(--e26-dur-fast) var(--e26-ease-out),
                  border-color var(--e26-dur-fast) var(--e26-ease-out);
    }
    .chip__count {
      font-size: 11px;
      color: var(--e26-text-subtle);
      font-weight: 700;
    }
    .chip:hover { color: var(--e26-text); border-color: var(--e26-border-strong); }
    .chip--selected {
      background: var(--e26-text);
      color: var(--e26-text-inverse);
      border-color: var(--e26-text);
    }
    .chip--selected .chip__count { color: var(--e26-text-inverse); opacity: .7; }
    .chip--primary.chip--selected { background: var(--e26-primary); border-color: var(--e26-primary); }
    .chip--accent.chip--selected  { background: var(--e26-accent);  border-color: var(--e26-accent); }

    /* ===== SECCIÓN ===== */
    .section {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-3);
    }
    .section__head {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: end;
      gap: var(--e26-space-3);
      padding-bottom: var(--e26-space-2);
      border-bottom: 1px solid var(--e26-border);
    }
    .section__title {
      display: flex;
      align-items: baseline;
      gap: var(--e26-space-2);
      min-width: 0;
    }
    .section__index {
      font-size: var(--e26-fs-xs);
      color: var(--e26-text-subtle);
    }
    .section__name {
      font-size: var(--e26-fs-lg);
      color: var(--e26-text);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .section__progress {
      display: flex;
      align-items: center;
      gap: var(--e26-space-2);
    }
    .section__count {
      font-size: var(--e26-fs-sm);
      color: var(--e26-text);
      font-weight: 700;
    }
    .section__count .muted { color: var(--e26-text-subtle); font-weight: 500; }
    .section__bar {
      width: 64px;
      height: 4px;
      background: var(--e26-surface-2);
      border-radius: var(--e26-radius-pill);
      overflow: hidden;
      display: inline-block;
    }
    .section__fill {
      display: block;
      height: 100%;
      background: var(--e26-primary);
      transition: width var(--e26-dur-slow) var(--e26-ease-out);
    }
    .section__fill--full { background: var(--e26-accent); }
    @media (min-width: 768px) {
      .section__name { font-size: var(--e26-fs-xl); }
      .section__bar { width: 96px; }
    }

    /* ===== GRID ===== */
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--e26-space-2);
    }
    @media (min-width: 480px)  { .grid { grid-template-columns: repeat(4, 1fr); gap: var(--e26-space-3); } }
    @media (min-width: 768px)  { .grid { grid-template-columns: repeat(6, 1fr); } }
    @media (min-width: 1024px) { .grid { grid-template-columns: repeat(8, 1fr); } }
    @media (min-width: 1280px) { .grid { grid-template-columns: repeat(9, 1fr); } }

    /* ===== CELDA ===== */
    .cell {
      all: unset;
      position: relative;
      cursor: pointer;
      aspect-ratio: 3 / 4;
      width: 100%;
      border-radius: var(--e26-radius-md);
      overflow: hidden;
      isolation: isolate;
      transition: transform var(--e26-dur-fast) var(--e26-ease-out);
    }
    .cell:active { transform: scale(0.97); }
    .cell:focus-visible {
      box-shadow: 0 0 0 2px var(--e26-bg), 0 0 0 4px var(--e26-info);
    }

    .cell__face {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: inherit;
      transition: background var(--e26-dur-base) var(--e26-ease-out),
                  border-color var(--e26-dur-base) var(--e26-ease-out),
                  color var(--e26-dur-base) var(--e26-ease-out);
    }

    .cell__kind {
      position: absolute;
      top: 5px;
      left: 6px;
      font-size: 9px;
      color: var(--e26-text-subtle);
      letter-spacing: 0.08em;
    }
    .cell__big {
      font-size: clamp(1rem, 4.5vw, 1.5rem);
      font-weight: 700;
      color: var(--e26-text);
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .cell__code {
      position: absolute;
      bottom: 5px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      color: var(--e26-text-subtle);
      background: var(--e26-surface);
      padding: 1px 5px;
      border-radius: 4px;
      max-width: calc(100% - 12px);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ----- estado missing ----- */
    .cell--missing .cell__face {
      background:
        repeating-linear-gradient(
          135deg,
          var(--e26-surface) 0,
          var(--e26-surface) 6px,
          var(--e26-surface-2) 6px,
          var(--e26-surface-2) 7px
        );
      border-style: dashed;
      border-color: var(--e26-border);
    }
    .cell--missing .cell__big { color: var(--e26-text-subtle); }
    .cell--missing .cell__code { color: var(--e26-text-subtle); }

    /* ----- estado owned ----- */
    .cell--owned .cell__face {
      background: var(--e26-surface);
      border-color: var(--e26-primary);
      box-shadow: 0 0 0 1px var(--e26-primary) inset, var(--e26-shadow-sm);
    }
    .cell--owned .cell__big { color: var(--e26-text); }
    .cell__check {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 18px;
      height: 18px;
      display: grid;
      place-items: center;
      background: var(--e26-primary);
      color: var(--e26-primary-on);
      border-radius: var(--e26-radius-pill);
      z-index: 2;
      animation: check-pop var(--e26-dur-reveal) var(--e26-ease-spring) both;
    }
    @keyframes check-pop {
      from { transform: scale(.4); opacity: 0; }
      to   { transform: scale(1);  opacity: 1; }
    }

    /* ----- estado dupe ----- */
    .cell--dupe .cell__face {
      background: var(--e26-surface);
      border-color: var(--e26-accent);
      box-shadow: 0 0 0 1px var(--e26-accent) inset, var(--e26-shadow-sm);
    }
    .cell__dupes {
      position: absolute;
      top: 5px;
      right: 5px;
      font-size: 10px;
      font-weight: 700;
      color: var(--e26-accent-on);
      background: var(--e26-accent);
      border-radius: var(--e26-radius-pill);
      padding: 1px 6px;
      line-height: 1.4;
      z-index: 2;
    }

    /* ----- variantes por tipo ----- */
    .cell--emblem .cell__face {
      border-radius: 50% 50% var(--e26-radius-md) var(--e26-radius-md);
    }
    .cell--photo {
      grid-column: span 2;
      aspect-ratio: 16 / 10;
    }
    .cell--photo .cell__face {
      background-image: linear-gradient(
        180deg,
        var(--e26-surface) 0%,
        var(--e26-surface) 65%,
        var(--e26-surface-2) 100%
      );
    }
    .cell--special .cell__face {
      background: var(--e26-surface-2);
    }
    .cell--foil .cell__face::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(
        125deg,
        transparent 30%,
        rgba(245, 197, 24, 0.18) 45%,
        rgba(59, 130, 246, 0.12) 55%,
        transparent 70%
      );
      mix-blend-mode: overlay;
    }
    .cell--foil .cell__face {
      border-color: #d4a017;
    }

    /* ----- acciones ----- */
    .cell__actions {
      position: absolute;
      bottom: 5px;
      left: 5px;
      right: 5px;
      display: flex;
      justify-content: space-between;
      pointer-events: none;
      opacity: 0;
      transition: opacity var(--e26-dur-fast) var(--e26-ease-out);
      z-index: 3;
    }
    .cell:hover .cell__actions,
    .cell:focus-within .cell__actions {
      opacity: 1;
    }
    .act {
      pointer-events: auto;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 0;
      background: var(--e26-text);
      color: var(--e26-text-inverse);
      cursor: pointer;
      font-size: 14px;
      font-weight: 700;
      line-height: 1;
      display: grid;
      place-items: center;
      box-shadow: var(--e26-shadow-md);
      transition: transform var(--e26-dur-fast) var(--e26-ease-out),
                  background var(--e26-dur-fast) var(--e26-ease-out);
    }
    .act:hover { transform: scale(1.08); }
    .act:active { transform: scale(0.94); }
    .act--minus { background: var(--e26-surface); color: var(--e26-text); border: 1px solid var(--e26-border); }
    .act--plus { background: var(--e26-primary); color: var(--e26-primary-on); margin-left: auto; }
    .cell--owned .act--plus,
    .cell--dupe .act--plus { background: var(--e26-accent); }

    /* En móvil, siempre visibles (sin hover) */
    @media (hover: none), (max-width: 767px) {
      .cell__actions { opacity: 1; }
      .act { width: 22px; height: 22px; font-size: 13px; }
    }

    /* ===== empty ===== */
    .empty {
      text-align: center;
      padding: var(--e26-space-8) var(--e26-space-4);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--e26-space-2);
    }
    .empty__num {
      font-size: 4rem;
      color: var(--e26-surface-3);
      line-height: 1;
    }
    .empty__title {
      font-size: var(--e26-fs-xl);
      color: var(--e26-text);
      margin: 0;
    }
    .empty__text {
      color: var(--e26-text-muted);
      font-size: var(--e26-fs-sm);
      margin: 0;
    }
  `],
})
export class AlbumViewComponent {
  private viewService = inject(AlbumViewService);
  private collectionService = inject(CollectionService);
  private catalogService = inject(AlbumCatalogService);

  readonly ringCircumference = 2 * Math.PI * 52;

  album = toSignal(this.catalogService.getAlbum(ALBUM_ID));
  sections = toSignal(this.viewService.getAlbumView(ALBUM_ID), {
    initialValue: [] as SectionView[],
  });
  collection = toSignal(this.collectionService.getCollection(ALBUM_ID));

  filter = signal<Filter>('all');
  sectionFilter = signal<string>('');
  busy = signal(false);

  teamSections    = computed(() => this.sections().filter(s => s.type === 'team'));
  specialSections = computed(() => this.sections().filter(s => s.type !== 'team'));

  totalCount   = computed(() =>
    this.sections().reduce((s, sec) => s + sec.stickers.length, 0)
  );
  ownedCount   = computed(() =>
    this.sections().reduce((s, sec) =>
      s + sec.stickers.filter(x => x.status === 'owned' || x.status === 'duplicate').length, 0)
  );
  missingCount = computed(() =>
    this.sections().reduce((s, sec) =>
      s + sec.stickers.filter(x => x.status === 'missing').length, 0)
  );
  dupeCount    = computed(() =>
    this.sections().reduce((s, sec) =>
      s + sec.stickers.filter(x => x.status === 'duplicate').length, 0)
  );

  visibleSections = computed(() => {
    const f = this.filter();
    const sid = this.sectionFilter();
    const base = sid
      ? this.sections().filter(s => s.id === sid)
      : this.sections();
    if (f === 'all') return base;
    return base
      .map(sec => ({ ...sec, stickers: sec.stickers.filter(s => this.matches(s, f)) }))
      .filter(sec => sec.stickers.length > 0);
  });

  constructor() {
    const a = this.album;
    queueMicrotask(async () => {
      const album = a();
      if (album) {
        await this.collectionService.ensureCollection(ALBUM_ID, album.totalSlots);
      }
    });
  }

  setFilter(f: Filter) { this.filter.set(f); }

  setSectionFilter(id: string) {
    this.sectionFilter.set(this.sectionFilter() === id ? '' : id);
  }
  clearSectionFilter() { this.sectionFilter.set(''); }
  onSectionChange(ev: Event) {
    const value = (ev.target as HTMLSelectElement).value;
    this.sectionFilter.set(value);
  }

  filteredStickers(section: SectionView) {
    const f = this.filter();
    if (f === 'all') return section.stickers;
    return section.stickers.filter(s => this.matches(s, f));
  }

  private matches(s: StickerView, f: Filter): boolean {
    if (f === 'owned') return s.status === 'owned' || s.status === 'duplicate';
    if (f === 'missing') return s.status === 'missing';
    if (f === 'dupe') return s.status === 'duplicate';
    return true;
  }

  ringPercent(stats: { owned: number; total: number }): number {
    return stats.total ? Math.round((stats.owned / stats.total) * 100) : 0;
  }
  ringOffset(stats: { owned: number; total: number }): number {
    const pct = this.ringPercent(stats) / 100;
    return this.ringCircumference * (1 - pct);
  }
  ringComplete(stats: { owned: number; total: number }): boolean {
    return stats.total > 0 && stats.owned === stats.total;
  }

  sectionPct(s: SectionView): number {
    return s.stickers.length ? Math.round((s.ownedCount / s.stickers.length) * 100) : 0;
  }

  formatIndex(order: number): string {
    return String(order).padStart(2, '0');
  }

  kindLabel(kind: string): string {
    switch (kind) {
      case 'emblem':    return 'ESCUDO';
      case 'teamPhoto': return 'FOTO';
      case 'special':   return 'ESP.';
      case 'player':    return 'PLR';
      default:          return '';
    }
  }

  bigLabel(s: StickerView): string {
    if (s.kind === 'emblem') return s.code.replace(/\d+$/, '').slice(0, 3) || '◆';
    if (s.kind === 'teamPhoto') return '▭';
    if (s.kind === 'special') return s.code.replace(/[0-9]/g, '').slice(0, 3) || '★';
    return String(s.number).padStart(2, '0');
  }

  ariaFor(s: StickerView): string {
    const estado = s.status === 'owned' ? 'pegada'
      : s.status === 'duplicate' ? `con ${s.count - 1} repe${s.count - 1 === 1 ? '' : 's'}`
      : 'faltante';
    return `Figurita ${s.code}, ${s.label}, ${estado}`;
  }

  async cycle(s: StickerView) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      if (s.count === 0) await this.collectionService.markOwned(ALBUM_ID, s.code);
      else                await this.collectionService.markMissing(ALBUM_ID, s.code);
    } finally {
      this.busy.set(false);
    }
  }

  async inc(event: Event, s: StickerView) {
    event.stopPropagation();
    if (this.busy()) return;
    this.busy.set(true);
    try {
      if (s.count === 0) await this.collectionService.markOwned(ALBUM_ID, s.code);
      else                await this.collectionService.addDuplicate(ALBUM_ID, s.code);
    } finally {
      this.busy.set(false);
    }
  }

  async dec(event: Event, s: StickerView) {
    event.stopPropagation();
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.collectionService.removeOne(ALBUM_ID, s.code);
    } finally {
      this.busy.set(false);
    }
  }

  async addDup(event: MouseEvent, s: StickerView) {
    event.preventDefault();
    return this.inc(event, s);
  }

  trackSection = (_: number, s: SectionView) => s.id;
  trackSticker = (_: number, s: StickerView) => s.code;
}
