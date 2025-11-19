import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

interface User {
  username: string;
  rol: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  private readonly STORAGE_KEY = 'currentUser';
  private readonly TIMEOUT_KEY = 'lastActivity';
  private readonly INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos en milisegundos
  private inactivityTimer: any;

  constructor(private router: Router) {
    this.loadUserFromStorage();
    this.startInactivityMonitor();
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem(this.STORAGE_KEY);
    if (userJson) {
      this.currentUser = JSON.parse(userJson);
      this.checkInactivity();
    }
  }

  private startInactivityMonitor(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.resetInactivityTimer();
      }, true);
    });

    this.resetInactivityTimer();
  }

  private resetInactivityTimer(): void {
    if (this.currentUser) {
      localStorage.setItem(this.TIMEOUT_KEY, Date.now().toString());
      
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
      }

      this.inactivityTimer = setTimeout(() => {
        this.autoLogout();
      }, this.INACTIVITY_TIMEOUT);
    }
  }

  private checkInactivity(): void {
    const lastActivity = localStorage.getItem(this.TIMEOUT_KEY);
    
    if (lastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
      
      if (timeSinceLastActivity > this.INACTIVITY_TIMEOUT) {
        console.log('⏰ Sesión expirada por inactividad');
        this.autoLogout();
      } else {
        const timeRemaining = this.INACTIVITY_TIMEOUT - timeSinceLastActivity;
        this.inactivityTimer = setTimeout(() => {
          this.autoLogout();
        }, timeRemaining);
      }
    }
  }

  private autoLogout(): void {
    console.log('🚪 Cerrando sesión por inactividad...');
    this.logout();
    alert('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
  }

  login(username: string, password: string): boolean {
    // ⬇️ ACTUALIZADO: Todas las contraseñas son "hotelhb"
    const users: { [key: string]: { password: string; rol: string } } = {
      'admin': { password: 'hotelhb', rol: 'admin' },
      'karina': { password: 'hotelhb', rol: 'karina' },
      'elisa': { password: 'hotelhb', rol: 'elisa' },
      'cesia': { password: 'hotelhb', rol: 'cesia' },
      'restaurante': { password: 'hotelhb', rol: 'restaurante' },
      'recepcion': { password: 'hotelhb', rol: 'recepcion' }
    };

    const user = users[username.toLowerCase()];
    
    if (user && user.password === password) {
      this.currentUser = {
        username: username.toLowerCase(),
        rol: user.rol
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));
      localStorage.setItem(this.TIMEOUT_KEY, Date.now().toString());
      this.resetInactivityTimer();
      
      console.log('✅ Login exitoso:', this.currentUser);
      return true;
    }
    
    return false;
  }

  logout(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TIMEOUT_KEY);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isAdmin(): boolean {
    return this.currentUser?.rol === 'admin';
  }

  getNombreUsuario(): string {
    if (!this.currentUser) return 'Usuario';

    const nombres: { [key: string]: string } = {
      'admin': 'Gerencia', // ⬇️ CAMBIADO: De "Administrador" a "Gerencia"
      'karina': 'Karina',
      'elisa': 'Elisa',
      'cesia': 'Cesia',
      'restaurante': 'Restaurante',
      'recepcion': 'Recepción'
    };

    return nombres[this.currentUser.username] || this.currentUser.username;
  }

  getRolActual(): string {
    if (!this.currentUser) return '';

    const roles: { [key: string]: string } = {
      'admin': 'Gerencia General', // ⬇️ CAMBIADO: De "Administrador" a "Gerencia General"
      'karina': 'Vendedora',
      'elisa': 'Vendedora',
      'cesia': 'Vendedora',
      'restaurante': 'Área de Restaurante',
      'recepcion': 'Área de Recepción'
    };

    return roles[this.currentUser.username] || this.currentUser.rol;
  }
}