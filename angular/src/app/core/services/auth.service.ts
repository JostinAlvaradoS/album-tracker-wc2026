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

/**
 * Lista blanca de cuentas autorizadas para entrar.
 * Mantener sincronizada con la función isAllowlisted() de firestore.rules.
 */
const ALLOWED_EMAILS: ReadonlySet<string> = new Set([
  'jostinalvaradosarmiento@gmail.com',
]);

/** Error que se lanza si el email no está autorizado. */
export class UnauthorizedEmailError extends Error {
  readonly code = 'unauthorized-email';
  constructor(public readonly email: string) {
    super(`Email no autorizado: ${email}`);
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  readonly user$: Observable<User | null> = user(this.auth);

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Inicia sesión con Google y verifica que el email esté en la whitelist.
   * Si no lo está, cierra sesión inmediatamente y lanza UnauthorizedEmailError.
   */
  async loginWithGoogle(): Promise<void> {
    const cred = await signInWithPopup(this.auth, new GoogleAuthProvider());
    const email = cred.user.email?.toLowerCase() ?? '';
    if (!ALLOWED_EMAILS.has(email)) {
      await signOut(this.auth);
      throw new UnauthorizedEmailError(email);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
