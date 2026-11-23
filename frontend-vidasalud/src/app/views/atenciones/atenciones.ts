import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AtencionesService,
  type Atencion,
  type EstadoAtencion,
  type PrestacionCatalogo,
  type TicketAdmision
} from '../../services/atenciones.service';

@Component({
  selector: 'app-atenciones',
  imports: [FormsModule],
  templateUrl: './atenciones.html',
  styleUrl: './atenciones.css'
})
export class Atenciones implements OnInit, OnDestroy {
  private atencionesService = inject(AtencionesService);
  private platformId = inject(PLATFORM_ID);

  rolActual = 'Paciente';
  correoUsuario = 'paciente@vidasalud.cl';
  nombreUsuario = 'Paciente';

  prestaciones: PrestacionCatalogo[] = [];
  atenciones: Atencion[] = [];
  filtroEstado: string = 'TODOS';

  centrosSalud = [
    'Centro Atención Primaria Viña del Mar',
    'Clínica Dental Valparaíso',
    'Centro Salud Familiar Quilpué',
    'Clínica Dental Reñaca'
  ];

  centroSeleccionado = this.centrosSalud[0];
  prestacionSeleccionadaId = 'PREST-01';
  fechaSeleccionada = '2026-11-25';
  horaSeleccionada = '10:00';
  motivoConsulta = '';

  mensajeExito = '';
  mensajeError = '';
  ultimoTicket: TicketAdmision | null = null;

  private listenerCambioRol = () => this.sincronizarContextoYDatos();

  ngOnInit(): void {
    this.sincronizarContextoYDatos();

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('vidasalud-rol-cambiado', this.listenerCambioRol);
    }
  }

  sincronizarContextoYDatos(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.rolActual = localStorage.getItem('vidasalud_rol_simulado') || 'Paciente';
      this.correoUsuario = `${this.rolActual.toLowerCase()}@vidasalud.cl`;
      this.nombreUsuario = this.rolActual;
    }

    this.ultimoTicket = null;
    this.prestaciones = this.atencionesService.obtenerPrestaciones();
    this.cargarAtenciones();
  }

  cargarAtenciones(): void {
    if (this.rolActual === 'Paciente') {
      this.atenciones = this.atencionesService.obtenerAtencionesPaciente('paciente@vidasalud.cl');
    } else {
      this.atenciones = this.atencionesService.obtenerAtenciones();
    }
  }

  get atencionesFiltradas(): Atencion[] {
    if (this.filtroEstado === 'TODOS') {
      return this.atenciones;
    }
    return this.atenciones.filter((a) => a.estado === this.filtroEstado);
  }

  solicitarAtencion(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
    this.ultimoTicket = null;

    if (!this.fechaSeleccionada || !this.horaSeleccionada) {
      this.mensajeError = 'Selecciona una fecha y hora válida para la atención.';
      return;
    }

    const creada = this.atencionesService.crearAtencion({
      pacienteNombre: 'Paciente Demo',
      pacienteCorreo: 'paciente@vidasalud.cl',
      centroSalud: this.centroSeleccionado,
      prestacionId: this.prestacionSeleccionadaId,
      fecha: this.fechaSeleccionada,
      hora: this.horaSeleccionada,
      motivo: this.motivoConsulta,
      rolCreador: this.rolActual
    });

    this.motivoConsulta = '';
    this.mensajeExito = `Solicitud ${creada.id} registrada el ${creada.creadaEn} (hora del dispositivo) en estado SOLICITADA.`;
    this.cargarAtenciones();
  }

  actualizarEstado(atencion: Atencion, nuevoEstado: EstadoAtencion): void {
    this.mensajeError = '';
    this.mensajeExito = '';
    this.ultimoTicket = null;

    const resultado = this.atencionesService.cambiarEstado(
      atencion.id,
      nuevoEstado,
      this.correoUsuario,
      this.rolActual
    );

    if (!resultado.ok) {
      this.mensajeError = resultado.mensaje || 'No se pudo actualizar el estado.';
      return;
    }

    this.mensajeExito = `Atención ${atencion.id} actualizada a ${nuevoEstado}.`;
    if (resultado.ticket) {
      this.ultimoTicket = resultado.ticket;
    }
    this.prestaciones = this.atencionesService.obtenerPrestaciones();
    this.cargarAtenciones();
  }

  cerrarTicket(): void {
    this.ultimoTicket = null;
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('vidasalud-rol-cambiado', this.listenerCambioRol);
    }
  }
}