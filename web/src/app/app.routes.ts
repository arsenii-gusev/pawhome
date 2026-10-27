import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/auth.guards';

export const routes: Routes = [
  {
    path: '',
    title: 'PawHome — питомцы ищут дом',
    loadComponent: () => import('./pages/animals.page').then((m) => m.AnimalsPage),
  },
  {
    path: 'animals/:id',
    title: 'PawHome — карточка питомца',
    loadComponent: () => import('./pages/animal-detail.page').then((m) => m.AnimalDetailPage),
  },
  {
    path: 'login',
    title: 'PawHome — вход',
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'my-requests',
    title: 'PawHome — мои заявки',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-requests.page').then((m) => m.MyRequestsPage),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'requests',
        title: 'PawHome — заявки',
        loadComponent: () =>
          import('./pages/admin-requests.page').then((m) => m.AdminRequestsPage),
      },
      {
        path: 'animals/new',
        title: 'PawHome — новый питомец',
        loadComponent: () =>
          import('./pages/admin-animal-form.page').then((m) => m.AdminAnimalFormPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
