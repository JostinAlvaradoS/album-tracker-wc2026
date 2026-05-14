import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Bloquea las rutas internas si no hay sesión activa
 * y redirige a /login.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(
    take(1),
    map((user) => {
      if (user) return true;
      return router.createUrlTree(['/login']);
    })
  );
};
