import {
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlbumViewService } from '../../core/services/album-view.service';
import { CollectionService } from '../../core/services/collection.service';
import { StickerView } from '../../core/models/album.model';

const ALBUM_ID = 'wc2026';

@Component({
  selector: 'app-duplicates',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor],
  template: `
    <div class="page">

      <!-- Hero -->
      <section class="hero">
        <div class="hero__main">
          <span class="e26-eyebrow">Para intercambio</span>
          <h1 class="hero__title e26-display">
            <span class="hero__num">{{ totalDups() }}</span>
            <span class="hero__suffix">repe{{ totalDups() === 1 ? '' : 's' }}</span>
          </h1>
          <p class="hero__text">
            <span class="hero__count">{{ duplicates().length }}</span>
            cromos distintos repetidos. Comparte la lista o ajusta las
            cantidades con
            <span class="e26-code">+</span> / <span class="e26-code">−</span>.
          </p>
        </div>

        <button class="copy-btn"
                type="button"
                (click)="copyList()"
                [disabled]="duplicates().length === 0">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
               stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>{{ copyState() === 'idle' ? 'Copiar lista' : 'Copiado ✓' }}</span>
        </button>
      </section>

      <!-- Tabla -->
      <section class="list" *ngIf="duplicates().length > 0; else emptyTpl">
        <header class="list__head">
          <span class="col col--code">Código</span>
          <span class="col col--name">Cromo</span>
          <span class="col col--dups">Repes</span>
          <span class="col col--act">Ajustar</span>
        </header>

        <article class="row"
                 *ngFor="let s of duplicates(); trackBy: track">
          <span class="col col--code e26-code">{{ s.code }}</span>

          <span class="col col--name">
            <span class="row__primary">{{ s.label }}</span>
            <span class="row__section">{{ s.sectionName }}</span>
          </span>

          <span class="col col--dups">
            <span class="dup-badge e26-code">×{{ s.count - 1 }}</span>
          </span>

          <span class="col col--act actions">
            <button type="button"
                    class="step step--minus"
                    (click)="dec(s)"
                    aria-label="Quitar una">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M3 8h10"/>
              </svg>
            </button>
            <span class="step__count e26-code">{{ s.count }}</span>
            <button type="button"
                    class="step step--plus"
                    (click)="inc(s)"
                    aria-label="Sumar una">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M8 3v10M3 8h10"/>
              </svg>
            </button>
          </span>
        </article>
      </section>

      <ng-template #emptyTpl>
        <div class="empty">
          <span class="empty__num e26-display">0</span>
          <p class="empty__title e26-display">Sin repes</p>
          <p class="empty__text">
            No tienes cromos repetidos. Cuando te toque uno duplicado,
            aparecerá aquí listo para intercambiar.
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
      position: relative;
      overflow: hidden;
    }
    .hero::after {
      content: '';
      position: absolute;
      right: -40px;
      top: -40px;
      width: 180px;
      height: 180px;
      border-radius: 50%;
      background: var(--e26-accent-soft);
      opacity: .55;
      pointer-events: none;
      z-index: 0;
    }
    @media (min-width: 768px) {
      .hero { flex-direction: row; align-items: flex-end; justify-content: space-between; }
    }
    .hero__main {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-1);
      position: relative;
      z-index: 1;
    }
    .hero__title {
      margin: 0;
      display: flex;
      align-items: baseline;
      gap: var(--e26-space-3);
      flex-wrap: wrap;
    }
    .hero__num {
      font-size: clamp(2.5rem, 9vw, 4rem);
      color: var(--e26-accent);
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
    .hero__count { color: var(--e26-text); font-weight: 700; }
    .hero__text .e26-code {
      background: var(--e26-surface-2);
      padding: 1px 5px;
      border-radius: 4px;
      color: var(--e26-text);
      font-size: 11px;
    }

    .copy-btn {
      position: relative;
      z-index: 1;
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
    .copy-btn:hover:not(:disabled) { background: var(--e26-accent); border-color: var(--e26-accent); }
    .copy-btn:disabled { opacity: .5; cursor: not-allowed; }

    /* ===== LISTA ===== */
    .list {
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-lg);
      overflow: hidden;
    }
    .list__head {
      display: none;
      grid-template-columns: 90px 1fr 80px 140px;
      gap: var(--e26-space-3);
      padding: var(--e26-space-3) var(--e26-space-4);
      background: var(--e26-surface-2);
      border-bottom: 1px solid var(--e26-border);
      font-size: var(--e26-fs-xs);
      letter-spacing: var(--e26-tracking-caps);
      text-transform: uppercase;
      color: var(--e26-text-subtle);
      font-weight: 600;
    }
    @media (min-width: 768px) {
      .list__head { display: grid; }
    }

    .row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--e26-space-3);
      padding: var(--e26-space-3) var(--e26-space-4);
      border-bottom: 1px solid var(--e26-border);
    }
    .row:last-child { border-bottom: 0; }
    .row:hover { background: var(--e26-surface-2); }

    @media (min-width: 768px) {
      .row {
        grid-template-columns: 90px 1fr 80px 140px;
        gap: var(--e26-space-3);
      }
    }

    .col--code {
      font-size: var(--e26-fs-sm);
      font-weight: 700;
      color: var(--e26-info);
    }
    .col--name {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .row__primary {
      font-size: var(--e26-fs-sm);
      color: var(--e26-text);
      font-weight: 600;
    }
    .row__section {
      font-size: var(--e26-fs-xs);
      color: var(--e26-text-subtle);
    }
    .col--dups { display: none; }
    @media (min-width: 768px) {
      .col--dups { display: block; }
    }
    .dup-badge {
      display: inline-block;
      padding: 2px 8px;
      background: var(--e26-accent-soft);
      color: var(--e26-accent);
      border-radius: var(--e26-radius-pill);
      font-size: var(--e26-fs-xs);
      font-weight: 700;
    }

    .actions {
      display: inline-flex;
      align-items: center;
      gap: var(--e26-space-2);
      background: var(--e26-surface-2);
      border-radius: var(--e26-radius-pill);
      padding: 3px;
    }
    .step {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 0;
      background: var(--e26-surface);
      color: var(--e26-text);
      cursor: pointer;
      display: grid;
      place-items: center;
      box-shadow: var(--e26-shadow-sm);
      transition: background var(--e26-dur-fast) var(--e26-ease-out),
                  transform var(--e26-dur-fast) var(--e26-ease-out);
    }
    .step:hover { background: var(--e26-text); color: var(--e26-text-inverse); }
    .step:active { transform: scale(.94); }
    .step__count {
      min-width: 22px;
      text-align: center;
      font-size: var(--e26-fs-sm);
      font-weight: 700;
      color: var(--e26-text);
    }

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
      font-size: 5rem;
      line-height: 1;
      color: var(--e26-surface-3);
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
      max-width: 44ch;
    }
  `],
})
export class DuplicatesComponent {
  private viewService = inject(AlbumViewService);
  private collectionService = inject(CollectionService);

  duplicates = toSignal(this.viewService.getDuplicates(ALBUM_ID), {
    initialValue: [] as StickerView[],
  });

  copyState = signal<'idle' | 'copied'>('idle');

  totalDups = computed(() =>
    this.duplicates().reduce((sum, s) => sum + (s.count - 1), 0)
  );

  inc(s: StickerView) {
    this.collectionService.addDuplicate(ALBUM_ID, s.code, s.count);
  }

  dec(s: StickerView) {
    this.collectionService.removeOne(ALBUM_ID, s.code, s.count);
  }

  copyList() {
    const text = this.duplicates()
      .map(s => `${s.code} ×${s.count - 1}`)
      .join(', ');
    navigator.clipboard.writeText(text).then(() => {
      this.copyState.set('copied');
      setTimeout(() => this.copyState.set('idle'), 1800);
    });
  }

  track = (_: number, s: StickerView) => s.code;
}
