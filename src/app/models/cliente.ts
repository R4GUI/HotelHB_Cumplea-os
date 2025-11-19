export interface Cliente {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: Date;
  telefono?: string;
  empresa?: string; // ⬅️ NUEVO CAMPO
  descripcion?: string;
  creadoPor: string;
  rol: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DiaCalendario {
  dia: number;
  mes: number;
  anio: number;
  esHoy: boolean;
  esMesActual: boolean;
  tieneCumpleanos: boolean;
  cumpleanos: CumpleanosDelDia[];
}

export interface CumpleanosDelDia {
  cliente: Cliente;
  edad: number;
  mensaje: string;
}

export interface Estadisticas {
  totalClientes: number;
  clientesPorMes: { [key: number]: number };
  clientesPorRol: { [key: string]: number };
}