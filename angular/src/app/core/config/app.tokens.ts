import { InjectionToken } from '@angular/core';

/**
 * Id del documento en `albums/{albumId}` que la app va a leer.
 * Se provee desde `environment.albumId`. Cambiarlo en `.env` mediante
 * `NG_APP_ALBUM_ID` permite tener varios álbumes coexistiendo en Firestore.
 */
export const CURRENT_ALBUM_ID = new InjectionToken<string>('CURRENT_ALBUM_ID');

/**
 * Lista de emails autorizados a entrar a la app (whitelist en cliente).
 * Si está vacía, la app no aplica filtro y deja entrar a cualquier
 * cuenta de Google. Se provee desde `environment.allowedEmails` que se
 * popula desde `.env` (`NG_APP_ALLOWED_EMAILS`). La fuente de verdad de
 * seguridad sigue siendo `firestore.rules` — esto es UX.
 */
export const ALLOWED_EMAILS = new InjectionToken<ReadonlyArray<string>>(
  'ALLOWED_EMAILS'
);
