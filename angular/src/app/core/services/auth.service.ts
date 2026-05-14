import { inject, Injectable } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  signOut,
  user,
  User,
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

/**
 * Maneja la sesión del usuario. La app soporta dos modos:
 *  - Google: la colección se conserva entre dispositivos.
 *  - Anónimo: rápido para probar, atado a ese navegador.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  /** Stream del usuario actual (null si no hay sesión). */
  readonly user$: Observable<User | null> = user(this.auth);

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  async loginWithGoogle(): Promise<void> {
    await signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  async loginAnonymously(): Promise<void> {
    await signInAnonymously(this.auth);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
