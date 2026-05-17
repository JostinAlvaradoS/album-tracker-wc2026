import {
  Component,
  ChangeDetectionStrategy,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { StickerView } from '../../../core/models/album.model';

/**
 * Celda individual del álbum. Encapsula presentación y acciones del cromo.
 * Es presentacional: no toca servicios, emite eventos hacia el padre.
 */
@Component({
  selector: 'app-sticker-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, NgIf],
  template: `
    <button
      type="button"
      class="cell"
      [ngClass]="{
        'cell--owned':    sticker.status === 'owned',
        'cell--dupe':     sticker.status === 'duplicate',
        'cell--missing':  sticker.status === 'missing',
        'cell--emblem':   sticker.kind === 'emblem',
        'cell--special':  sticker.kind === 'special',
        'cell--photo':    sticker.kind === 'teamPhoto',
        'cell--foil':     sticker.foil
      }"
      [attr.aria-label]="ariaLabel"
      [attr.aria-pressed]="sticker.status !== 'missing'"
      (click)="cycle.emit()"
      (contextmenu)="onContext($event)">

      <span class="cell__face">
        <span class="cell__kind e26-code" aria-hidden="true">
          {{ kindLabel(sticker.kind) }}
        </span>

        <span class="cell__big e26-display">
          {{ bigLabel(sticker) }}
        </span>

        <span class="cell__code e26-code">{{ sticker.code }}</span>
      </span>

      <span class="cell__check" *ngIf="sticker.status === 'owned'" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="11" height="11">
          <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor"
                stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>

      <span class="cell__dupes e26-code" *ngIf="sticker.status === 'duplicate'">
        ×{{ sticker.count }}
      </span>

      <span class="cell__actions">
        <button type="button" class="act act--minus"
                *ngIf="sticker.count > 0"
                (click)="onDec($event)"
                aria-label="Quitar una">−</button>
        <button type="button" class="act act--plus"
                (click)="onInc($event)"
                [attr.aria-label]="sticker.count === 0 ? 'Marcar pegada' : 'Sumar repe'">+</button>
      </span>
    </button>
  `,
  styles: [`
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
    :host { display: contents; }
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

    @media (hover: none), (max-width: 767px) {
      .cell__actions { opacity: 1; }
      .act { width: 22px; height: 22px; font-size: 13px; }
    }
  `],
})
export class StickerCellComponent {
  @Input({ required: true }) sticker!: StickerView;

  @Output() readonly cycle = new EventEmitter<void>();
  @Output() readonly inc = new EventEmitter<void>();
  @Output() readonly dec = new EventEmitter<void>();
  @Output() readonly addDup = new EventEmitter<void>();

  get ariaLabel(): string {
    const s = this.sticker;
    const estado =
      s.status === 'owned'
        ? 'pegada'
        : s.status === 'duplicate'
          ? `con ${s.count - 1} repe${s.count - 1 === 1 ? '' : 's'}`
          : 'faltante';
    return `Figurita ${s.code}, ${s.label}, ${estado}`;
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

  onInc(ev: Event): void {
    ev.stopPropagation();
    this.inc.emit();
  }

  onDec(ev: Event): void {
    ev.stopPropagation();
    this.dec.emit();
  }

  onContext(ev: Event): void {
    ev.preventDefault();
    this.addDup.emit();
  }
}
