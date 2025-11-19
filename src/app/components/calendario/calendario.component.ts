import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../services/cliente.service';
import { AuthService } from '../../services/auth.service';
import { Cliente, DiaCalendario } from '../../models/cliente';
import { Subscription } from 'rxjs';
import { AgregarClienteComponent } from '../agregar-cliente/agregar-cliente.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, AgregarClienteComponent],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements OnInit, OnDestroy {
  mesActual: number;
  anioActual: number;
  anioMinimo: number;
  diasCalendario: DiaCalendario[] = [];
  
  // Modales
  modalDiaAbierto = false;
  modalClientesAreaAbierto = false;
  modalDetalleCumpleaneroAbierto = false;
  formularioAbierto = false;
  
  // Datos seleccionados
  diaSeleccionado: DiaCalendario | null = null;
  areaSeleccionada: string | null = null;
  clienteDetalle: Cliente | null = null;
  clienteEditando: Cliente | null = null;
  
  // Cumpleaños agrupados
  cumpleanosPorArea: { [area: string]: { cliente: Cliente; edad: number }[] } = {};
  
  // Modo editor
  modoEditor = false;
  
  // Cumpleaños de hoy
  cumpleanosHoy: { [area: string]: { cliente: Cliente; edad: number }[] } = {};
  totalCumpleanosHoy = 0;
  modalCumpleanosHoyAbierto = false;
  
  nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  private subscription: Subscription = new Subscription();

  constructor(
    public clienteService: ClienteService,
    public authService: AuthService,
    private router: Router
  ) {
    const hoy = new Date();
    this.mesActual = hoy.getMonth();
    this.anioActual = hoy.getFullYear();
    this.anioMinimo = hoy.getFullYear();
    this.modoEditor = false;
  }

  ngOnInit(): void {
    this.subscription.add(
      this.clienteService.clientes$.subscribe((clientes) => {
        console.log('🔄 Clientes actualizados:', clientes.length);
        this.generarCalendario();
        this.obtenerCumpleanosHoy();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  obtenerEdad(fechaNacimiento: Date): number {
    return this.clienteService.calcularEdad(fechaNacimiento);
  }

  formatearFecha(fecha: Date): string {
    const f = new Date(fecha);
    const dia = String(f.getUTCDate()).padStart(2, '0');
    const mes = String(f.getUTCMonth() + 1).padStart(2, '0');
    const anio = f.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  formatearTelefono(telefono: string): string {
    if (!telefono) return '';
    const limpio = telefono.replace(/\D/g, '');
    if (limpio.length === 10) {
      return `(${limpio.slice(0, 3)}) ${limpio.slice(3, 6)}-${limpio.slice(6)}`;
    }
    return telefono;
  }

  generarMensajeCumpleanos(cliente: Cliente, edad: number): string {
    const user = this.authService.getCurrentUser();
    const nombreRemitente = user ? this.obtenerNombreRol(user.username) : 'Hotel HB';
    
    const mensajes = [
      `🎉✨ ¡Feliz Cumpleaños ${cliente.nombre}! ✨🎉

Hoy celebramos tus ${edad} años de vida y queremos que sepas que eres muy especial para nosotros. 💖

Que este nuevo año esté lleno de alegrías, éxitos y momentos inolvidables. 🎂🎈

¡Mil bendiciones en tu día especial! ⭐

Con cariño,
*${nombreRemitente}*
_Hotel HB_ 🏨`,
      
      `🎊 ¡${cliente.nombre}, hoy es tu día especial! 🎊

Te deseamos un cumpleaños lleno de amor, felicidad y momentos maravillosos. 💝

Que tus ${edad} años sean el inicio de grandes aventuras y sueños cumplidos. ✨🎁

¡Disfruta cada segundo de este hermoso día! 🎂🎉

Con mucho cariño,
*${nombreRemitente}*
_Hotel HB_ 🌺`,
      
      `✨🎈 ¡Felicidades ${cliente.nombre}! 🎈✨

En este día tan especial queremos celebrarte y agradecerte por ser parte de nuestra familia. 💙

Que tus ${edad} años estén llenos de sonrisas, salud y prosperidad. ⭐🎂

¡Te enviamos un abrazo enorme y nuestros mejores deseos! 🤗💖

Atentamente,
*${nombreRemitente}*
_Hotel HB_ 🏨❤️`
    ];
    
    return mensajes[Math.floor(Math.random() * mensajes.length)];
  }

  enviarWhatsApp(cliente: Cliente): void {
    if (!cliente.telefono) {
      alert('Este cliente no tiene teléfono registrado');
      return;
    }

    const user = this.authService.getCurrentUser();
    const nombreRemitente = user ? this.obtenerNombreRol(user.username) : 'Hotel HB';
    const edad = this.obtenerEdad(cliente.fechaNacimiento);
    
    const mensajes = [
      // Mensaje 1 - Cálido y familiar
      `*FELIZ CUMPLEAÑOS ${cliente.nombre.toUpperCase()}*%0A%0A` +
      `Hoy es un dia muy especial porque celebramos tus *${edad} años* de vida.%0A%0A` +
      `Queremos que sepas que eres una persona muy importante para nosotros y apreciamos profundamente tu confianza y preferencia.%0A%0A` +
      `En este nuevo año que comienzas, te deseamos:%0A%0A` +
      `*- Alegrias infinitas* que iluminen cada uno de tus dias%0A` +
      `*- Exito* en cada proyecto que emprendas%0A` +
      `*- Amor y compañia* de tus seres mas queridos%0A` +
      `*- Momentos inolvidables* que atesores por siempre%0A` +
      `*- Salud y prosperidad* en abundancia%0A%0A` +
      `Que cada deseo que tengas se convierta en realidad y que este año este lleno de bendiciones.%0A%0A` +
      `Disfruta tu dia al maximo, te lo mereces!%0A%0A` +
      `_Con cariño y los mejores deseos,%0A${nombreRemitente}%0AHotel HB_`,

      // Mensaje 2 - Profesional y emotivo
      `*FELICIDADES EN TU CUMPLEAÑOS, ${cliente.nombre.toUpperCase()}*%0A%0A` +
      `En este dia tan especial, queremos enviarte nuestros mas sinceros y calurosos deseos de felicidad.%0A%0A` +
      `Cumples *${edad} años* y cada uno de ellos representa experiencias vividas, aprendizajes valiosos y momentos unicos que te han convertido en la persona especial que eres hoy.%0A%0A` +
      `De todo corazon, te deseamos que:%0A%0A` +
      `*- Todos tus sueños* se materialicen y superen tus expectativas%0A` +
      `*- Cada nuevo dia* sea mejor que el anterior%0A` +
      `*- Las sorpresas* y alegrias toquen constantemente a tu puerta%0A` +
      `*- La vida* te siga sonriendo con generosidad%0A` +
      `*- Tu luz interior* brille cada vez con mas fuerza%0A%0A` +
      `Que este nuevo ciclo sea el inicio de grandes aventuras, nuevas oportunidades y logros extraordinarios.%0A%0A` +
      `Gracias por confiar en nosotros y permitirnos ser parte de tu historia.%0A%0A` +
      `_Con mucho aprecio y admiracion,%0A${nombreRemitente}%0AHotel HB_`,

      // Mensaje 3 - Cercano y afectuoso
      `*MUCHAS FELICIDADES ${cliente.nombre.toUpperCase()}*%0A%0A` +
      `Hoy celebramos contigo un año mas de vida, y queremos que este mensaje llegue directamente a tu corazon, cargado de los mejores deseos.%0A%0A` +
      `En tus *${edad} años* has demostrado ser una persona excepcional, y nos sentimos muy afortunados de que formes parte de nuestra gran familia en Hotel HB.%0A%0A` +
      `Nuestros sinceros deseos para ti en este nuevo año son:%0A%0A` +
      `*- Felicidad plena* en cada momento que vivas%0A` +
      `*- Amor genuino* que te acompañe siempre%0A` +
      `*- Logros importantes* en todas tus metas%0A` +
      `*- Salud inquebrantable* para ti y los tuyos%0A` +
      `*- Paz interior* y sonrisas constantes%0A%0A` +
      `Esperamos que este dia este lleno de celebracion, risas, abrazos sinceros y momentos magicos junto a las personas que mas amas.%0A%0A` +
      `Te enviamos un abrazo enorme y toda nuestra energia positiva para que este nuevo ciclo sea absolutamente maravilloso.%0A%0A` +
      `Que disfrutes mucho tu dia especial!%0A%0A` +
      `_Con todo nuestro cariño,%0A${nombreRemitente}%0AHotel HB_`
    ];

    // Seleccionar mensaje aleatorio
    const mensajeSeleccionado = mensajes[Math.floor(Math.random() * mensajes.length)];

    // Crear URL de WhatsApp
    const telefono = cliente.telefono.replace(/\D/g, '');
    const url = `https://wa.me/52${telefono}?text=${mensajeSeleccionado}`;

    // Abrir WhatsApp
    window.open(url, '_blank');
  }

  generarCalendario(): void {
    const primerDia = new Date(this.anioActual, this.mesActual, 1);
    const ultimoDia = new Date(this.anioActual, this.mesActual + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();

    const hoy = new Date();
    const esHoy = (dia: number) => 
      dia === hoy.getDate() && 
      this.mesActual === hoy.getMonth() && 
      this.anioActual === hoy.getFullYear();

    this.diasCalendario = [];

    const diasMesAnterior = new Date(this.anioActual, this.mesActual, 0).getDate();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      const mesAnterior = this.mesActual === 0 ? 11 : this.mesActual - 1;
      const anioAnterior = this.mesActual === 0 ? this.anioActual - 1 : this.anioActual;
      
      this.diasCalendario.push({
        dia,
        mes: mesAnterior,
        anio: anioAnterior,
        esHoy: false,
        esMesActual: false,
        tieneCumpleanos: false,
        cumpleanos: []
      });
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const cumpleanos = this.clienteService.obtenerCumpleanosPorDia(dia, this.mesActual, this.anioActual);
      
      this.diasCalendario.push({
        dia,
        mes: this.mesActual,
        anio: this.anioActual,
        esHoy: esHoy(dia),
        esMesActual: true,
        tieneCumpleanos: cumpleanos.length > 0,
        cumpleanos
      });
    }

    const diasRestantes = 42 - this.diasCalendario.length;
    const mesSiguiente = this.mesActual === 11 ? 0 : this.mesActual + 1;
    const anioSiguiente = this.mesActual === 11 ? this.anioActual + 1 : this.anioActual;
    
    for (let dia = 1; dia <= diasRestantes; dia++) {
      this.diasCalendario.push({
        dia,
        mes: mesSiguiente,
        anio: anioSiguiente,
        esHoy: false,
        esMesActual: false,
        tieneCumpleanos: false,
        cumpleanos: []
      });
    }
  }

  // obtenerCumpleanosHoy(): void {
  //   const hoy = new Date();
  //   const dia = hoy.getDate();
  //   const mes = hoy.getMonth();

  //   const clientesFiltrados = this.clienteService.getClientesFiltrados();
    
  //   const clientesHoy = clientesFiltrados.filter(cliente => {
  //     const fecha = new Date(cliente.fechaNacimiento);
  //     return fecha.getUTCDate() === dia && fecha.getUTCMonth() === mes;
  //   });

  //   this.cumpleanosHoy = {};
  //   this.totalCumpleanosHoy = 0;

  //   clientesHoy.forEach(cliente => {
  //     const area = this.obtenerNombreRol(cliente.creadoPor);
      
  //     if (!this.cumpleanosHoy[area]) {
  //       this.cumpleanosHoy[area] = [];
  //     }

  //     const edad = this.clienteService.calcularEdad(cliente.fechaNacimiento);
  //     this.cumpleanosHoy[area].push({ cliente, edad });
  //     this.totalCumpleanosHoy++;
  //   });
  // }
  obtenerCumpleanosHoy(): void {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth();

  // ⬇️ CAMBIO: Ahora obtenemos TODOS los clientes
  const todosLosClientes = this.clienteService.getClientesFiltrados();
  
  const clientesHoy = todosLosClientes.filter(cliente => {
    const fecha = new Date(cliente.fechaNacimiento);
    return fecha.getUTCDate() === dia && fecha.getUTCMonth() === mes;
  });

  this.cumpleanosHoy = {};
  
  // ⬇️ NUEVO: Solo contamos los de NUESTRA área para la notificación
  const user = this.authService.getCurrentUser();
  this.totalCumpleanosHoy = 0;

  clientesHoy.forEach(cliente => {
    const area = this.obtenerNombreRol(cliente.creadoPor);
    
    if (!this.cumpleanosHoy[area]) {
      this.cumpleanosHoy[area] = [];
    }

    const edad = this.clienteService.calcularEdad(cliente.fechaNacimiento);
    this.cumpleanosHoy[area].push({ cliente, edad });
    
    // ⬇️ Solo sumamos al contador si es de NUESTRA área (o si somos admin)
    if (user?.rol === 'admin' || cliente.creadoPor === user?.username) {
      this.totalCumpleanosHoy++;
    }
  });
}

  mesAnterior(): void {
    if (this.mesActual === 0) {
      if (this.anioActual > this.anioMinimo) {
        this.mesActual = 11;
        this.anioActual--;
      }
    } else {
      this.mesActual--;
    }
    this.generarCalendario();
  }

  mesSiguiente(): void {
    if (this.mesActual === 11) {
      this.mesActual = 0;
      this.anioActual++;
    } else {
      this.mesActual++;
    }
    this.generarCalendario();
  }

  puedeRetroceder(): boolean {
    return this.anioActual > this.anioMinimo || this.mesActual > 0;
  }

  // MODAL 1: Click en día del calendario
  abrirModalDia(dia: DiaCalendario): void {
    if (dia.tieneCumpleanos) {
      this.diaSeleccionado = dia;
      
      // Agrupar por área
      this.cumpleanosPorArea = {};
      dia.cumpleanos.forEach(cumple => {
        const area = this.obtenerNombreRol(cumple.cliente.creadoPor);
        if (!this.cumpleanosPorArea[area]) {
          this.cumpleanosPorArea[area] = [];
        }
        this.cumpleanosPorArea[area].push({
          cliente: cumple.cliente,
          edad: cumple.edad
        });
      });
      
      this.modalDiaAbierto = true;
    }
  }

  cerrarModalDia(): void {
    this.modalDiaAbierto = false;
    this.diaSeleccionado = null;
    this.cumpleanosPorArea = {};
  }

  obtenerAreas(): string[] {
    return Object.keys(this.cumpleanosPorArea);
  }

  // MODAL 2: Ver clientes de un área
  abrirModalClientesArea(area: string): void {
    this.areaSeleccionada = area;
    this.modalClientesAreaAbierto = true;
  }

  cerrarModalClientesArea(): void {
    this.modalClientesAreaAbierto = false;
    this.areaSeleccionada = null;
  }

  obtenerClientesDeArea(area: string): { cliente: Cliente; edad: number }[] {
    return this.cumpleanosPorArea[area] || [];
  }

  // MODAL 3: Ver detalle del cumpleañero
  abrirModalDetalleCumpleanero(cliente: Cliente): void {
    this.clienteDetalle = cliente;
    this.modalDetalleCumpleaneroAbierto = true;
  }

  cerrarModalDetalleCumpleanero(): void {
    this.modalDetalleCumpleaneroAbierto = false;
    this.clienteDetalle = null;
  }

  // Cumpleaños de hoy
  abrirModalCumpleanosHoy(): void {
    this.modalCumpleanosHoyAbierto = true;
  }

  cerrarModalCumpleanosHoy(): void {
    this.modalCumpleanosHoyAbierto = false;
  }

  obtenerAreasHoy(): string[] {
    return Object.keys(this.cumpleanosHoy);
  }

  obtenerClientesDeAreaHoy(area: string): { cliente: Cliente; edad: number }[] {
    return this.cumpleanosHoy[area] || [];
  }

  // Formulario
  abrirFormulario(): void {
    this.clienteEditando = null;
    this.formularioAbierto = true;
  }

  cerrarFormulario(): void {
    this.formularioAbierto = false;
    this.clienteEditando = null;
  }

  editarCliente(cliente: Cliente): void {
    this.clienteEditando = cliente;
    this.cerrarModalDetalleCumpleanero();
    this.cerrarModalClientesArea();
    this.cerrarModalDia();
    this.cerrarModalCumpleanosHoy();
    this.formularioAbierto = true;
  }

  async eliminarCliente(id: string): Promise<void> {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await this.clienteService.eliminarCliente(id);
        this.cerrarModalDetalleCumpleanero();
        this.cerrarModalClientesArea();
        this.cerrarModalDia();
      } catch (error) {
        alert('Error al eliminar el cliente');
      }
    }
  }

  onClienteGuardado(): void {
    this.cerrarFormulario();
  }

  cerrarSesion(): void {
    if (confirm('¿Deseas cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  activarModoEditor(): void {
    if (this.modoEditor) {
      alert('✅ El modo editor ya está activo. Usa el botón "✖" para desactivarlo.');
      return;
    }

    const password = prompt('🔐 Ingresa la contraseña de editor:');
    
    if (password === 'hbhotel') {
      this.modoEditor = true;
      alert('✅ Modo Editor activado');
    } else if (password) {
      alert('❌ Contraseña incorrecta');
    }
  }

  desactivarModoEditor(): void {
    this.modoEditor = false;
    alert('🔒 Modo Editor desactivado');
  }

  obtenerNombreRol(rol: string): string {
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'karina': 'Karina',
      'elisa': 'Elisa',
      'cesia': 'Cesia',
      'restaurante': 'Restaurante',
      'recepcion': 'Recepción'
    };
    return roles[rol] || rol;
  }
}