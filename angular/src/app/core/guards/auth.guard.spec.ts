import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function runGuard() {
  return TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
}

describe('authGuard', () => {
  let routerSpy: { createUrlTree: jest.Mock };

  beforeEach(() => {
    routerSpy = { createUrlTree: jest.fn().mockReturnValue('URL_TREE' as unknown as UrlTree) };
  });

  it('permite el acceso cuando hay usuario autenticado', (done) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { user$: of({ uid: 'abc' }) } },
        { provide: Router, useValue: routerSpy },
      ],
    });
    const result$ = runGuard() as ReturnType<typeof of>;
    result$.subscribe((value) => {
      expect(value).toBe(true);
      expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
      done();
    });
  });

  it('redirige a /login cuando no hay usuario', (done) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { user$: of(null) } },
        { provide: Router, useValue: routerSpy },
      ],
    });
    const result$ = runGuard() as ReturnType<typeof of>;
    result$.subscribe((value) => {
      expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(value).toBe('URL_TREE');
      done();
    });
  });
});
