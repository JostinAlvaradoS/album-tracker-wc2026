import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import {
  AuthService,
  UnauthorizedEmailError,
} from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf],
  template: `
    <main class="auth">
      <!-- Barra superior con marca y edición -->
      <header class="auth__topbar">
        <div class="brand">
          <span class="brand__mark e26-display" aria-hidden="true">26</span>
          <div class="brand__text">
            <span class="brand__line e26-code">LÍNEA 26</span>
            <span class="brand__sub">Tracker de cromos</span>
          </div>
        </div>
        <span class="auth__edition e26-code" aria-hidden="true">EDICIÓN · FWC 2026</span>
      </header>

      <div class="auth__split">
        <!-- HERO -->
        <section class="hero">
          <div class="hero__grid" aria-hidden="true">
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span>
          </div>

          <div class="hero__content">
            <span class="e26-eyebrow hero__eyebrow">Tu álbum, en su sitio</span>

            <h1 class="hero__title e26-display">
              <span>Lleva la cuenta,</span>
              <span class="hero__title-accent">cromo a cromo.</span>
            </h1>

            <p class="hero__lede">
              Pegados, repes, faltantes y progreso por selección.
              Sin ruido visual, sin marcas oficiales, con números limpios.
            </p>

            <dl class="hero__stats">
              <div class="stat">
                <dt class="e26-eyebrow">Cromos</dt>
                <dd class="stat__num e26-display">994</dd>
              </div>
              <div class="stat">
                <dt class="e26-eyebrow">Selecciones</dt>
                <dd class="stat__num e26-display">48</dd>
              </div>
              <div class="stat">
                <dt class="e26-eyebrow">Edición</dt>
                <dd class="stat__num e26-display">2026</dd>
              </div>
            </dl>
          </div>

          <!-- Stack de cromos flotantes -->
          <div class="stack" aria-hidden="true">
            <article class="card card--back">
              <header class="card__head">
                <span class="card__num e26-code">001</span>
                <span class="card__code e26-code">FWC</span>
              </header>
              <div class="card__plate"></div>
              <footer class="card__foot e26-code">INTRO</footer>
              <span class="card__shine"></span>
            </article>

            <article class="card card--mid">
              <header class="card__head">
                <span class="card__num e26-code">408</span>
                <span class="card__code e26-code">ARG</span>
              </header>
              <div class="card__plate card__plate--dupe"></div>
              <footer class="card__foot e26-code">REPETIDA</footer>
              <span class="card__shine"></span>
            </article>

            <article class="card card--front">
              <header class="card__head">
                <span class="card__num e26-code">994</span>
                <span class="card__code e26-code">CC</span>
              </header>
              <div class="card__plate card__plate--owned">
                <span class="card__check" aria-hidden="true">✓</span>
              </div>
              <footer class="card__foot e26-code">PEGADA</footer>
              <span class="card__shine"></span>
            </article>
          </div>

          <span class="hero__mark e26-display" aria-hidden="true">26</span>
        </section>

        <!-- ACTION -->
        <section class="action">
          <div class="action__inner">
            <div class="action__head">
              <span class="e26-eyebrow">Acceso restringido</span>
              <h2 class="e26-display action__title">Entra a tu colección.</h2>
              <p class="action__sub">
                Solo cuentas autorizadas pueden ingresar.
                Si no tienes acceso, pídeselo al admin.
              </p>
            </div>

            <button
              type="button"
              class="btn-google"
              (click)="loginGoogle()"
              [disabled]="busy()">
              <span class="btn-google__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M21.6 12.227c0-.7-.063-1.373-.18-2.018H12v3.818h5.385a4.6 4.6 0 0 1-1.996 3.018v2.5h3.227c1.89-1.74 2.984-4.305 2.984-7.318Z"/>
                  <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.618-2.418l-3.227-2.5c-.895.6-2.04.954-3.391.954-2.605 0-4.81-1.76-5.6-4.125H3.077v2.59A9.998 9.998 0 0 0 12 22Z"/>
                  <path fill="#FBBC05" d="M6.4 13.91A6.014 6.014 0 0 1 6.082 12c0-.66.114-1.3.318-1.91V7.5H3.077A9.998 9.998 0 0 0 2 12c0 1.614.386 3.14 1.077 4.5l3.323-2.59Z"/>
                  <path fill="#EA4335" d="M12 5.977c1.468 0 2.786.504 3.823 1.495l2.866-2.866C16.96 3 14.695 2 12 2A9.998 9.998 0 0 0 3.077 7.5l3.323 2.59C7.19 7.737 9.395 5.977 12 5.977Z"/>
                </svg>
              </span>
              <span class="btn-google__label">
                <span class="btn-google__title">Continuar con Google</span>
                <span class="btn-google__hint">sincroniza entre dispositivos</span>
              </span>
              <span class="btn-google__arrow" aria-hidden="true">→</span>
            </button>

            <p class="action__error" *ngIf="error()" role="alert">{{ error() }}</p>

            <footer class="action__foot">
              <span class="e26-eyebrow">Línea 26</span>
              <span class="dot" aria-hidden="true">·</span>
              <span>Identidad propia · Sin marcas FIFA</span>
            </footer>
          </div>
        </section>
      </div>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100dvh;
      background: var(--e26-bg);
    }

    .auth {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      padding: var(--e26-safe-top) 0 var(--e26-safe-bottom);
    }

    /* ===== TOPBAR ===== */
    .auth__topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--e26-space-3) var(--e26-space-4);
      border-bottom: 1px solid var(--e26-border);
      background: var(--e26-surface);
      z-index: 2;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: var(--e26-space-3);
    }
    .brand__mark {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: var(--e26-radius-sm);
      background: var(--e26-text);
      color: var(--e26-text-inverse);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -0.04em;
    }
    .brand__text { display: flex; flex-direction: column; line-height: 1.1; }
    .brand__line {
      font-size: var(--e26-fs-xs);
      letter-spacing: var(--e26-tracking-caps);
      color: var(--e26-text);
      font-weight: 700;
    }
    .brand__sub {
      font-size: var(--e26-fs-xs);
      color: var(--e26-text-subtle);
    }
    .auth__edition {
      font-size: var(--e26-fs-xs);
      color: var(--e26-text-subtle);
      letter-spacing: var(--e26-tracking-caps);
    }

    /* ===== SPLIT ===== */
    .auth__split {
      flex: 1;
      display: grid;
      grid-template-rows: auto 1fr;
    }

    /* ===== HERO ===== */
    .hero {
      position: relative;
      overflow: hidden;
      background: var(--e26-surface);
      border-bottom: 1px solid var(--e26-border);
      padding: var(--e26-space-6) var(--e26-space-5) var(--e26-space-7);
    }
    .hero__grid {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(4, 1fr);
      opacity: .45;
      pointer-events: none;
    }
    .hero__grid > span {
      border-right: 1px solid var(--e26-border);
      border-bottom: 1px solid var(--e26-border);
    }
    .hero__grid > span:nth-child(4n) { border-right: 0; }
    .hero__grid > span:nth-last-child(-n+4) { border-bottom: 0; }

    .hero__content {
      position: relative;
      max-width: 560px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-4);
      z-index: 1;
    }
    .hero__eyebrow { color: var(--e26-info); }

    .hero__title {
      font-size: clamp(2.5rem, 8vw, 4.25rem);
      color: var(--e26-text);
      margin: 0;
    }
    .hero__title span { display: block; }
    .hero__title-accent {
      color: var(--e26-text-muted);
      font-style: italic;
      font-weight: 500;
    }

    .hero__lede {
      font-size: var(--e26-fs-lg);
      color: var(--e26-text-muted);
      margin: 0;
      max-width: 44ch;
    }

    /* Stat strip */
    .hero__stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--e26-space-3);
      margin: var(--e26-space-3) 0 0;
      padding: var(--e26-space-4) 0;
      border-top: 1px solid var(--e26-border);
      border-bottom: 1px solid var(--e26-border);
    }
    .stat { display: flex; flex-direction: column; gap: 2px; }
    .stat dt { margin: 0; }
    .stat__num {
      font-size: clamp(1.75rem, 5vw, 2.5rem);
      color: var(--e26-text);
      margin: 0;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.03em;
    }

    /* ===== STACK DE CROMOS ===== */
    .stack {
      position: absolute;
      right: -3vw;
      bottom: -2vw;
      width: 280px;
      height: 280px;
      pointer-events: none;
      z-index: 0;
    }
    .card {
      position: absolute;
      width: 150px;
      height: 200px;
      background: var(--e26-surface);
      border: 1px solid var(--e26-border-strong);
      border-radius: var(--e26-radius-md);
      box-shadow: var(--e26-shadow-md);
      padding: var(--e26-space-3);
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: var(--e26-space-2);
      overflow: hidden;
    }
    .card__head {
      display: flex;
      justify-content: space-between;
      font-size: var(--e26-fs-xs);
      color: var(--e26-text-subtle);
    }
    .card__num { color: var(--e26-text); }
    .card__plate {
      background: var(--e26-surface-2);
      border-radius: var(--e26-radius-sm);
      position: relative;
      display: grid;
      place-items: center;
    }
    .card__plate--dupe {
      background: var(--e26-accent-soft);
      border: 1px dashed var(--e26-accent);
    }
    .card__plate--owned {
      background: var(--e26-primary-soft);
      border: 1px solid var(--e26-primary);
    }
    .card__check {
      font-size: 36px;
      color: var(--e26-primary);
      font-weight: 700;
    }
    .card__foot {
      font-size: 9px;
      letter-spacing: var(--e26-tracking-caps);
      color: var(--e26-text-subtle);
      text-align: center;
    }
    .card__shine {
      position: absolute;
      inset: 0;
      background: linear-gradient(115deg,
        transparent 30%,
        rgba(255, 255, 255, .6) 45%,
        transparent 60%);
      transform: translateX(-100%);
      animation: shine 4.2s cubic-bezier(.4, 0, .2, 1) infinite;
      pointer-events: none;
    }
    .card--back {
      top: 10px;
      right: 130px;
      transform: rotate(-9deg);
      opacity: .65;
    }
    .card--mid {
      top: 32px;
      right: 70px;
      transform: rotate(-3deg);
      z-index: 1;
    }
    .card--front {
      top: 55px;
      right: 5px;
      transform: rotate(5deg);
      z-index: 2;
    }
    .card--front .card__shine { animation-delay: 0s; }
    .card--mid .card__shine { animation-delay: 1.4s; }
    .card--back .card__shine { animation-delay: 2.8s; }

    @keyframes shine {
      0%   { transform: translateX(-100%); }
      50%  { transform: translateX(100%); }
      100% { transform: translateX(100%); }
    }

    .hero__mark {
      position: absolute;
      right: -3vw;
      bottom: -4vw;
      font-size: clamp(10rem, 32vw, 18rem);
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.06em;
      color: var(--e26-surface-2);
      pointer-events: none;
      user-select: none;
      z-index: 0;
    }

    /* ===== ACTION ===== */
    .action {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--e26-space-6) var(--e26-space-4) var(--e26-space-7);
      background: var(--e26-bg);
    }
    .action__inner {
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-5);
    }
    .action__head { display: flex; flex-direction: column; gap: var(--e26-space-2); }
    .action__title {
      font-size: clamp(1.75rem, 5vw, 2.25rem);
      color: var(--e26-text);
      margin: 0;
    }
    .action__sub {
      margin: 0;
      color: var(--e26-text-muted);
      font-size: var(--e26-fs-md);
      max-width: 38ch;
    }

    /* Google button */
    .btn-google {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--e26-space-3);
      padding: var(--e26-space-4) var(--e26-space-5);
      min-height: 64px;
      background: var(--e26-text);
      color: var(--e26-text-inverse);
      border: 1px solid var(--e26-text);
      border-radius: var(--e26-radius-md);
      font-family: var(--e26-font-body);
      cursor: pointer;
      text-align: left;
      box-shadow: var(--e26-shadow-md);
      transition:
        transform var(--e26-dur-fast) var(--e26-ease-out),
        box-shadow var(--e26-dur-fast) var(--e26-ease-out),
        background var(--e26-dur-fast) var(--e26-ease-out);
    }
    .btn-google:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: var(--e26-shadow-lg);
    }
    .btn-google:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow: var(--e26-shadow-sm);
    }
    .btn-google:disabled {
      opacity: .55;
      cursor: not-allowed;
    }
    .btn-google__icon {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      background: var(--e26-surface);
      border-radius: var(--e26-radius-sm);
    }
    .btn-google__label { display: flex; flex-direction: column; gap: 2px; }
    .btn-google__title {
      font-weight: 600;
      font-size: var(--e26-fs-md);
    }
    .btn-google__hint {
      font-family: var(--e26-font-mono);
      font-size: 10px;
      letter-spacing: var(--e26-tracking-caps);
      text-transform: uppercase;
      opacity: .65;
    }
    .btn-google__arrow {
      font-size: 20px;
      transition: transform var(--e26-dur-base) var(--e26-ease-out);
    }
    .btn-google:hover:not(:disabled) .btn-google__arrow {
      transform: translateX(4px);
    }

    .action__error {
      color: var(--e26-danger);
      font-size: var(--e26-fs-sm);
      margin: 0;
      padding: var(--e26-space-3) var(--e26-space-4);
      background: color-mix(in srgb, var(--e26-danger) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--e26-danger) 30%, transparent);
      border-radius: var(--e26-radius-sm);
      line-height: var(--e26-lh-snug);
    }

    .action__foot {
      display: flex;
      align-items: center;
      gap: var(--e26-space-2);
      font-size: var(--e26-fs-xs);
      color: var(--e26-text-subtle);
      flex-wrap: wrap;
    }
    .action__foot .dot { opacity: .5; }

    /* ===== Responsive: tablet+ ===== */
    @media (min-width: 768px) {
      .auth__split {
        grid-template-rows: 1fr;
        grid-template-columns: 1.2fr 1fr;
      }
      .hero {
        border-bottom: 0;
        border-right: 1px solid var(--e26-border);
        padding: var(--e26-space-7) var(--e26-space-6);
        display: flex;
        align-items: center;
      }
      .hero__content { margin: 0; }
      .stack {
        width: 360px;
        height: 360px;
        right: -2vw;
        bottom: 4vw;
      }
      .card { width: 170px; height: 230px; }
      .action { padding: var(--e26-space-6); }
    }
    @media (min-width: 1024px) {
      .hero { padding: var(--e26-space-8) var(--e26-space-7); }
      .action { padding: var(--e26-space-7); }
      .stack {
        width: 420px;
        height: 420px;
        right: 2vw;
      }
      .card { width: 190px; height: 260px; }
      .card--back  { right: 160px; }
      .card--mid   { right: 80px; }
      .card--front { right: 0; }
    }

    /* Landscape bajito (teléfono horizontal): comprime */
    @media (max-height: 560px) and (orientation: landscape) {
      .hero {
        padding: var(--e26-space-4) var(--e26-space-5);
      }
      .hero__title {
        font-size: clamp(1.75rem, 5vw, 2.5rem);
      }
      .hero__lede { display: none; }
      .hero__stats { padding: var(--e26-space-2) 0; }
      .stat__num { font-size: 1.5rem; }
      .hero__mark { display: none; }
      .stack { display: none; }
      .action { padding: var(--e26-space-4) var(--e26-space-5); }
      .btn-google { min-height: 56px; }
    }

    /* Entrada del hero */
    .hero__content > * {
      animation: rise var(--e26-dur-slow) var(--e26-ease-out) both;
    }
    .hero__content > *:nth-child(1) { animation-delay: 40ms; }
    .hero__content > *:nth-child(2) { animation-delay: 90ms; }
    .hero__content > *:nth-child(3) { animation-delay: 140ms; }
    .hero__content > *:nth-child(4) { animation-delay: 190ms; }

    .stack .card {
      animation: cardIn var(--e26-dur-reveal) var(--e26-ease-spring) both;
    }
    .card--back  { animation-delay: 220ms; }
    .card--mid   { animation-delay: 290ms; }
    .card--front { animation-delay: 360ms; }

    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: none; }
    }
    @keyframes cardIn {
      from {
        opacity: 0;
        transform: translateY(20px) rotate(0deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hero__content > *,
      .stack .card { animation: none; }
      .card__shine { animation: none; opacity: 0; }
    }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  busy = signal(false);
  error = signal<string | null>(null);

  async loginGoogle() {
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.auth.loginWithGoogle();
      this.router.navigate(['/album']);
    } catch (e: unknown) {
      if (e instanceof UnauthorizedEmailError) {
        this.error.set(
          `La cuenta ${e.email} no está autorizada. Pídele acceso al admin.`
        );
      } else {
        this.error.set('No se pudo iniciar sesión. Intenta de nuevo.');
        console.error(e);
      }
    } finally {
      this.busy.set(false);
    }
  }
}
