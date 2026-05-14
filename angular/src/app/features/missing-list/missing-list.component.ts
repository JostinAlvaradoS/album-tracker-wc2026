import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlbumViewService } from '../../core/services/album-view.service';
import { StickerView } from '../../core/models/album.model';

const ALBUM_ID = 'wc2026';

@Component({
  selector: 'app-missing-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wrap">
      <h1>Cromos que me faltan ({{ missing().length }})</h1>

      <button class="copy" (click)="copyList()">
        Copiar lista para compartir
      </button>

      <div class="group" *ngFor="let g of grouped()">
        <h3>{{ g.section }} ({{ g.items.length }})</h3>
        <span class="codes">{{ g.codes }}</span>
      </div>
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
      .group {
        margin-bottom: 0.75rem;
      }
      .group h3 {
        margin: 0.25rem 0;
      }
      .codes {
        color: #555;
        font-family: monospace;
      }
    `,
  ],
})
export class MissingListComponent {
  private viewService = inject(AlbumViewService);

  missing = toSignal(this.viewService.getMissing(ALBUM_ID), {
    initialValue: [] as StickerView[],
  });

  /** Agrupa las faltas por sección para una lista legible. */
  grouped = computed(() => {
    const bySection = new Map<string, StickerView[]>();
    for (const s of this.missing()) {
      const arr = bySection.get(s.sectionName) ?? [];
      arr.push(s);
      bySection.set(s.sectionName, arr);
    }
    return [...bySection.entries()].map(([section, items]) => ({
      section,
      items,
      codes: items
        .sort((a, b) => a.number - b.number)
        .map((i) => i.code)
        .join(', '),
    }));
  });

  copyList() {
    const text = this.grouped()
      .map((g) => `${g.section}: ${g.codes}`)
      .join('\n');
    navigator.clipboard.writeText(text);
  }
}
