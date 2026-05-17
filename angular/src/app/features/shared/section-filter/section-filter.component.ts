import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { SectionView } from '../../../core/models/album.model';

/**
 * Modos del filtro:
 *  - 'progress'      → chip muestra barra de progreso (ownedCount / total).
 *  - 'missing-count' → chip muestra cantidad de cromos faltantes.
 *  - 'dupe-count'    → chip muestra cantidad de cromos con repes.
 */
export type SectionFilterMode = 'progress' | 'missing-count' | 'dupe-count';

@Component({
  selector: 'app-section-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor],
  template: `
    <div class="picker">
      <label class="select" [class.select--active]="selected !== ''">
        <span class="select__label e26-eyebrow">Sección</span>
        <select
          [value]="selected"
          (change)="onSelect($event)"
          aria-label="Filtrar por sección o equipo">
          <option value="">Todas las secciones</option>
          <optgroup *ngIf="specialSections.length > 0" label="Especiales">
            <option *ngFor="let s of specialSections; trackBy: trackSection"
                    [value]="s.id">
              {{ optionLabel(s) }}
            </option>
          </optgroup>
          <optgroup *ngIf="teamSections.length > 0" label="Selecciones">
            <option *ngFor="let s of teamSections; trackBy: trackSection"
                    [value]="s.id">
              {{ optionLabel(s) }}
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
              class="picker__clear"
              *ngIf="selected !== ''"
              (click)="clear()"
              aria-label="Quitar filtro de sección">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M3 3l10 10M13 3 3 13"/>
        </svg>
        <span>Limpiar</span>
      </button>
    </div>

    <div class="team-chips" *ngIf="chipsSections.length > 0">
      <span class="e26-eyebrow team-chips__label">{{ chipsHeaderLabel }}</span>
      <div class="team-chips__scroll">
        <button type="button"
                class="team-chip"
                *ngFor="let s of chipsSections; trackBy: trackSection"
                [class.team-chip--selected]="selected === s.id"
                [class.team-chip--complete]="isComplete(s)"
                [class.team-chip--special]="s.type !== 'team'"
                (click)="toggle(s.id)"
                [attr.aria-pressed]="selected === s.id"
                [title]="optionLabel(s)">
          <span class="team-chip__code e26-code">{{ chipLabel(s) }}</span>

          <ng-container *ngIf="mode === 'progress'; else countBadge">
            <span class="team-chip__pct" aria-hidden="true">
              <span class="team-chip__fill" [style.width.%]="pctFor(s)"></span>
            </span>
          </ng-container>
          <ng-template #countBadge>
            <span class="team-chip__count e26-code"
                  [class.team-chip__count--accent]="mode === 'dupe-count'"
                  aria-hidden="true">
              {{ countFor(s) }}
            </span>
          </ng-template>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-3);
    }

    /* ===== SELECT ===== */
    .picker {
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

    .picker__clear {
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
    .picker__clear:hover {
      color: var(--e26-text);
      border-color: var(--e26-border-strong);
    }

    /* ===== TEAM CHIPS ===== */
    .team-chips {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-2);
    }
    .team-chips__label { color: var(--e26-text-subtle); }
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
    .team-chip__count {
      font-size: 10px;
      font-weight: 700;
      color: var(--e26-text-subtle);
      font-variant-numeric: tabular-nums;
    }
    .team-chip__count--accent { color: var(--e26-accent); }

    .team-chip--selected {
      background: var(--e26-text);
      color: var(--e26-text-inverse);
      border-color: var(--e26-text);
    }
    .team-chip--selected .team-chip__pct { background: rgba(255, 255, 255, .22); }
    .team-chip--selected .team-chip__count { color: var(--e26-text-inverse); opacity: .85; }

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

    /* Diferencia visual leve para secciones no-team (FWC, champions, Coca-Cola).
       Borde punteado + tono de info para que se distingan de las 48 selecciones. */
    .team-chip--special:not(.team-chip--selected) {
      border-style: dashed;
      border-color: var(--e26-border-strong);
    }
    .team-chip--special .team-chip__code { color: var(--e26-info); }
    .team-chip--special.team-chip--selected .team-chip__code { color: inherit; }
  `],
})
export class SectionFilterComponent {
  @Input({ required: true }) sections: SectionView[] = [];
  @Input() selected = '';
  @Input() mode: SectionFilterMode = 'progress';
  @Output() readonly selectedChange = new EventEmitter<string>();

  get teamSections(): SectionView[] {
    return this.sections.filter((s) => s.type === 'team');
  }

  get specialSections(): SectionView[] {
    return this.sections.filter((s) => s.type !== 'team');
  }

  /**
   * Chips visibles: especiales primero, luego selecciones.
   * Cubre FWC, champions, Coca-Cola y los 48 equipos en un solo carrusel.
   */
  get chipsSections(): SectionView[] {
    return [...this.specialSections, ...this.teamSections];
  }

  get chipsHeaderLabel(): string {
    switch (this.mode) {
      case 'missing-count':
        return 'Secciones con faltantes';
      case 'dupe-count':
        return 'Secciones con repes';
      default:
        return 'Secciones';
    }
  }

  /** Etiqueta corta para el chip. Usa el code si existe; sino, primeras 3 letras del nombre. */
  chipLabel(s: SectionView): string {
    if (s.code) return s.code;
    const slug = s.name.replace(/[^A-Za-z0-9]/g, '');
    return (slug || s.id).slice(0, 3).toUpperCase();
  }

  countFor(s: SectionView): number {
    switch (this.mode) {
      case 'missing-count':
        return s.stickers.filter((x) => x.status === 'missing').length;
      case 'dupe-count':
        return s.stickers.filter((x) => x.status === 'duplicate').length;
      default:
        return s.ownedCount;
    }
  }

  pctFor(s: SectionView): number {
    if (this.mode !== 'progress') return 0;
    return s.stickers.length
      ? Math.round((s.ownedCount / s.stickers.length) * 100)
      : 0;
  }

  isComplete(s: SectionView): boolean {
    return (
      this.mode === 'progress' &&
      s.stickers.length > 0 &&
      s.ownedCount === s.stickers.length
    );
  }

  optionLabel(s: SectionView): string {
    const prefix = s.code ? `${s.code} · ` : '';
    if (this.mode === 'progress') {
      return `${prefix}${s.name} · ${s.ownedCount}/${s.stickers.length}`;
    }
    return `${prefix}${s.name} · ${this.countFor(s)}`;
  }

  onSelect(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    this.selectedChange.emit(v);
  }

  toggle(id: string): void {
    this.selectedChange.emit(this.selected === id ? '' : id);
  }

  clear(): void {
    this.selectedChange.emit('');
  }

  trackSection = (_: number, s: SectionView) => s.id;
}
