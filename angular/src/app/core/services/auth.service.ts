import { inject, Injectable } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  user,
  User,
} from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { ALLOWED_EMAILS } from '../config/app.tokens';
import { AlbumCatalogService } from './album-catalog.service';

/** Error lanzado cuando la cuenta logueada no está en la whitelist. */
export class UnauthorizedEmailError extends Error {
  readonly code = 'unauthorized-email';
  constructor(public readonly email: string) {
    super(`Email no autorizado: ${email}`);
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private catalog = inject(AlbumCatalogService);
  private allowedEmails = new Set(
    inject(ALLOWED_EMAILS).map((e) => e.toLowerCase())
  );

  readonly user$: Observable<User | null> = user(this.auth);

  /** `true` si no hay whitelist configurada (modo abierto). */
  get isOpenAccess(): boolean {
    return this.allowedEmails.size === 0;
  }

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Inicia sesión con Google. Si hay whitelist configurada y el email no
   * está en ella, cierra sesión inmediatamente y lanza UnauthorizedEmailError.
   */
  async loginWithGoogle(): Promise<void> {
    const cred = await signInWithPopup(this.auth, new GoogleAuthProvider());
    if (this.isOpenAccess) return;

    const email = cred.user.email?.toLowerCase() ?? '';
    if (!this.allowedEmails.has(email)) {
      await signOut(this.auth);
      throw new UnauthorizedEmailError(email);
    }
  }

  async logout(): Promise<void> {
    // Limpia los listeners cacheados ANTES de cerrar sesión: si no, los
    // observables con refCount:false siguen emitiendo con el UID viejo
    // y disparan permission-denied en consola.
    this.catalog.reset();
    await signOut(this.auth);
  }
}
