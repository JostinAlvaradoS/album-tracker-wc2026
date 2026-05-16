import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgIf, NgFor, NgSwitch, NgSwitchCase } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlbumViewService } from '../../core/services/album-view.service';
import { StickerView } from '../../core/models/album.model';
import { CURRENT_ALBUM_ID } from '../../core/config/app.tokens';

const MAX_RECENTS = 8;

type ResultState = 'idle' | 'invalid' | 'missing' | 'owned' | 'duplicate';

interface RecentEntry {
  code: string;
  state: ResultState;
  count: number;
  sectionName: string;
  label: string;
}

@Component({
  selector: 'app-comparator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, NgSwitch, NgSwitchCase],
  template: `
    <div class="page">

      <!-- ====== ENCABEZADO ====== -->
      <header class="head">
        <span class="e26-eyebrow">Comparador</span>
        <h1 class="head__title e26-display">
          Consulta rápida<br>
          <span class="head__accent">antes de cambiar.</span>
        </h1>
        <p class="head__sub">
          Escribe el código del cromo y mira si ya lo tienes pegado,
          o cuántas repes tienes para el intercambio.
        </p>
      </header>

      <!-- ====== BUSCADOR ====== -->
      <form class="search" (submit)="onSubmit($event)" novalidate>
        <label class="search__field" [class.search__field--has]="rawInput().length > 0">
          <span class="search__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                 stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-4-4"/>
            </svg>
          </span>
          <input
            #codeInput
            class="search__input e26-code"
            type="text"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="characters"
            spellcheck="false"
            inputmode="text"
            maxlength="6"
            pattern="[A-Z0-9]*"
            placeholder="ARG13"
            aria-label="Código del cromo"
            [value]="rawInput()"
            (input)="onInput($event)">
          <button
            *ngIf="rawInput().length > 0"
            type="button"
            class="search__clear"
            (click)="clearInput()"
            aria-label="Limpiar código">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M3 3l10 10M13 3 3 13"/>
            </svg>
          </button>
        </label>

        <p class="search__preview" *ngIf="match() as m">
          <span class="e26-code search__preview-code">{{ m.code }}</span>
          <span class="search__dot">·</span>
          <span>{{ m.sectionName }}</span>
          <span class="search__dot">·</span>
          <span class="search__preview-label">{{ m.label }}</span>
        </p>
        <p class="search__preview search__preview--muted" *ngIf="!match() && rawInput().length > 0">
          <span class="e26-code">{{ normalizedCode() }}</span>
          <span class="search__dot">·</span>
          <span>sin coincidencia en el catálogo</span>
        </p>
        <p class="search__preview search__preview--muted" *ngIf="rawInput().length === 0">
          Formato: <span class="e26-code">ARG13</span>, <span class="e26-code">MEX5</span>, <span class="e26-code">FWC1</span>, <span class="e26-code">CC10</span>…
        </p>
      </form>

      <!-- ====== RESULTADO ====== -->
      <section
        class="result"
        [attr.data-state]="state()"
        aria-live="polite">
        <ng-container [ngSwitch]="state()">

          <div *ngSwitchCase="'idle'" class="result__body result__body--idle">
            <div class="result__mark" aria-hidden="true">
              <svg viewBox="0 0 64 64" width="64" height="64" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="28" cy="28" r="18"/>
                <path d="m52 52-11-11"/>
              </svg>
            </div>
            <span class="result__title e26-display">Esperando código</span>
            <span class="result__sub">Empieza a escribir y verás el estado al instante.</span>
          </div>

          <div *ngSwitchCase="'invalid'" class="result__body">
            <span class="result__badge">Código inválido</span>
            <span class="result__title e26-display">Ese código no existe</span>
            <span class="result__sub">
              Revisa la sigla. El álbum usa códigos como
              <span class="e26-code">ARG13</span>,
              <span class="e26-code">MEX5</span> o
              <span class="e26-code">FWC1</span>.
            </span>
          </div>

          <div *ngSwitchCase="'missing'" class="result__body">
            <span class="result__badge">Te falta</span>
            <span class="result__title e26-display">No lo tienes</span>
            <span class="result__sub">
              Si te lo ofrecen, súmalo: completa un slot nuevo del álbum.
            </span>
            <div class="result__chips">
              <span class="chip">
                <span class="chip__label e26-eyebrow">Estado</span>
                <span class="chip__val">0 copias</span>
              </span>
              <span class="chip" *ngIf="match() as m">
                <span class="chip__label e26-eyebrow">Sección</span>
                <span class="chip__val">{{ m.sectionName }}</span>
              </span>
            </div>
          </div>

          <div *ngSwitchCase="'owned'" class="result__body">
            <span class="result__badge">Ya pegado</span>
            <span class="result__title e26-display">Ya lo tienes</span>
            <span class="result__sub">
              Pegado en el álbum, sin repes. Aceptarlo no suma nada.
            </span>
            <div class="result__chips">
              <span class="chip">
                <span class="chip__label e26-eyebrow">Estado</span>
                <span class="chip__val">Pegado</span>
              </span>
              <span class="chip">
                <span class="chip__label e26-eyebrow">Repes</span>
                <span class="chip__val">0</span>
              </span>
            </div>
          </div>

          <div *ngSwitchCase="'duplicate'" class="result__body">
            <span class="result__badge">
              Pegado + {{ dupesForTrade() }} {{ dupesForTrade() === 1 ? 'repe' : 'repes' }}
            </span>
            <span class="result__title e26-display">Ya lo tienes</span>
            <span class="result__sub">
              Tienes <strong>{{ dupesForTrade() }}</strong>
              {{ dupesForTrade() === 1 ? 'copia' : 'copias' }}
              para cambiar — no te conviene aceptar este.
            </span>
            <div class="result__chips">
              <span class="chip">
                <span class="chip__label e26-eyebrow">En total</span>
                <span class="chip__val">{{ matchCount() }} copias</span>
              </span>
              <span class="chip">
                <span class="chip__label e26-eyebrow">Para cambio</span>
                <span class="chip__val">{{ dupesForTrade() }}</span>
              </span>
            </div>
          </div>

        </ng-container>
      </section>

      <!-- ====== RECIENTES ====== -->
      <section class="recents" *ngIf="recents().length > 0">
        <header class="recents__head">
          <div>
            <span class="e26-eyebrow">Recientes</span>
            <h2 class="recents__title e26-display">En esta sesión</h2>
          </div>
          <button
            type="button"
            class="recents__clear"
            (click)="clearRecents()">
            Limpiar
          </button>
        </header>
        <ul class="recents__list">
          <li *ngFor="let r of recents(); trackBy: trackRecent"
              class="recent"
              [attr.data-state]="r.state">
            <span class="recent__dot" aria-hidden="true"></span>
            <span class="recent__code e26-code">{{ r.code }}</span>
            <span class="recent__section">{{ r.sectionName || '—' }}</span>
            <span class="recent__state">
              <ng-container [ngSwitch]="r.state">
                <ng-container *ngSwitchCase="'missing'">Te falta</ng-container>
                <ng-container *ngSwitchCase="'owned'">Pegado</ng-container>
                <ng-container *ngSwitchCase="'duplicate'">+{{ r.count - 1 }} {{ r.count - 1 === 1 ? 'repe' : 'repes' }}</ng-container>
                <ng-container *ngSwitchCase="'invalid'">Inválido</ng-container>
              </ng-container>
            </span>
          </li>
        </ul>
      </section>

      <!-- Pista de uso, solo si todavía no buscó nada -->
      <p class="tip" *ngIf="recents().length === 0 && state() === 'idle'">
        <span class="tip__kbd e26-code">Enter</span>
        para guardar el código en recientes y volver al input.
      </p>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-5);
      max-width: 720px;
      margin-inline: auto;
    }

    /* ===== HEAD ===== */
    .head {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-2);
    }
    .head__title {
      font-size: clamp(1.75rem, 5vw, 2.5rem);
      color: var(--e26-text);
      margin: 0;
    }
    .head__accent {
      color: var(--e26-text-muted);
      font-style: italic;
      font-weight: 500;
    }
    .head__sub {
      margin: 0;
      color: var(--e26-text-muted);
      font-size: var(--e26-fs-md);
      max-width: 52ch;
    }

    /* ===== SEARCH ===== */
    .search {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-2);
    }
    .search__field {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--e26-space-3);
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-lg);
      padding: var(--e26-space-3) var(--e26-space-4);
      min-height: 72px;
      box-shadow: var(--e26-shadow-sm);
      transition:
        border-color var(--e26-dur-fast) var(--e26-ease-out),
        box-shadow var(--e26-dur-fast) var(--e26-ease-out);
    }
    .search__field:focus-within {
      border-color: var(--e26-info);
      box-shadow: 0 0 0 4px var(--e26-info-soft);
    }
    .search__field--has {
      border-color: var(--e26-border-strong);
    }
    .search__icon {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      background: var(--e26-surface-2);
      border-radius: var(--e26-radius-md);
      color: var(--e26-text-muted);
    }
    .search__field:focus-within .search__icon {
      background: var(--e26-info-soft);
      color: var(--e26-info);
    }
    .search__input {
      border: 0;
      outline: 0;
      background: transparent;
      font-size: clamp(1.5rem, 5vw, 2rem);
      font-weight: 600;
      color: var(--e26-text);
      letter-spacing: 0.02em;
      text-transform: uppercase;
      min-width: 0;
      width: 100%;
      padding: 0;
    }
    .search__input::placeholder {
      color: var(--e26-text-subtle);
      font-weight: 500;
    }
    .search__clear {
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-pill);
      background: var(--e26-surface);
      color: var(--e26-text-muted);
      cursor: pointer;
      transition:
        color var(--e26-dur-fast) var(--e26-ease-out),
        border-color var(--e26-dur-fast) var(--e26-ease-out);
    }
    .search__clear:hover {
      color: var(--e26-text);
      border-color: var(--e26-border-strong);
    }

    .search__preview {
      margin: 0;
      padding: 0 var(--e26-space-2);
      font-size: var(--e26-fs-sm);
      color: var(--e26-text-muted);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--e26-space-2);
      min-height: 22px;
    }
    .search__preview-code { color: var(--e26-text); font-weight: 600; }
    .search__preview-label { color: var(--e26-text); }
    .search__preview--muted { color: var(--e26-text-subtle); }
    .search__dot { opacity: .5; }

    /* ===== RESULT ===== */
    .result {
      position: relative;
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-lg);
      padding: var(--e26-space-6) var(--e26-space-5);
      min-height: 240px;
      display: grid;
      align-items: center;
      overflow: hidden;
      transition:
        background var(--e26-dur-base) var(--e26-ease-out),
        border-color var(--e26-dur-base) var(--e26-ease-out);
    }
    .result::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 6px;
      background: var(--e26-border);
      transition: background var(--e26-dur-base) var(--e26-ease-out);
    }

    .result__body {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-3);
      padding-left: var(--e26-space-3);
      animation: result-in var(--e26-dur-slow) var(--e26-ease-spring) both;
    }
    .result__body--idle {
      align-items: center;
      text-align: center;
      color: var(--e26-text-subtle);
      padding-left: 0;
    }
    .result__mark { color: var(--e26-text-subtle); opacity: .5; }

    .result__badge {
      align-self: flex-start;
      font-family: var(--e26-font-mono);
      font-size: var(--e26-fs-xs);
      letter-spacing: var(--e26-tracking-caps);
      text-transform: uppercase;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: var(--e26-radius-pill);
      background: var(--e26-surface-2);
      color: var(--e26-text-muted);
    }

    .result__title {
      font-size: clamp(2rem, 7vw, 3rem);
      color: var(--e26-text);
      margin: 0;
      line-height: 1;
    }
    .result__sub {
      color: var(--e26-text-muted);
      font-size: var(--e26-fs-md);
      max-width: 50ch;
    }
    .result__sub strong {
      color: var(--e26-text);
      font-variant-numeric: tabular-nums;
    }

    .result__chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--e26-space-2);
      margin-top: var(--e26-space-2);
    }
    .chip {
      display: inline-flex;
      flex-direction: column;
      gap: 2px;
      padding: var(--e26-space-2) var(--e26-space-3);
      border-radius: var(--e26-radius-sm);
      background: var(--e26-surface-2);
      border: 1px solid var(--e26-border);
      min-width: 110px;
    }
    .chip__label { font-size: 10px; }
    .chip__val {
      font-size: var(--e26-fs-md);
      color: var(--e26-text);
      font-weight: 600;
    }

    /* Estados — color tokens semánticos */
    .result[data-state='missing'] {
      background: color-mix(in srgb, var(--e26-danger) 5%, var(--e26-surface));
      border-color: color-mix(in srgb, var(--e26-danger) 22%, var(--e26-border));
    }
    .result[data-state='missing']::before { background: var(--e26-danger); }
    .result[data-state='missing'] .result__badge {
      background: color-mix(in srgb, var(--e26-danger) 14%, transparent);
      color: var(--e26-danger);
    }

    .result[data-state='owned'] {
      background: color-mix(in srgb, var(--e26-primary) 6%, var(--e26-surface));
      border-color: color-mix(in srgb, var(--e26-primary) 22%, var(--e26-border));
    }
    .result[data-state='owned']::before { background: var(--e26-primary); }
    .result[data-state='owned'] .result__badge {
      background: var(--e26-primary-soft);
      color: var(--e26-primary);
    }

    .result[data-state='duplicate'] {
      background: color-mix(in srgb, var(--e26-accent) 6%, var(--e26-surface));
      border-color: color-mix(in srgb, var(--e26-accent) 22%, var(--e26-border));
    }
    .result[data-state='duplicate']::before { background: var(--e26-accent); }
    .result[data-state='duplicate'] .result__badge {
      background: var(--e26-accent-soft);
      color: var(--e26-accent);
    }

    .result[data-state='invalid'] {
      background: var(--e26-surface);
    }
    .result[data-state='invalid']::before { background: var(--e26-text-subtle); }
    .result[data-state='invalid'] .result__badge {
      background: var(--e26-surface-2);
      color: var(--e26-text-subtle);
    }

    /* ===== RECIENTES ===== */
    .recents {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-3);
    }
    .recents__head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--e26-space-3);
    }
    .recents__title {
      font-size: var(--e26-fs-xl);
      color: var(--e26-text);
      margin: 0;
    }
    .recents__clear {
      background: transparent;
      border: 1px solid var(--e26-border);
      color: var(--e26-text-muted);
      font-size: var(--e26-fs-sm);
      font-weight: 600;
      padding: var(--e26-space-2) var(--e26-space-3);
      border-radius: var(--e26-radius-pill);
      cursor: pointer;
      transition:
        color var(--e26-dur-fast) var(--e26-ease-out),
        border-color var(--e26-dur-fast) var(--e26-ease-out);
    }
    .recents__clear:hover {
      color: var(--e26-text);
      border-color: var(--e26-border-strong);
    }

    .recents__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--e26-border);
      border-radius: var(--e26-radius-md);
      background: var(--e26-surface);
      overflow: hidden;
    }
    .recent {
      display: grid;
      grid-template-columns: 14px 64px 1fr auto;
      align-items: center;
      gap: var(--e26-space-3);
      padding: var(--e26-space-3) var(--e26-space-4);
      border-bottom: 1px solid var(--e26-border);
      animation: recent-in var(--e26-dur-base) var(--e26-ease-out) both;
    }
    .recent:last-child { border-bottom: 0; }
    .recent__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--e26-text-subtle);
    }
    .recent__code {
      color: var(--e26-text);
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .recent__section {
      color: var(--e26-text-muted);
      font-size: var(--e26-fs-sm);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .recent__state {
      font-size: var(--e26-fs-sm);
      color: var(--e26-text-muted);
      font-weight: 500;
      white-space: nowrap;
    }

    .recent[data-state='missing'] .recent__dot { background: var(--e26-danger); }
    .recent[data-state='missing'] .recent__state { color: var(--e26-danger); }
    .recent[data-state='owned'] .recent__dot { background: var(--e26-primary); }
    .recent[data-state='owned'] .recent__state { color: var(--e26-primary); }
    .recent[data-state='duplicate'] .recent__dot { background: var(--e26-accent); }
    .recent[data-state='duplicate'] .recent__state { color: var(--e26-accent); }

    /* ===== TIP ===== */
    .tip {
      margin: 0;
      font-size: var(--e26-fs-sm);
      color: var(--e26-text-subtle);
      text-align: center;
    }
    .tip__kbd {
      display: inline-block;
      padding: 2px 8px;
      background: var(--e26-surface);
      border: 1px solid var(--e26-border);
      border-bottom-width: 2px;
      border-radius: var(--e26-radius-sm);
      color: var(--e26-text-muted);
      font-size: 11px;
      margin-right: 4px;
    }

    /* ===== Responsive ===== */
    @media (min-width: 768px) {
      .page { gap: var(--e26-space-6); }
      .search__field { min-height: 84px; padding: var(--e26-space-4) var(--e26-space-5); }
      .search__icon { width: 48px; height: 48px; }
      .result { padding: var(--e26-space-7) var(--e26-space-6); min-height: 280px; }
    }

    /* ===== Animaciones ===== */
    @keyframes result-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: none; }
    }
    @keyframes recent-in {
      from { opacity: 0; transform: translateX(-6px); }
      to   { opacity: 1; transform: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .result__body, .recent { animation: none; }
    }
  `],
})
export class ComparatorComponent implements AfterViewInit {
  private albumView = inject(AlbumViewService);
  private albumId = inject(CURRENT_ALBUM_ID);

  @ViewChild('codeInput') codeInputRef?: ElementRef<HTMLInputElement>;

  private sections = toSignal(this.albumView.getAlbumView(this.albumId), {
    initialValue: [],
  });

  /** Map<code, StickerView> reactivo. */
  private byCode = computed(() => {
    const map = new Map<string, StickerView>();
    for (const sec of this.sections()) {
      for (const s of sec.stickers) map.set(s.code, s);
    }
    return map;
  });

  rawInput = signal('');

  /** Normaliza: uppercase + sin espacios internos/extremos. */
  normalizedCode = computed(() =>
    this.rawInput().toUpperCase().replace(/\s+/g, '')
  );

  match = computed<StickerView | null>(() => {
    const code = this.normalizedCode();
    if (!code) return null;
    return this.byCode().get(code) ?? null;
  });

  matchCount = computed(() => this.match()?.count ?? 0);

  state = computed<ResultState>(() => {
    if (!this.normalizedCode()) return 'idle';
    const m = this.match();
    if (!m) return 'invalid';
    if (m.count === 0) return 'missing';
    if (m.count === 1) return 'owned';
    return 'duplicate';
  });

  dupesForTrade = computed(() => Math.max(0, this.matchCount() - 1));

  recents = signal<RecentEntry[]>([]);

  ngAfterViewInit(): void {
    this.codeInputRef?.nativeElement.focus();
  }

  onInput(ev: Event): void {
    const el = ev.target as HTMLInputElement;
    // Solo letras y dígitos; descarta espacios, símbolos y acentos.
    const cleaned = el.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    if (cleaned !== el.value) {
      el.value = cleaned;
    }
    this.rawInput.set(cleaned);
  }

  clearInput(): void {
    this.rawInput.set('');
    this.codeInputRef?.nativeElement.focus();
  }

  onSubmit(ev: Event): void {
    ev.preventDefault();
    const code = this.normalizedCode();
    if (!code) return;
    const m = this.match();
    const entry: RecentEntry = {
      code,
      state: this.state(),
      count: m?.count ?? 0,
      sectionName: m?.sectionName ?? '',
      label: m?.label ?? '',
    };
    this.recents.update((arr) => {
      const filtered = arr.filter((e) => e.code !== code);
      return [entry, ...filtered].slice(0, MAX_RECENTS);
    });
    this.rawInput.set('');
    queueMicrotask(() => this.codeInputRef?.nativeElement.focus());
  }

  clearRecents(): void {
    this.recents.set([]);
  }

  trackRecent = (_: number, r: RecentEntry) => r.code + ':' + r.count;
}
