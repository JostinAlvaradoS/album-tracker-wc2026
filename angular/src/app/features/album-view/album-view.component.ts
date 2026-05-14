import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlbumViewService } from '../../core/services/album-view.service';
import { CollectionService } from '../../core/services/collection.service';
import { AlbumCatalogService } from '../../core/services/album-catalog.service';
import { StickerView } from '../../core/models/album.model';

const ALBUM_ID = 'wc2026';

@Component({
  selector: 'app-album-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="album">
      <header class="album__head">
        <div class="brand">
          <span class="brand__tag">FIFA WORLD CUP 26™</span>
          <h1 class="brand__title">Mis cromos</h1>
        </div>

        <div class="progress" *ngIf="collection() as col">
          <div class="progress__row">
            <span class="progress__num">
              <strong>{{ col.stats.owned }}</strong>
              <span>/ {{ col.stats.total }}</span>
            </span>
            <span class="progress__pct">
              {{ ((col.stats.owned / col.stats.total) * 100) | number:'1.0-0' }}%
            </span>
            <span class="progress__dups" *ngIf="col.stats.duplicates > 0">
              {{ col.stats.duplicates }} repes
            </span>
          </div>
          <div class="progress__bar">
            <div
              class="progress__fill"
              [style.width.%]="
                (col.stats.owned / col.stats.total) * 100
              "
            ></div>
          </div>
        </div>

        <p class="hint">
          Tap en la celda <span class="kbd">tengo / no tengo</span> ·
          <span class="kbd">+</span> repe ·
          <span class="kbd">−</span> quitar una
        </p>
      </header>

      <section
        class="section"
        *ngFor="let section of sections(); trackBy: trackSection"
      >
        <h2 class="section__title">
          <span class="section__name">{{ section.name }}</span>
          <span class="section__count">
            {{ section.ownedCount }}<span class="muted">/{{ section.slotCount }}</span>
          </span>
        </h2>

        <div class="grid">
          <div
            *ngFor="let s of section.stickers; trackBy: trackSticker"
            class="cell"
            [class.cell--owned]="s.status === 'owned'"
            [class.cell--dup]="s.status === 'duplicate'"
            [class.cell--missing]="s.status === 'missing'"
            [class.cell--emblem]="s.kind === 'emblem'"
            [class.cell--teamPhoto]="s.kind === 'teamPhoto'"
            [class.cell--player]="s.kind === 'player'"
            [class.cell--special]="s.kind === 'special'"
            [class.cell--foil]="s.foil"
            [title]="s.code + ' · ' + s.label"
            (click)="cycle(s)"
            (contextmenu)="addDup($event, s)"
          >
            <span class="cell__kind" aria-hidden="true">
              {{ kindIcon(s.kind) }}
            </span>

            <span class="cell__code">{{ s.code }}</span>

            <span class="cell__count" *ngIf="s.count > 1">
              ×{{ s.count }}
            </span>

            <span class="cell__check" *ngIf="s.count >= 1" aria-hidden="true">
              ✓
            </span>

            <div class="cell__actions">
              <button
                *ngIf="s.count >= 1"
                type="button"
                class="act act--minus"
                (click)="dec($event, s)"
                aria-label="Quitar una"
                title="Quitar una"
              >
                −
              </button>
              <button
                type="button"
                class="act act--plus"
                (click)="inc($event, s)"
                aria-label="Sumar una repe"
                title="Sumar una repe"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .album {
        max-width: 1100px;
        margin: 0 auto;
        padding: 1rem 1rem 4rem;
      }

      /* Header */
      .album__head {
        position: sticky;
        top: 0;
        background: linear-gradient(180deg, #fff 70%, rgba(255,255,255,0.95));
        padding: 0.6rem 0 0.75rem;
        z-index: 5;
        border-bottom: 1px solid var(--border);
        backdrop-filter: blur(6px);
      }
      .brand {
        display: flex;
        align-items: baseline;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .brand__tag {
        display: inline-block;
        font-size: 0.66rem;
        letter-spacing: 0.15em;
        font-weight: 700;
        color: #fff;
        background: var(--navy);
        padding: 3px 7px;
        border-radius: 3px;
      }
      .brand__title {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      .progress {
        margin-top: 0.5rem;
      }
      .progress__row {
        display: flex;
        align-items: baseline;
        gap: 0.6rem;
        font-size: 0.85rem;
        color: var(--gray-600);
        margin-bottom: 0.3rem;
      }
      .progress__num strong {
        font-size: 1.1rem;
        color: var(--navy);
      }
      .progress__pct {
        color: var(--pitch);
        font-weight: 700;
      }
      .progress__dups {
        margin-left: auto;
        color: var(--orange);
        font-weight: 600;
        font-size: 0.78rem;
        background: var(--orange-light);
        padding: 1px 7px;
        border-radius: 10px;
      }
      .progress__bar {
        height: 6px;
        background: var(--gray-100);
        border-radius: 4px;
        overflow: hidden;
      }
      .progress__fill {
        height: 100%;
        background: linear-gradient(90deg, var(--pitch) 0%, var(--pitch-dark) 100%);
        transition: width 0.4s ease;
      }
      .hint {
        margin: 0.5rem 0 0;
        font-size: 0.75rem;
        color: var(--gray-400);
      }
      .kbd {
        display: inline-block;
        background: var(--gray-100);
        border: 1px solid var(--gray-200);
        border-radius: 3px;
        padding: 0 4px;
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-size: 0.7rem;
        color: var(--gray-600);
      }

      /* Section title */
      .section__title {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin: 1.75rem 0 0.6rem;
        padding-left: 0.5rem;
        border-left: 3px solid var(--pitch);
        font-size: 0.95rem;
      }
      .section__name {
        font-weight: 700;
        color: var(--navy);
      }
      .section__count {
        font-variant-numeric: tabular-nums;
        font-weight: 700;
        color: var(--gray-900);
      }
      .muted {
        color: var(--gray-400);
        font-weight: 400;
      }

      /* Grid */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
        gap: 7px;
      }

      /* ===== Celda base ===== */
      .cell {
        position: relative;
        aspect-ratio: 3 / 4;
        border-radius: 8px;
        border: 1.5px solid var(--border);
        background: #fff;
        cursor: pointer;
        user-select: none;
        font-size: 0.72rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--gray-600);
        overflow: hidden;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }
      .cell:active {
        transform: scale(0.97);
      }
      .cell__code {
        z-index: 1;
        letter-spacing: 0.01em;
      }
      .cell__kind {
        position: absolute;
        top: 4px;
        left: 5px;
        font-size: 0.7rem;
        opacity: 0.45;
        line-height: 1;
      }

      /* ===== Estado: missing ===== */
      .cell--missing {
        background:
          repeating-linear-gradient(
            45deg,
            #fafafa,
            #fafafa 6px,
            #f1f1f1 6px,
            #f1f1f1 12px
          );
        border-style: dashed;
        border-color: var(--gray-200);
        color: var(--gray-400);
      }

      /* ===== Estado: owned (pegado) ===== */
      .cell--owned {
        background: linear-gradient(160deg, var(--pitch) 0%, var(--pitch-dark) 100%);
        border-color: var(--pitch-dark);
        color: #fff;
        font-weight: 800;
        box-shadow:
          0 2px 6px rgba(0, 131, 63, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.18);
      }
      .cell--owned .cell__kind {
        opacity: 0.6;
        color: #fff;
      }
      .cell__check {
        position: absolute;
        top: 3px;
        right: 5px;
        font-size: 0.85rem;
        font-weight: 900;
        color: var(--gold);
        line-height: 1;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
        z-index: 1;
      }
      .cell--dup .cell__check {
        color: #fff;
      }

      /* ===== Estado: duplicate ===== */
      .cell--dup {
        background: linear-gradient(160deg, #ff8c1a 0%, #e65100 100%);
        border-color: #c44600;
        color: #fff;
        font-weight: 800;
        box-shadow:
          0 2px 6px rgba(239, 108, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }
      .cell--dup .cell__kind {
        opacity: 0.6;
        color: #fff;
      }
      .cell__count {
        position: absolute;
        bottom: 26px;
        right: 5px;
        font-size: 0.68rem;
        font-weight: 800;
        background: #fff;
        color: #c44600;
        padding: 1px 5px;
        border-radius: 8px;
        line-height: 1.3;
        z-index: 1;
      }

      /* ===== Variantes por tipo de cromo ===== */

      /* Escudo: forma de placa con borde dorado */
      .cell--emblem {
        border-radius: 50% 50% 12px 12px;
      }
      .cell--emblem.cell--foil {
        border-color: var(--gold);
        box-shadow:
          inset 0 0 0 1.5px var(--gold-light),
          0 0 0 1px var(--gold);
      }
      .cell--emblem.cell--owned {
        border-color: var(--gold);
      }
      .cell--emblem.cell--foil.cell--owned {
        box-shadow:
          inset 0 0 0 1.5px rgba(255, 255, 255, 0.3),
          0 0 0 1.5px var(--gold),
          0 2px 8px rgba(200, 162, 39, 0.3);
      }

      /* Foto del equipo: horizontal, ocupa 2 columnas */
      .cell--teamPhoto {
        grid-column: span 2;
        aspect-ratio: 16 / 9;
        border-radius: 6px;
        background-image:
          linear-gradient(
            to bottom,
            transparent 60%,
            rgba(0, 131, 63, 0.06) 60%,
            rgba(0, 131, 63, 0.08) 100%
          );
      }
      .cell--teamPhoto.cell--owned {
        background-image: none;
      }

      /* Player: estilo por defecto */
      .cell--player { }

      /* Special (FWC, CC): acento dorado/navy */
      .cell--special {
        background: var(--gray-100);
        border-color: var(--gray-200);
      }
      .cell--special.cell--missing {
        background:
          repeating-linear-gradient(
            45deg,
            #f6f6f6, #f6f6f6 6px,
            #ececec 6px, #ececec 12px
          );
      }
      .cell--special.cell--foil {
        border-color: var(--gold);
        background: linear-gradient(135deg, #fffaeb 0%, var(--gold-light) 100%);
      }
      .cell--special.cell--foil.cell--owned {
        background: linear-gradient(160deg, #b88a18 0%, #8c6710 100%);
        border-color: var(--gold);
      }

      /* ===== Botones +/- ===== */
      .cell__actions {
        position: absolute;
        bottom: 4px;
        left: 4px;
        right: 4px;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
        z-index: 2;
      }
      .act {
        pointer-events: auto;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 0;
        background: rgba(255, 255, 255, 0.95);
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        color: var(--gray-900);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        transition: transform 0.1s ease, background 0.1s ease;
      }
      .act:hover {
        transform: scale(1.1);
      }
      .act--plus {
        color: var(--orange);
        margin-left: auto;
      }
      .act--minus {
        color: var(--red);
      }
      .cell--missing .act--plus {
        background: var(--pitch);
        color: #fff;
      }
    `,
  ],
})
export class AlbumViewComponent {
  private viewService = inject(AlbumViewService);
  private collectionService = inject(CollectionService);
  private catalogService = inject(AlbumCatalogService);

  album = toSignal(this.catalogService.getAlbum(ALBUM_ID));
  sections = toSignal(this.viewService.getAlbumView(ALBUM_ID), {
    initialValue: [],
  });
  collection = toSignal(this.collectionService.getCollection(ALBUM_ID));

  busy = signal(false);

  constructor() {
    const a = this.album;
    queueMicrotask(async () => {
      const album = a();
      if (album) {
        await this.collectionService.ensureCollection(
          ALBUM_ID,
          album.totalSlots
        );
      }
    });
  }

  kindIcon(kind: string): string {
    switch (kind) {
      case 'emblem':    return '◆';
      case 'teamPhoto': return '▭';
      case 'special':   return '★';
      default:          return '';
    }
  }

  /** Click en la celda: alterna falta <-> pegado. */
  async cycle(s: StickerView) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      if (s.count === 0) {
        await this.collectionService.markOwned(ALBUM_ID, s.code);
      } else {
        await this.collectionService.markMissing(ALBUM_ID, s.code);
      }
    } finally {
      this.busy.set(false);
    }
  }

  async inc(event: Event, s: StickerView) {
    event.stopPropagation();
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.collectionService.addDuplicate(ALBUM_ID, s.code);
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

  trackSection = (_: number, s: { id: string }) => s.id;
  trackSticker = (_: number, s: StickerView) => s.code;
}
