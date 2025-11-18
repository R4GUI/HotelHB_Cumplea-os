import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Cliente, CumpleanosDelDia, Estadisticas } from '../models/cliente';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private clientesSubject = new BehaviorSubject<Cliente[]>([]);
  public clientes$ = this.clientesSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.cargarClientes();
  }

  private cargarClientes(): void {
    const clientesCollection = collection(this.firestore, 'clientes');
    
    onSnapshot(clientesCollection, {
      next: (snapshot) => {
        const clientes = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            fechaNacimiento: data['fechaNacimiento']?.toDate() || new Date(data['fechaNacimiento']),
            createdAt: data['createdAt']?.toDate() || new Date(data['createdAt']),
            updatedAt: data['updatedAt']?.toDate()
          } as Cliente;
        });
        
        console.log('📥 Clientes cargados desde Firebase:', clientes.length);
        this.clientesSubject.next(clientes);
      },
      error: (error) => {
        console.error('❌ Error cargando clientes:', error);
      }
    });
  }

  async agregarCliente(cliente: any): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.error('❌ Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }

    const existe = this.clienteExisteLocal(
      cliente.nombre,
      cliente.apellidoPaterno,
      cliente.apellidoMaterno
    );

    if (existe) {
      throw new Error('Este cliente ya está registrado');
    }

    const clientesCollection = collection(this.firestore, 'clientes');
    
    let creadoPor = user.username;
    let rolRegistro = user.rol;
    
    if (cliente.registradoPorSeleccion && user.rol === 'admin') {
      creadoPor = cliente.registradoPorSeleccion;
      rolRegistro = cliente.registradoPorSeleccion;
    }
    
    const clienteData: any = {
      nombre: cliente.nombre.trim(),
      apellidoPaterno: cliente.apellidoPaterno.trim(),
      apellidoMaterno: cliente.apellidoMaterno.trim(),
      fechaNacimiento: cliente.fechaNacimiento,
      creadoPor: creadoPor,
      rol: rolRegistro,
      createdAt: new Date()
    };

    if (cliente.telefono && cliente.telefono.trim()) {
      clienteData.telefono = cliente.telefono.trim();
    }
    
    if (cliente.descripcion && cliente.descripcion.trim()) {
      clienteData.descripcion = cliente.descripcion.trim();
    }
    
    console.log('📤 Guardando cliente:', clienteData);
    
    try {
      const docRef = await addDoc(clientesCollection, clienteData);
      console.log('✅ Cliente guardado con ID:', docRef.id);
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      throw error;
    }
  }

  private clienteExisteLocal(nombre: string, apellidoPaterno: string, apellidoMaterno: string): boolean {
    const clientes = this.clientesSubject.value;
    return clientes.some(c => 
      c.nombre.toLowerCase().trim() === nombre.toLowerCase().trim() &&
      c.apellidoPaterno.toLowerCase().trim() === apellidoPaterno.toLowerCase().trim() &&
      c.apellidoMaterno.toLowerCase().trim() === apellidoMaterno.toLowerCase().trim()
    );
  }

  async actualizarCliente(id: string, clienteActualizado: Partial<Cliente>): Promise<void> {
    const clienteDoc = doc(this.firestore, 'clientes', id);
    
    const updateData: any = {
      updatedAt: new Date()
    };

    if (clienteActualizado.nombre !== undefined) {
      updateData.nombre = clienteActualizado.nombre;
    }
    if (clienteActualizado.apellidoPaterno !== undefined) {
      updateData.apellidoPaterno = clienteActualizado.apellidoPaterno;
    }
    if (clienteActualizado.apellidoMaterno !== undefined) {
      updateData.apellidoMaterno = clienteActualizado.apellidoMaterno;
    }
    if (clienteActualizado.fechaNacimiento !== undefined) {
      updateData.fechaNacimiento = clienteActualizado.fechaNacimiento;
    }
    if (clienteActualizado.telefono) {
      updateData.telefono = clienteActualizado.telefono;
    }
    if (clienteActualizado.descripcion) {
      updateData.descripcion = clienteActualizado.descripcion;
    }

    await updateDoc(clienteDoc, updateData);
  }

  async eliminarCliente(id: string): Promise<void> {
    const clienteDoc = doc(this.firestore, 'clientes', id);
    await deleteDoc(clienteDoc);
  }

  getClientesFiltrados(): Cliente[] {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.log('⚠️ No hay usuario autenticado');
      return [];
    }

    const todosLosClientes = this.clientesSubject.value;
    console.log('📊 Total clientes en Firebase:', todosLosClientes.length);
    console.log('👤 Usuario actual:', user.username, '| Rol:', user.rol);

    if (user.rol === 'admin') {
      console.log('✅ Admin ve TODOS:', todosLosClientes.length);
      return todosLosClientes;
    }

    const clientesFiltrados = todosLosClientes.filter(c => {
      const match = c.creadoPor === user.username;
      return match;
    });
    
    console.log('✅ Clientes filtrados para', user.username, ':', clientesFiltrados.length);
    return clientesFiltrados;
  }

  buscarClientes(termino: string): Cliente[] {
    const clientesFiltrados = this.getClientesFiltrados();
    const terminoLower = termino.toLowerCase().trim();

    if (!terminoLower) return clientesFiltrados;

    return clientesFiltrados.filter(cliente =>
      cliente.nombre.toLowerCase().includes(terminoLower) ||
      cliente.apellidoPaterno.toLowerCase().includes(terminoLower) ||
      cliente.apellidoMaterno.toLowerCase().includes(terminoLower) ||
      cliente.telefono?.toLowerCase().includes(terminoLower)
    );
  }

  obtenerCumpleanosPorDia(dia: number, mes: number, anio: number): CumpleanosDelDia[] {
    const clientesFiltrados = this.getClientesFiltrados();
    
    const clientes = clientesFiltrados.filter(cliente => {
      const fecha = new Date(cliente.fechaNacimiento);
      const diaFecha = fecha.getUTCDate();
      const mesFecha = fecha.getUTCMonth();
      
      return diaFecha === dia && mesFecha === mes;
    });

    return clientes.map(cliente => {
      const edad = this.calcularEdad(cliente.fechaNacimiento, anio);
      return {
        cliente,
        edad,
        mensaje: `Hoy cumple años ${cliente.nombre} ${cliente.apellidoPaterno} - ${edad} años`
      };
    });
  }

  calcularEdad(fechaNacimiento: Date, anioActual?: number): number {
    const hoy = new Date();
    const anio = anioActual || hoy.getFullYear();
    const nacimiento = new Date(fechaNacimiento);
    
    let edad = anio - nacimiento.getUTCFullYear();
    
    const mesActual = hoy.getMonth();
    const mesNacimiento = nacimiento.getUTCMonth();
    const diaActual = hoy.getDate();
    const diaNacimiento = nacimiento.getUTCDate();
    
    if (mesActual < mesNacimiento || 
        (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
      edad--;
    }
    
    return edad;
  }

  obtenerEstadisticas(): Estadisticas {
    const clientes = this.authService.isAdmin() 
      ? this.clientesSubject.value 
      : this.getClientesFiltrados();

    const clientesPorMes: { [key: number]: number } = {};
    const clientesPorRol: { [key: string]: number } = {};

    for (let i = 0; i < 12; i++) {
      clientesPorMes[i] = 0;
    }

    clientes.forEach(cliente => {
      const mes = new Date(cliente.fechaNacimiento).getUTCMonth();
      clientesPorMes[mes]++;

      if (this.authService.isAdmin()) {
        const rol = cliente.rol || 'desconocido';
        clientesPorRol[rol] = (clientesPorRol[rol] || 0) + 1;
      }
    });

    return {
      totalClientes: clientes.length,
      clientesPorMes,
      clientesPorRol
    };
  }

  async cargarClientesManual(): Promise<void> {
    const clientesCollection = collection(this.firestore, 'clientes');
    
    try {
      const snapshot = await getDocs(clientesCollection);
      const clientes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          fechaNacimiento: data['fechaNacimiento']?.toDate() || new Date(data['fechaNacimiento']),
          createdAt: data['createdAt']?.toDate() || new Date(data['createdAt']),
          updatedAt: data['updatedAt']?.toDate()
        } as Cliente;
      });
      
      console.log('🔄 Recarga manual - Clientes:', clientes.length);
      this.clientesSubject.next(clientes);
    } catch (error) {
      console.error('❌ Error en recarga manual:', error);
    }
  }
}