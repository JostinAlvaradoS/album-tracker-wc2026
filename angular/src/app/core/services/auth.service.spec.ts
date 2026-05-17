import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import * as fireAuth from '@angular/fire/auth';
import { AuthService, UnauthorizedEmailError } from './auth.service';
import { ALLOWED_EMAILS } from '../config/app.tokens';
import { AlbumCatalogService } from './album-catalog.service';

jest.mock('@angular/fire/auth', () => {
  const actual = jest.requireActual('@angular/fire/auth');
  return {
    ...actual,
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    user: jest.fn(() => ({ subscribe: () => ({ unsubscribe: () => undefined }) })),
  };
});

const signInWithPopupMock = fireAuth.signInWithPopup as jest.Mock;
const signOutMock = fireAuth.signOut as jest.Mock;

function makeService(allowedEmails: string[]): AuthService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      AuthService,
      { provide: Auth, useValue: { currentUser: null } },
      { provide: ALLOWED_EMAILS, useValue: allowedEmails },
      { provide: AlbumCatalogService, useValue: { reset: jest.fn() } },
    ],
  });
  return TestBed.inject(AuthService);
}

describe('AuthService', () => {
  beforeEach(() => {
    signInWithPopupMock.mockReset();
    signOutMock.mockReset();
  });

  describe('isOpenAccess', () => {
    it('es true cuando la whitelist está vacía', () => {
      const service = makeService([]);
      expect(service.isOpenAccess).toBe(true);
    });

    it('es false cuando hay emails configurados', () => {
      const service = makeService(['user@example.com']);
      expect(service.isOpenAccess).toBe(false);
    });
  });

  describe('loginWithGoogle', () => {
    it('en modo abierto deja entrar a cualquier email', async () => {
      const service = makeService([]);
      signInWithPopupMock.mockResolvedValue({
        user: { email: 'random@gmail.com' },
      });
      await expect(service.loginWithGoogle()).resolves.toBeUndefined();
      expect(signOutMock).not.toHaveBeenCalled();
    });

    it('con whitelist deja entrar a un email autorizado', async () => {
      const service = makeService(['ok@example.com']);
      signInWithPopupMock.mockResolvedValue({
        user: { email: 'ok@example.com' },
      });
      await expect(service.loginWithGoogle()).resolves.toBeUndefined();
      expect(signOutMock).not.toHaveBeenCalled();
    });

    it('rechaza email no autorizado, hace signOut y lanza UnauthorizedEmailError', async () => {
      const service = makeService(['ok@example.com']);
      signInWithPopupMock.mockResolvedValue({
        user: { email: 'intruder@example.com' },
      });
      signOutMock.mockResolvedValue(undefined);

      await expect(service.loginWithGoogle()).rejects.toBeInstanceOf(
        UnauthorizedEmailError
      );
      expect(signOutMock).toHaveBeenCalledTimes(1);
    });

    it('compara emails en minúsculas (case-insensitive)', async () => {
      const service = makeService(['ok@example.com']);
      signInWithPopupMock.mockResolvedValue({
        user: { email: 'OK@example.com' },
      });
      await expect(service.loginWithGoogle()).resolves.toBeUndefined();
      expect(signOutMock).not.toHaveBeenCalled();
    });

    it('rechaza cuando el usuario no tiene email', async () => {
      const service = makeService(['ok@example.com']);
      signInWithPopupMock.mockResolvedValue({ user: { email: null } });
      signOutMock.mockResolvedValue(undefined);
      await expect(service.loginWithGoogle()).rejects.toBeInstanceOf(
        UnauthorizedEmailError
      );
    });
  });
});
