import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlbumViewService } from '../../core/services/album-view.service';
import { StickerView } from '../../core/models/album.model';
import { CURRENT_ALBUM_ID } from '../../core/config/app.tokens';

interface MissingGroup {
  section: string;
  items: StickerView[];
  codes: string;
}

@Component({
  selector: 'app-missing-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor],
  template: `
    <div class="page">

      <!-- Hero -->
      <section class="hero">
        <div class="hero__main">
          <span class="e26-eyebrow">Lista de faltas</span>
          <h1 class="hero__title e26-display">
            <span class="hero__num e26-display">{{ missing().length }}</span>
            <span class="hero__suffix">cromos pendientes</span>
          </h1>
          <p class="hero__text">
            Comparte esta lista con quien intercambies.
            Cada código corresponde a un slot del álbum.
          </p>
        </div>

        <button class="copy-btn"
                type="button"
                (click)="copyList()"
                [disabled]="missing().length === 0">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
               stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>{{ copyState() === 'idle' ? 'Copiar lista' : 'Copiado ✓' }}</span>
        </button>
      </section>

      <!-- Grupos -->
      <section class="groups" *ngIf="grouped().length > 0; else emptyTpl">
        <article class="group"
                 *ngFor="let g of grouped(); trackBy: trackGroup">
          <header class="group__head">
            <h2 class="group__name e26-display">{{ g.section }}</h2>
            <span class="group__count e26-code">
              {{ g.items.length }} <span class="muted">cromos</span>
            </span>
          </header>

          <div class="codes">
            <span class="code-pill e26-code"
                  *ngFor="let it of g.items; trackBy: trackItem">
              {{ it.code }}
            </span>
          </div>
        </article>
      </section>

      <ng-template #emptyTpl>
        <div class="empty">
          <span class="e26-display empty__num">∎</span>
          <p class="empty__title e26-display">Álbum completo</p>
          <p class="empty__text">
            No te falta ningún cromo. Si te toca alguna repe,
            la verás en <strong>Mis repes</strong>.
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

    /* ===== HERO ===== */
    .hero {
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-lg);
      padding: var(--e26-space-5);
      box-shadow: var(--e26-shadow-sm);
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-4);
    }
    @media (min-width: 768px) {
      .hero {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
      }
    }
    .hero__main { display: flex; flex-direction: column; gap: var(--e26-space-1); }
    .hero__title {
      margin: 0;
      display: flex;
      align-items: baseline;
      gap: var(--e26-space-3);
      flex-wrap: wrap;
    }
    .hero__num {
      font-size: clamp(2.5rem, 9vw, 4rem);
      color: var(--e26-text);
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1;
    }
    .hero__suffix {
      font-size: var(--e26-fs-lg);
      color: var(--e26-text-muted);
      font-family: var(--e26-font-body);
      font-weight: 500;
    }
    .hero__text {
      margin: var(--e26-space-2) 0 0;
      color: var(--e26-text-muted);
      font-size: var(--e26-fs-sm);
      max-width: 52ch;
    }

    .copy-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--e26-space-2);
      padding: var(--e26-space-3) var(--e26-space-5);
      border-radius: var(--e26-radius-md);
      border: 1px solid var(--e26-text);
      background: var(--e26-text);
      color: var(--e26-text-inverse);
      font-family: var(--e26-font-body);
      font-size: var(--e26-fs-sm);
      font-weight: 600;
      cursor: pointer;
      min-height: 44px;
      align-self: flex-start;
      transition: background var(--e26-dur-fast) var(--e26-ease-out);
    }
    .copy-btn:hover:not(:disabled) { background: var(--e26-primary); border-color: var(--e26-primary); }
    .copy-btn:disabled { opacity: .5; cursor: not-allowed; }

    /* ===== GROUPS ===== */
    .groups {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--e26-space-3);
    }
    @media (min-width: 768px) {
      .groups { grid-template-columns: repeat(2, 1fr); }
    }
    @media (min-width: 1280px) {
      .groups { grid-template-columns: repeat(3, 1fr); }
    }

    .group {
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-lg);
      padding: var(--e26-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-3);
      transition: border-color var(--e26-dur-base) var(--e26-ease-out);
    }
    .group:hover { border-color: var(--e26-border-strong); }
    .group__head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--e26-space-3);
      padding-bottom: var(--e26-space-2);
      border-bottom: 1px solid var(--e26-border);
    }
    .group__name {
      margin: 0;
      font-size: var(--e26-fs-md);
      color: var(--e26-text);
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .group__count {
      font-size: var(--e26-fs-xs);
      color: var(--e26-text);
      font-weight: 700;
    }
    .group__count .muted { color: var(--e26-text-subtle); font-weight: 500; }

    .codes {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .code-pill {
      display: inline-block;
      padding: 3px 8px;
      background: var(--e26-surface-2);
      border-radius: var(--e26-radius-sm);
      font-size: 11px;
      color: var(--e26-text-muted);
      letter-spacing: 0.04em;
      transition: background var(--e26-dur-fast) var(--e26-ease-out),
                  color var(--e26-dur-fast) var(--e26-ease-out);
    }
    .code-pill:hover { background: var(--e26-info-soft); color: var(--e26-info); }

    /* ===== EMPTY ===== */
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
      line-height: 1;
      color: var(--e26-primary);
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
      max-width: 40ch;
    }
  `],
})
export class MissingListComponent {
  private viewService = inject(AlbumViewService);
  private albumId = inject(CURRENT_ALBUM_ID);

  missing = toSignal(this.viewService.getMissing(this.albumId), {
    initialValue: [] as StickerView[],
  });

  copyState = signal<'idle' | 'copied'>('idle');

  grouped = computed<MissingGroup[]>(() => {
    const bySection = new Map<string, StickerView[]>();
    for (const s of this.missing()) {
      const arr = bySection.get(s.sectionName) ?? [];
      arr.push(s);
      bySection.set(s.sectionName, arr);
    }
    return [...bySection.entries()].map(([section, items]) => {
      const sorted = items.slice().sort((a, b) => a.number - b.number);
      return {
        section,
        items: sorted,
        codes: sorted.map(i => i.code).join(', '),
      };
    });
  });

  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.copyResetTimer !== null) clearTimeout(this.copyResetTimer);
    });
  }

  copyList() {
    const text = this.grouped()
      .map(g => `${g.section}: ${g.codes}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      this.copyState.set('copied');
      if (this.copyResetTimer !== null) clearTimeout(this.copyResetTimer);
      this.copyResetTimer = setTimeout(() => {
        this.copyState.set('idle');
        this.copyResetTimer = null;
      }, 1800);
    });
  }

  trackGroup = (_: number, g: MissingGroup) => g.section;
  trackItem = (_: number, s: StickerView) => s.code;
}
