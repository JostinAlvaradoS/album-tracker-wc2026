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
import { SectionFilterComponent } from '../shared/section-filter/section-filter.component';

type Filter = 'all' | 'owned' | 'missing' | 'dupe';

@Component({
  selector: 'app-album-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, UpperCasePipe, StickerCellComponent, SectionFilterComponent],
  template: `
    <div class="page">

      <!-- ====== FILTRO DE SECCIÓN (compartido) ====== -->
      <app-section-filter
        [sections]="sections()"
        [selected]="sectionFilter()"
        mode="progress"
        (selectedChange)="sectionFilter.set($event)" />

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
