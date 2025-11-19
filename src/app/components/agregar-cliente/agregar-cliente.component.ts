import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';
import { AuthService } from '../../services/auth.service';
import { Cliente } from '../../models/cliente';

@Component({
  selector: 'app-agregar-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agregar-cliente.component.html',
  styleUrl: './agregar-cliente.component.css'
})
export class AgregarClienteComponent implements OnInit {
  @Input() clienteEditar: Cliente | null = null;
  @Output() clienteGuardado = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  formulario!: FormGroup;
  edadCalculada: number | null = null;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private authService: AuthService
  ) {}

  get esAdmin(): boolean {
    return this.authService?.isAdmin() || false;
  }

  ngOnInit(): void {
    this.inicializarFormulario();
    
    if (this.clienteEditar) {
      this.cargarDatosCliente();
    }

    // Observar cambios en la fecha de nacimiento
    this.formulario.get('fechaNacimiento')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        this.calcularEdad(new Date(fecha));
      }
    });
  }

  inicializarFormulario(): void {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
      apellidoMaterno: [''],
      fechaNacimiento: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      empresa: [''],
      descripcion: ['', Validators.maxLength(500)],
      registradoPor: ['']
    });
  }

  cargarDatosCliente(): void {
    if (this.clienteEditar) {
      const fechaNacimiento = new Date(this.clienteEditar.fechaNacimiento);
      const anio = fechaNacimiento.getUTCFullYear();
      const mes = String(fechaNacimiento.getUTCMonth() + 1).padStart(2, '0');
      const dia = String(fechaNacimiento.getUTCDate()).padStart(2, '0');
      const fechaFormateada = `${anio}-${mes}-${dia}`;
      
      this.formulario.patchValue({
        nombre: this.clienteEditar.nombre,
        apellidoPaterno: this.clienteEditar.apellidoPaterno,
        apellidoMaterno: this.clienteEditar.apellidoMaterno || '',
        fechaNacimiento: fechaFormateada,
        telefono: this.clienteEditar.telefono || '',
        empresa: this.clienteEditar.empresa || '',
        descripcion: this.clienteEditar.descripcion || ''
      });

      this.calcularEdad(fechaNacimiento);
    }
  }

  calcularEdad(fecha: Date): void {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }
    
    this.edadCalculada = edad;
  }

  formatearTelefonoInput(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    
    // Limitar a 10 dígitos
    if (valor.length > 10) {
      valor = valor.substring(0, 10);
    }
    
    this.formulario.patchValue({ telefono: valor }, { emitEvent: false });
  }

  async guardar(): Promise<void> {
    if (this.formulario.valid) {
      this.guardando = true;

      const fechaInput = this.formulario.value.fechaNacimiento;
      const [anio, mes, dia] = fechaInput.split('-').map(Number);
      const fechaNacimiento = new Date(Date.UTC(anio, mes - 1, dia));

      const datosCliente = {
        nombre: this.formulario.value.nombre.trim(),
        apellidoPaterno: this.formulario.value.apellidoPaterno.trim(),
        apellidoMaterno: this.formulario.value.apellidoMaterno?.trim() || '',
        fechaNacimiento: fechaNacimiento,
        telefono: this.formulario.value.telefono?.trim() || undefined,
        empresa: this.formulario.value.empresa?.trim() || undefined,
        descripcion: this.formulario.value.descripcion?.trim() || undefined,
        registradoPorSeleccion: this.formulario.value.registradoPor || undefined
      };

      try {
        if (this.clienteEditar) {
          await this.clienteService.actualizarCliente(this.clienteEditar.id, datosCliente);
        } else {
          await this.clienteService.agregarCliente(datosCliente as any);
        }

        this.guardando = false;
        this.clienteGuardado.emit();
        this.formulario.reset();
        this.edadCalculada = null;
      } catch (error: any) {
        this.guardando = false;
        alert(error.message || 'Error al guardar el cliente');
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.formulario.controls).forEach(key => {
        this.formulario.get(key)?.markAsTouched();
      });
    }
  }

  cancelarFormulario(): void {
    this.cancelar.emit();
    this.formulario.reset();
    this.edadCalculada = null;
  }
}