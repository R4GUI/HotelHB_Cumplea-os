import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface Usuario {
  username: string;
  password: string;
  rol: string;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioActual: Usuario | null = null;

  private usuarios: Usuario[] = [
    { username: 'admin', password: 'hotelhb', rol: 'admin', nombre: 'Administrador' },
    { username: 'karina', password: 'hotelhb', rol: 'karina', nombre: 'Karina' },
    { username: 'elisa', password: 'hotelhb', rol: 'elisa', nombre: 'Elisa' },
    { username: 'cesia', password: 'hotelhb', rol: 'cesia', nombre: 'Cesia' },
    { username: 'restaurante', password: 'hotelhb', rol: 'restaurante', nombre: 'Restaurante' },
    { username: 'recepcion', password: 'hotelhb', rol: 'recepcion', nombre: 'Recepción' }
  ];

  constructor(private router: Router) {
    this.cargarSesion();
  }

  private cargarSesion(): void {
    const sesionGuardada = localStorage.getItem('usuario');
    if (sesionGuardada) {
      this.usuarioActual = JSON.parse(sesionGuardada);
    }
  }

  login(username: string, password: string): boolean {
    const usuario = this.usuarios.find(
      u => u.username === username && u.password === password
    );

    if (usuario) {
      this.usuarioActual = usuario;
      localStorage.setItem('usuario', JSON.stringify(usuario));
      return true;
    }

    return false;
  }

  logout(): void {
    this.usuarioActual = null;
    localStorage.removeItem('usuario');
  }

  isAuthenticated(): boolean {
    return this.usuarioActual !== null;
  }

  getCurrentUser(): Usuario | null {
    return this.usuarioActual;
  }

  isAdmin(): boolean {
    return this.usuarioActual?.rol === 'admin';
  }

  getNombreUsuario(): string {
    return this.usuarioActual?.nombre || 'Usuario';
  }

  getRolActual(): string {
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'karina': 'Karina',
      'elisa': 'Elisa',
      'cesia': 'Cesia',
      'restaurante': 'Restaurante',
      'recepcion': 'Recepción'
    };
    return roles[this.usuarioActual?.rol || ''] || 'Usuario';
  }
}