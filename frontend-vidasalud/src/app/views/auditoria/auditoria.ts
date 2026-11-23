import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AtencionesService,
  type EventoAuditoria
} from '../../services/atenciones.service';

@Component({
  selector: 'app-auditoria',
  imports: [FormsModule],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css'
})
export class Auditoria implements OnInit, OnDestroy {
  private atencionesService = inject(AtencionesService);
  private platformId = inject(PLATFORM_ID);

  rolActual = 'Auditor';
  eventos: EventoAuditoria[] = [];

  // Filtros de consulta
  busquedaTexto = '';
  filtroRol = 'TODOS';
  filtroEstado = 'TODOS';
  mensajeExportacion = '';

  private listenerCambioRol = () => this.cargarAuditoria();

  ngOnInit(): void {
    this.cargarAuditoria();

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('vidasalud-rol-cambiado', this.listenerCambioRol);
    }
  }

  cargarAuditoria(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.rolActual = localStorage.getItem('vidasalud_rol_simulado') || 'Auditor';
    }
    this.eventos = this.atencionesService.obtenerAuditoria();
  }

  get eventosFiltrados(): EventoAuditoria[] {
    const termino = this.busquedaTexto.trim().toLowerCase();

    return this.eventos.filter((ev) => {
      const coincideRol =
        this.filtroRol === 'TODOS' ||
        ev.rol.toLowerCase() === this.filtroRol.toLowerCase();

      const coincideEstado =
        this.filtroEstado === 'TODOS' || ev.estadoNuevo === this.filtroEstado;

      const coincideTexto =
        !termino ||
        ev.id.toLowerCase().includes(termino) ||
        ev.atencionId.toLowerCase().includes(termino) ||
        ev.usuario.toLowerCase().includes(termino) ||
        ev.accion.toLowerCase().includes(termino) ||
        ev.detalle.toLowerCase().includes(termino);

      return coincideRol && coincideEstado && coincideTexto;
    });
  }

  get totalEventos(): number {
    return this.eventos.length;
  }

  get actoresDistintos(): number {
    return new Set(this.eventos.map((e) => e.usuario)).size;
  }

  get atencionesAuditadas(): number {
    return new Set(this.eventos.map((e) => e.atencionId)).size;
  }

  limpiarFiltros(): void {
    this.busquedaTexto = '';
    this.filtroRol = 'TODOS';
    this.filtroEstado = 'TODOS';
  }

  exportarAuditoriaCSV(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const encabezados = [
      'ID_Evento',
      'Fecha_Hora',
      'ID_Atencion',
      'Accion',
      'Estado_Resultante',
      'Usuario',
      'Rol',
      'Detalle_Tecnico'
    ];

    const filas = this.eventosFiltrados.map((ev) => [
      ev.id,
      `"${ev.fechaHora}"`,
      ev.atencionId,
      `"${ev.accion}"`,
      ev.estadoNuevo,
      ev.usuario,
      ev.rol,
      `"${ev.detalle}"`
    ]);

    const contenido = [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `auditoria-vidasalud-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);

    this.mensajeExportacion = `Log de auditoría exportado (${this.eventosFiltrados.length} eventos).`;
    setTimeout(() => (this.mensajeExportacion = ''), 4000);
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('vidasalud-rol-cambiado', this.listenerCambioRol);
    }
  }
}