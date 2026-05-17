import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService, UnauthorizedEmailError } from '../../core/services/auth.service';

function setup(authMock: Partial<AuthService>) {
  const navigate = jest.fn();
  TestBed.configureTestingModule({
    imports: [LoginComponent],
    providers: [
      { provide: AuthService, useValue: authMock },
      { provide: Router, useValue: { navigate } },
    ],
  });
  const fixture = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, navigate };
}

describe('LoginComponent', () => {
  describe('loginGoogle (success)', () => {
    it('navega a /album si el login resuelve', async () => {
      const { component, navigate } = setup({
        loginWithGoogle: jest.fn().mockResolvedValue(undefined),
      });
      await component.loginGoogle();
      expect(navigate).toHaveBeenCalledWith(['/album']);
      expect(component.error()).toBeNull();
      expect(component.busy()).toBe(false);
    });

    it('marca busy durante la operación', async () => {
      let resolveLogin!: () => void;
      const loginWithGoogle = jest.fn(
        () => new Promise<void>((res) => { resolveLogin = res; })
      );
      const { component } = setup({ loginWithGoogle });
      const promise = component.loginGoogle();
      expect(component.busy()).toBe(true);
      resolveLogin();
      await promise;
      expect(component.busy()).toBe(false);
    });
  });

  describe('loginGoogle (errores)', () => {
    it('UnauthorizedEmailError → muestra mensaje con el email', async () => {
      const { component, navigate } = setup({
        loginWithGoogle: jest.fn().mockRejectedValue(
          new UnauthorizedEmailError('intruder@example.com')
        ),
      });
      await component.loginGoogle();
      expect(navigate).not.toHaveBeenCalled();
      expect(component.error()).toContain('intruder@example.com');
      expect(component.error()).toContain('autorizada');
    });

    it('error genérico → mensaje genérico', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const { component, navigate } = setup({
        loginWithGoogle: jest.fn().mockRejectedValue(new Error('network down')),
      });
      await component.loginGoogle();
      expect(navigate).not.toHaveBeenCalled();
      expect(component.error()).toBe(
        'No se pudo iniciar sesión. Intenta de nuevo.'
      );
    });

    it('libera busy al finalizar incluso si hubo error', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const { component } = setup({
        loginWithGoogle: jest.fn().mockRejectedValue(new Error('boom')),
      });
      await component.loginGoogle();
      expect(component.busy()).toBe(false);
    });
  });
});
