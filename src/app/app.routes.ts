import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
  { path: 'auth/login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'subscriptions',
    loadComponent: () => import('./subscriptions/subscription-list/subscription-list.component').then(m => m.SubscriptionListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'subscriptions/new',
    loadComponent: () => import('./subscriptions/subscription-form/subscription-form.component').then(m => m.SubscriptionFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'subscriptions/:id/edit',
    loadComponent: () => import('./subscriptions/subscription-form/subscription-form.component').then(m => m.SubscriptionFormComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'dashboard' },
];
