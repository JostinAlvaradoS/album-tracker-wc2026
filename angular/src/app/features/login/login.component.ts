import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login">
      <div class="card">
        <h1>Mis cromos</h1>
        <p class="sub">Panini · FIFA World Cup 2026</p>

        <button
          class="btn btn--google"
          (click)="loginGoogle()"
          [disabled]="busy()"
        >
          Entrar con Google
        </button>

        <button
          class="btn btn--anon"
          (click)="loginAnon()"
          [disabled]="busy()"
        >
          Entrar sin cuenta (este dispositivo)
        </button>

        <p class="error" *ngIf="error()">{{ error() }}</p>

        <p class="hint">
          Con Google tu colección se conserva en cualquier dispositivo.
          Sin cuenta, queda atada a este navegador.
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .login {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }
      .card {
        background: #fff;
        border-radius: 12px;
        padding: 2rem;
        max-width: 360px;
        width: 100%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        text-align: center;
      }
      h1 {
        margin: 0;
      }
      .sub {
        color: var(--gray);
        margin: 0.25rem 0 1.5rem;
      }
      .btn {
        display: block;
        width: 100%;
        padding: 0.75rem;
        margin-bottom: 0.6rem;
        border-radius: 8px;
        border: 1px solid var(--border);
        cursor: pointer;
        font-size: 0.95rem;
      }
      .btn--google {
        background: var(--green);
        color: #fff;
        border-color: var(--green);
      }
      .btn--anon {
        background: #fff;
      }
      .btn:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .error {
        color: #c62828;
        font-size: 0.85rem;
      }
      .hint {
        color: var(--gray);
        font-size: 0.8rem;
        margin-top: 1rem;
      }
    `,
  ],
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
