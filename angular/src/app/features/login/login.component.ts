import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf],
  template: `
    <main class="login">
      <!-- Lado IZQUIERDO / superior: hero editorial -->
      <section class="hero" aria-hidden="false">
        <div class="hero__grid" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>

        <div class="hero__inner">
          <span class="e26-eyebrow hero__eyebrow">Línea 26 · Tracker de cromos</span>

          <h1 class="hero__title e26-display">
            <span>Tu álbum,</span>
            <span class="hero__title-accent">en su sitio.</span>
          </h1>

          <p class="hero__lede">
            Llevá la cuenta de lo pegado, lo que falta y lo repetido.
            Sin ruido, con números limpios y figuritas legibles de un vistazo.
          </p>

          <ul class="hero__bullets">
            <li>
              <span class="bullet bullet--owned" aria-hidden="true">✓</span>
              <span>1.042 cromos del Mundial 2026 al alcance de un toque.</span>
            </li>
            <li>
              <span class="bullet bullet--dupe" aria-hidden="true">×</span>
              <span>Repes contabilizadas para tus intercambios.</span>
            </li>
            <li>
              <span class="bullet bullet--info" aria-hidden="true">%</span>
              <span>Progreso por equipo, con stats que no decoran.</span>
            </li>
          </ul>
        </div>

        <span class="hero__mark e26-display" aria-hidden="true">26</span>
      </section>

      <!-- Lado DERECHO / inferior: acción -->
      <section class="action">
        <div class="action__inner">
          <div class="action__head">
            <span class="e26-eyebrow">Empezar</span>
            <h2 class="e26-display action__title">Entrá a tu colección</h2>
          </div>

          <div class="action__buttons">
            <button
              type="button"
              class="btn btn--primary"
              (click)="loginGoogle()"
              [disabled]="busy()">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#fff" d="M21.6 12.227c0-.7-.063-1.373-.18-2.018H12v3.818h5.385a4.6 4.6 0 0 1-1.996 3.018v2.5h3.227c1.89-1.74 2.984-4.305 2.984-7.318Z"/>
                <path fill="#fff" opacity=".85" d="M12 22c2.7 0 4.964-.895 6.618-2.418l-3.227-2.5c-.895.6-2.04.954-3.391.954-2.605 0-4.81-1.76-5.6-4.125H3.077v2.59A9.998 9.998 0 0 0 12 22Z"/>
                <path fill="#fff" opacity=".7" d="M6.4 13.91A6.014 6.014 0 0 1 6.082 12c0-.66.114-1.3.318-1.91V7.5H3.077A9.998 9.998 0 0 0 2 12c0 1.614.386 3.14 1.077 4.5l3.323-2.59Z"/>
                <path fill="#fff" opacity=".55" d="M12 5.977c1.468 0 2.786.504 3.823 1.495l2.866-2.866C16.96 3 14.695 2 12 2A9.998 9.998 0 0 0 3.077 7.5l3.323 2.59C7.19 7.737 9.395 5.977 12 5.977Z"/>
              </svg>
              <span>Entrar con Google</span>
              <span class="btn__tag">sync entre dispositivos</span>
            </button>

            <div class="sep">
              <span>o</span>
            </div>

            <button
              type="button"
              class="btn btn--ghost"
              (click)="loginAnon()"
              [disabled]="busy()">
              <span>Entrar como invitado</span>
              <span class="btn__tag">solo este navegador</span>
            </button>
          </div>

          <p class="error" *ngIf="error()">{{ error() }}</p>

          <p class="footer-hint">
            Identidad <span class="e26-code">LINEA-26</span> · sin marcas oficiales.
          </p>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100dvh;
      background: var(--e26-bg);
    }

    .login {
      min-height: 100dvh;
      display: grid;
      grid-template-rows: auto 1fr;
      padding: var(--e26-safe-top) 0 var(--e26-safe-bottom);
    }

    /* ===== HERO ===== */
    .hero {
      position: relative;
      overflow: hidden;
      background: var(--e26-surface);
      border-bottom: 1px solid var(--e26-border);
      padding: var(--e26-space-7) var(--e26-space-5) var(--e26-space-6);
    }
    .hero__grid {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(4, 1fr);
      opacity: .55;
      pointer-events: none;
    }
    .hero__grid > span {
      border-right: 1px solid var(--e26-border);
      border-bottom: 1px solid var(--e26-border);
    }
    .hero__grid > span:nth-child(4n) { border-right: 0; }
    .hero__grid > span:nth-last-child(-n+4) { border-bottom: 0; }

    .hero__inner {
      position: relative;
      max-width: 560px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-4);
    }
    .hero__eyebrow { color: var(--e26-info); }
    .hero__title {
      font-size: clamp(2.25rem, 7vw, 3.75rem);
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

    .hero__bullets {
      list-style: none;
      padding: 0;
      margin: var(--e26-space-3) 0 0;
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-3);
    }
    .hero__bullets li {
      display: grid;
      grid-template-columns: 24px 1fr;
      align-items: center;
      gap: var(--e26-space-3);
      color: var(--e26-text);
      font-size: var(--e26-fs-md);
    }
    .bullet {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: var(--e26-radius-sm);
      font-family: var(--e26-font-mono);
      font-size: 12px;
      font-weight: 700;
    }
    .bullet--owned { background: var(--e26-primary-soft); color: var(--e26-primary); }
    .bullet--dupe  { background: var(--e26-accent-soft);  color: var(--e26-accent); }
    .bullet--info  { background: var(--e26-info-soft);    color: var(--e26-info); }

    .hero__mark {
      position: absolute;
      right: -2vw;
      bottom: -3vw;
      font-size: clamp(8rem, 28vw, 16rem);
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
    }
    .action__inner {
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-5);
    }
    .action__head { display: flex; flex-direction: column; gap: var(--e26-space-1); }
    .action__title {
      font-size: var(--e26-fs-2xl);
      color: var(--e26-text);
      margin: 0;
    }

    .action__buttons {
      display: flex;
      flex-direction: column;
      gap: var(--e26-space-3);
    }

    .btn {
      position: relative;
      display: grid;
      grid-template-columns: 18px 1fr auto;
      align-items: center;
      gap: var(--e26-space-3);
      padding: var(--e26-space-4) var(--e26-space-5);
      min-height: 56px;
      border-radius: var(--e26-radius-md);
      font-family: var(--e26-font-body);
      font-size: var(--e26-fs-md);
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: background var(--e26-dur-fast) var(--e26-ease-out),
                  transform var(--e26-dur-fast) var(--e26-ease-out),
                  border-color var(--e26-dur-fast) var(--e26-ease-out);
      text-align: left;
    }
    .btn:active:not(:disabled) { transform: translateY(1px); }
    .btn:disabled { opacity: .55; cursor: not-allowed; }

    .btn--primary {
      background: var(--e26-text);
      color: var(--e26-text-inverse);
      border-color: var(--e26-text);
    }
    .btn--primary:hover:not(:disabled) {
      background: var(--e26-primary);
      border-color: var(--e26-primary);
    }

    .btn--ghost {
      background: var(--e26-surface);
      color: var(--e26-text);
      border-color: var(--e26-border);
      grid-template-columns: 1fr auto;
    }
    .btn--ghost:hover:not(:disabled) {
      border-color: var(--e26-border-strong);
      background: var(--e26-surface-2);
    }

    .btn__tag {
      font-family: var(--e26-font-mono);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: .65;
      white-space: nowrap;
    }

    .sep {
      display: flex;
      align-items: center;
      gap: var(--e26-space-3);
      color: var(--e26-text-subtle);
      font-size: var(--e26-fs-xs);
      letter-spacing: var(--e26-tracking-caps);
      text-transform: uppercase;
    }
    .sep::before, .sep::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--e26-border);
    }

    .error {
      color: var(--e26-danger);
      font-size: var(--e26-fs-sm);
      margin: 0;
      padding: var(--e26-space-3);
      background: color-mix(in srgb, var(--e26-danger) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--e26-danger) 30%, transparent);
      border-radius: var(--e26-radius-sm);
    }

    .footer-hint {
      font-size: var(--e26-fs-xs);
      color: var(--e26-text-subtle);
      margin: 0;
      text-align: center;
    }
    .footer-hint .e26-code { color: var(--e26-text-muted); }

    /* ===== TABLET / LANDSCAPE: split de dos columnas ===== */
    @media (min-width: 768px) {
      .login {
        grid-template-rows: 1fr;
        grid-template-columns: 1.15fr 1fr;
        padding-top: 0;
        padding-bottom: 0;
        padding-left: env(safe-area-inset-left, 0px);
        padding-right: env(safe-area-inset-right, 0px);
      }
      .hero {
        border-bottom: 0;
        border-right: 1px solid var(--e26-border);
        padding: var(--e26-space-6) var(--e26-space-6);
        display: flex;
        align-items: center;
        overflow: hidden;
      }
      .hero__inner { margin: 0; }
      .action { padding: var(--e26-space-6); }
    }
    @media (min-width: 1024px) {
      .hero { padding: var(--e26-space-8) var(--e26-space-7); }
      .action { padding: var(--e26-space-7); }
    }

    /* ===== LANDSCAPE BAJITO (teléfono horizontal): comprime hero ===== */
    @media (max-height: 520px) and (orientation: landscape) {
      .hero {
        padding: var(--e26-space-4) var(--e26-space-5);
      }
      .hero__title {
        font-size: clamp(1.75rem, 5vw, 2.5rem);
      }
      .hero__lede { display: none; }
      .hero__bullets { gap: var(--e26-space-2); margin-top: var(--e26-space-2); }
      .hero__bullets li { font-size: var(--e26-fs-sm); }
      .hero__mark {
        font-size: clamp(6rem, 18vw, 10rem);
        bottom: -2vw;
      }
      .action { padding: var(--e26-space-4) var(--e26-space-5); }
      .btn { min-height: 48px; padding: var(--e26-space-3) var(--e26-space-4); }
    }

    /* entrada sutil del hero */
    .hero__inner > * {
      animation: rise var(--e26-dur-slow) var(--e26-ease-out) both;
    }
    .hero__inner > *:nth-child(1) { animation-delay: 40ms; }
    .hero__inner > *:nth-child(2) { animation-delay: 90ms; }
    .hero__inner > *:nth-child(3) { animation-delay: 140ms; }
    .hero__inner > *:nth-child(4) { animation-delay: 190ms; }
    @keyframes rise {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .hero__inner > * { animation: none; }
    }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  busy = signal(false);
  error = signal<string | null>(null);

  async loginGoogle() {
    await this.run(() => this.auth.loginWithGoogle());
  }

  async loginAnon() {
    await this.run(() => this.auth.loginAnonymously());
  }

  private async run(fn: () => Promise<void>) {
    this.busy.set(true);
    this.error.set(null);
    try {
      await fn();
      this.router.navigate(['/album']);
    } catch (e: unknown) {
      this.error.set('No se pudo iniciar sesión. Intenta de nuevo.');
      console.error(e);
    } finally {
      this.busy.set(false);
    }
  }
}
