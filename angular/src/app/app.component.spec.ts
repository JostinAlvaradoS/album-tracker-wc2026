import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { ReplaySubject, of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { User } from '@angular/fire/auth';

function setup(opts: {
  user?: Partial<User> | null;
  events?: ReplaySubject<unknown>;
  url?: string;
  logout?: jest.Mock;
}) {
  const events = opts.events ?? new ReplaySubject<unknown>(1);
  const navigate = jest.fn();
  const logout = opts.logout ?? jest.fn().mockResolvedValue(undefined);

  TestBed.configureTestingModule({
    imports: [AppComponent],
    providers: [
      {
        provide: AuthService,
        useValue: {
          user$: of(opts.user ?? null),
          logout,
        },
      },
      {
        provide: Router,
        useValue: {
          events,
          url: opts.url ?? '/home',
          navigate,
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(AppComponent);
  return { fixture, component: fixture.componentInstance, navigate, logout, events };
}

describe('AppComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('pageTitle', () => {
    it('derivado de la URL inicial', () => {
      const { component } = setup({ url: '/album' });
      expect(component.pageTitle()).toBe('Mi álbum');
    });

    it('fallback a "Home" si la URL no matchea ningún path conocido', () => {
      const { component } = setup({ url: '/desconocido' });
      expect(component.pageTitle()).toBe('Home');
    });

    it('reacciona a eventos de NavigationEnd', () => {
      const events = new ReplaySubject<unknown>(1);
      const { component } = setup({ events, url: '/home' });
      events.next(new NavigationEnd(1, '/comparador', '/comparador'));
      expect(component.pageTitle()).toBe('Comparador');
    });
  });

  describe('toggleTheme', () => {
    it('alterna entre light y dark, y persiste en localStorage', () => {
      const { fixture, component } = setup({});
      fixture.detectChanges(); // flush initial effect
      expect(component.theme()).toBe('light');
      component.toggleTheme();
      fixture.detectChanges();
      expect(component.theme()).toBe('dark');
      expect(localStorage.getItem('e26-theme')).toBe('dark');
      component.toggleTheme();
      fixture.detectChanges();
      expect(component.theme()).toBe('light');
    });

    it('lee el tema persistido al inicializar', () => {
      localStorage.setItem('e26-theme', 'dark');
      const { component } = setup({});
      expect(component.theme()).toBe('dark');
    });

    it('ignora valores inválidos en localStorage', () => {
      localStorage.setItem('e26-theme', 'invalid');
      const { component } = setup({});
      expect(component.theme()).toBe('light');
    });
  });

  describe('logout', () => {
    it('cierra sesión y navega a /login', async () => {
      const logout = jest.fn().mockResolvedValue(undefined);
      const { component, navigate } = setup({ logout });
      await component.logout();
      expect(logout).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('userLabel', () => {
    it('devuelve "Invitado" para usuarios anónimos', () => {
      const { component } = setup({});
      expect(
        component.userLabel({ isAnonymous: true })
      ).toBe('Invitado');
    });

    it('prefiere displayName cuando existe', () => {
      const { component } = setup({});
      expect(
        component.userLabel({ isAnonymous: false, displayName: 'Pepe' })
      ).toBe('Pepe');
    });

    it('cae al email si no hay displayName', () => {
      const { component } = setup({});
      expect(
        component.userLabel({ isAnonymous: false, email: 'pepe@x.com' })
      ).toBe('pepe@x.com');
    });

    it('fallback genérico si no hay nada', () => {
      const { component } = setup({});
      expect(component.userLabel({ isAnonymous: false })).toBe('Coleccionista');
    });
  });

  describe('trackRoute', () => {
    it('usa id como identidad', () => {
      const { component } = setup({});
      expect(
        component.trackRoute(0, {
          id: 'album',
          path: '/album',
          label: 'Álbum',
          title: 'Mi álbum',
          icon: 'grid',
        })
      ).toBe('album');
    });
  });
});
