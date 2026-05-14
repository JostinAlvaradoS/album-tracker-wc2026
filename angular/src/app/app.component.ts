import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <ng-container *ngIf="user() as u; else noSession">
      <nav class="nav">
        <a routerLink="/album" routerLinkActive="active">Álbum</a>
        <a routerLink="/faltas" routerLinkActive="active">Faltas</a>
        <a routerLink="/repes" routerLinkActive="active">Repes</a>
        <span class="spacer"></span>
        <span class="who">
          {{ u.isAnonymous ? 'Invitado' : u.displayName || u.email }}
        </span>
        <button class="logout" (click)="logout()">Salir</button>
      </nav>
    </ng-container>

    <ng-template #noSession></ng-template>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      .nav {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.6rem 1rem;
        background: #fff;
        border-bottom: 1px solid var(--border);
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .nav a {
        text-decoration: none;
        color: #555;
        padding: 0.3rem 0.5rem;
        border-radius: 6px;
      }
      .nav a.active {
        background: var(--green-light);
        color: var(--green);
        font-weight: 600;
      }
      .spacer {
        flex: 1;
      }
      .who {
        color: var(--gray);
        font-size: 0.85rem;
      }
      .logout {
        background: none;
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 0.3rem 0.7rem;
        cursor: pointer;
      }
    `,
  ],
})
export class AppComponent {
  private auth = inject(AuthService);

  user = toSignal(this.auth.user$, { initialValue: null });

  logout() {
    this.auth.logout();
  }
}
