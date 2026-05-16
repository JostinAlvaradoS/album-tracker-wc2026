import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgIf, NgFor, UpperCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlbumViewService } from '../../core/services/album-view.service';
import { CollectionService } from '../../core/services/collection.service';
import { AlbumCatalogService } from '../../core/services/album-catalog.service';
import { SectionView, StickerView } from '../../core/models/album.model';
import { CURRENT_ALBUM_ID } from '../../core/config/app.tokens';
import { StickerCellComponent } from './sticker-cell/sticker-cell.component';

type Filter = 'all' | 'owned' | 'missing' | 'dupe';

@Component({
  selector: 'app-album-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, UpperCasePipe, StickerCellComponent],
  template: `
    <div class="page">

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
            <app-sticker-cell
              *ngFor="let s of filteredStickers(section); trackBy: trackSticker"
              [sticker]="s"
              (cycle)="cycle(s)"
              (inc)="inc(s)"
              (dec)="dec(s)"
              (addDup)="inc(s)" />
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
  private albumId = inject(CURRENT_ALBUM_ID);

  album = toSignal(this.catalogService.getAlbum(this.albumId));
  sections = toSignal(this.viewService.getAlbumView(this.albumId), {
    initialValue: [] as SectionView[],
  });

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
    // ensureCollection() es idempotente pero costoso; lo dispara una sola vez
    // cuando el catálogo emite el doc del álbum por primera vez.
    let ensured = false;
    effect(() => {
      const album = this.album();
      if (!album || ensured) return;
      ensured = true;
      this.collectionService
        .ensureCollection(this.albumId, album.totalSlots)
        .catch((err) => console.error('ensureCollection failed', err));
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

  sectionPct(s: SectionView): number {
    return s.stickers.length ? Math.round((s.ownedCount / s.stickers.length) * 100) : 0;
  }

  formatIndex(order: number): string {
    return String(order).padStart(2, '0');
  }

  async cycle(s: StickerView) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      if (s.count === 0) await this.collectionService.markOwned(this.albumId, s.code, s.count);
      else                await this.collectionService.markMissing(this.albumId, s.code, s.count);
    } catch (err) {
      console.error('cycle failed', err);
    } finally {
      this.busy.set(false);
    }
  }

  async inc(s: StickerView) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      if (s.count === 0) await this.collectionService.markOwned(this.albumId, s.code, s.count);
      else                await this.collectionService.addDuplicate(this.albumId, s.code, s.count);
    } catch (err) {
      console.error('inc failed', err);
    } finally {
      this.busy.set(false);
    }
  }

  async dec(s: StickerView) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.collectionService.removeOne(this.albumId, s.code, s.count);
    } catch (err) {
      console.error('dec failed', err);
    } finally {
      this.busy.set(false);
    }
  }

  trackSection = (_: number, s: SectionView) => s.id;
  trackSticker = (_: number, s: StickerView) => s.code;
}
