import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  mostrarPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Si ya está autenticado, redirigir al calendario
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/calendario']);
    }
  }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  login(): void {
    this.errorMessage = '';

    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    const success = this.authService.login(this.username, this.password);

    if (success) {
      console.log('✅ Login exitoso');
      this.router.navigate(['/calendario']);
    } else {
      this.errorMessage = 'Usuario o contraseña incorrectos';
      console.log('❌ Login fallido');
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.login();
  }
}