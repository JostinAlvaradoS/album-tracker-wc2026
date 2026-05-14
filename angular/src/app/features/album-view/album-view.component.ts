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
        <h1>{{ (album() )?.name }}</h1>
        <div class="progress" *ngIf="collection() as col">
          <span class="progress__num">
            {{ col.stats.owned }} / {{ col.stats.total }}
          </span>
          <div class="progress__bar">
            <div
              class="progress__fill"
              [style.width.%]="
                (col.stats.owned / col.stats.total) * 100
              "
            ></div>
          </div>
          <span class="progress__dups">
            {{ col.stats.duplicates }} repes
          </span>
        </div>
      </header>

      <section
        class="section"
        *ngFor="let section of sections(); trackBy: trackSection"
      >
        <h2 class="section__title">
          {{ section.name }}
          <small>{{ section.ownedCount }}/{{ section.slotCount }}</small>
        </h2>

        <div class="grid">
          <button
            *ngFor="let s of section.stickers; trackBy: trackSticker"
            class="cell"
            [class.cell--owned]="s.status === 'owned'"
            [class.cell--dup]="s.status === 'duplicate'"
            [class.cell--missing]="s.status === 'missing'"
            [class.cell--foil]="s.foil"
            [title]="s.code + ' · ' + s.label"
            (click)="cycle(s)"
            (contextmenu)="addDup($event, s)"
          >
            <span class="cell__code">{{ s.code }}</span>
            <span class="cell__count" *ngIf="s.count > 1">
              +{{ s.count - 1 }}
            </span>
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .album {
        max-width: 1100px;
        margin: 0 auto;
        padding: 1rem;
      }
      .album__head {
        position: sticky;
        top: 0;
        background: #fff;
        padding: 0.5rem 0;
        z-index: 5;
        border-bottom: 1px solid #eee;
      }
      .progress {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.9rem;
      }
      .progress__bar {
        flex: 1;
        height: 10px;
        background: #eee;
        border-radius: 5px;
        overflow: hidden;
      }
      .progress__fill {
        height: 100%;
        background: #2e7d32;
        transition: width 0.3s;
      }
      .section__title {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin: 1.5rem 0 0.5rem;
      }
      .section__title small {
        color: #888;
        font-weight: normal;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
        gap: 6px;
      }
      .cell {
        position: relative;
        aspect-ratio: 3 / 4;
        border: 1px solid #ccc;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.7rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fafafa;
      }
      .cell--missing {
        background: #fafafa;
        color: #aaa;
        border-style: dashed;
      }
      .cell--owned {
        background: #e8f5e9;
        border-color: #2e7d32;
        color: #1b5e20;
        font-weight: 600;
      }
      .cell--dup {
        background: #fff3e0;
        border-color: #ef6c00;
        color: #e65100;
        font-weight: 600;
      }
      .cell--foil {
        box-shadow: inset 0 0 0 2px gold;
      }
      .cell__count {
        position: absolute;
        top: 2px;
        right: 3px;
        font-size: 0.65rem;
        background: #ef6c00;
        color: #fff;
        border-radius: 8px;
        padding: 0 4px;
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
    // Inicializa el documento de colección cuando el álbum cargue.
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

  /** Click izquierdo: alterna falta <-> pegado (no toca repes). */
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

  /** Click derecho: suma una repe. */
  async addDup(event: MouseEvent, s: StickerView) {
    event.preventDefault();
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.collectionService.addDuplicate(ALBUM_ID, s.code);
    } finally {
      this.busy.set(false);
    }
  }

  trackSection = (_: number, s: { id: string }) => s.id;
  trackSticker = (_: number, s: StickerView) => s.code;
}
