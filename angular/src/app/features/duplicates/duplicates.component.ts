import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlbumViewService } from '../../core/services/album-view.service';
import { CollectionService } from '../../core/services/collection.service';
import { StickerView } from '../../core/models/album.model';

const ALBUM_ID = 'wc2026';

@Component({
  selector: 'app-duplicates',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wrap">
      <h1>Mis repes ({{ totalDups() }} para cambiar)</h1>

      <button class="copy" (click)="copyList()">
        Copiar lista de repes
      </button>

      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Cromo</th>
            <th>Tengo</th>
            <th>Repes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of duplicates(); trackBy: track">
            <td class="mono">{{ s.code }}</td>
            <td>{{ s.sectionName }} — {{ s.label }}</td>
            <td>{{ s.count }}</td>
            <td class="dups">+{{ s.count - 1 }}</td>
            <td class="actions">
              <button (click)="dec(s)">−</button>
              <button (click)="inc(s)">+</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p *ngIf="duplicates().length === 0" class="empty">
        No tienes cromos repetidos.
      </p>
    </div>
  `,
  styles: [
    `
      .wrap {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
      }
      .copy {
        margin: 0.5rem 0 1rem;
        padding: 0.5rem 1rem;
        cursor: pointer;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        text-align: left;
        padding: 0.4rem 0.6rem;
        border-bottom: 1px solid #eee;
      }
      .mono {
        font-family: monospace;
      }
      .dups {
        color: #e65100;
        font-weight: 600;
      }
      .actions button {
        width: 28px;
        height: 28px;
        margin: 0 2px;
        cursor: pointer;
      }
      .empty {
        color: #888;
      }
    `,
  ],
})
export class DuplicatesComponent {
  private viewService = inject(AlbumViewService);
  private collectionService = inject(CollectionService);

  duplicates = toSignal(this.viewService.getDuplicates(ALBUM_ID), {
    initialValue: [] as StickerView[],
  });

  totalDups = computed(() =>
    this.duplicates().reduce((sum, s) => sum + (s.count - 1), 0)
  );

  inc(s: StickerView) {
    this.collectionService.addDuplicate(ALBUM_ID, s.code);
  }

  dec(s: StickerView) {
    this.collectionService.removeOne(ALBUM_ID, s.code);
  }

  copyList() {
    const text = this.duplicates()
      .map((s) => `${s.code} (x${s.count - 1})`)
      .join(', ');
    navigator.clipboard.writeText(text);
  }

  track = (_: number, s: StickerView) => s.code;
}
