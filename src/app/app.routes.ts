import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { CalendarioComponent } from './components/calendario/calendario.component';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [() => {
      const authService = inject(AuthService);
      const router = inject(Router);
      
      if (authService.isAuthenticated()) {
        router.navigate(['/calendario']);
        return false;
      }
      return true;
    }]
  },
  {
    path: 'calendario',
    component: CalendarioComponent,
    canActivate: [() => {
      const authService = inject(AuthService);
      const router = inject(Router);
      
      if (!authService.isAuthenticated()) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    }]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];