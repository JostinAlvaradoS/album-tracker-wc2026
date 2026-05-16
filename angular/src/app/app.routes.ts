import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/stats/stats.component').then(
        (m) => m.StatsComponent
      ),
  },
  {
    path: 'album',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/album-view/album-view.component').then(
        (m) => m.AlbumViewComponent
      ),
  },
  {
    path: 'faltas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/missing-list/missing-list.component').then(
        (m) => m.MissingListComponent
      ),
  },
  {
    path: 'repes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/duplicates/duplicates.component').then(
        (m) => m.DuplicatesComponent
      ),
  },
  {
    path: 'comparador',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/comparator/comparator.component').then(
        (m) => m.ComparatorComponent
      ),
  },
  { path: 'stats', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
