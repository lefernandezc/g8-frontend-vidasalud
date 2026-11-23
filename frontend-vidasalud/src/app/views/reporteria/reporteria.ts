import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AtencionesService,
  type Atencion,
  type EstadoAtencion,
  type PrestacionCatalogo
} from '../../services/atenciones.service';

interface ResumenEstado {
  estado: EstadoAtencion;
  cantidad: number;
  porcentaje: number;
  claseColor: string;
}

interface ResumenPrestacion {
  id: string;
  nombre: string;
  especialidad: string;
  box: string;
  atencionesCount: number;
  cuposDisponibles: number;
  recaudacionEstimada: number;
}

interface ResumenCentro {
  centro: string;
  cantidad: number;
  porcentaje: number;
}

@Component({
  selector: 'app-reporteria',
  imports: [FormsModule],
  templateUrl: './reporteria.html',
  styleUrl: './reporteria.css'
})
export class Reporteria implements OnInit, OnDestroy {
  private atencionesService = inject(AtencionesService);
  private platformId = inject(PLATFORM_ID);

  rolActual = 'Admin';
  atenciones: Atencion[] = [];
  prestaciones: PrestacionCatalogo[] = [];

  centroFiltro = 'TODOS';
  centrosDisponibles: string[] = [];
  mensajeExportacion = '';

  private listenerCambioRol = () => this.cargarReportes();

  ngOnInit(): void {
    this.cargarReportes();

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('vidasalud-rol-cambiado', this.listenerCambioRol);
    }
  }

  cargarReportes(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.rolActual = localStorage.getItem('vidasalud_rol_simulado') || 'Admin';
    }

    this.atenciones = this.atencionesService.obtenerAtenciones();
    this.prestaciones = this.atencionesService.obtenerPrestaciones();

    const centrosSet = new Set<string>([
      'Centro Atención Primaria Viña del Mar',
      'Clínica Dental Valparaíso',
      'Centro Salud Familiar Quilpué',
      'Clínica Dental Reñaca',
      ...this.atenciones.map((a) => a.centroSalud)
    ]);
    this.centrosDisponibles = Array.from(centrosSet);
  }

  get atencionesFiltradas(): Atencion[] {
    if (this.centroFiltro === 'TODOS') {
      return this.atenciones;
    }
    return this.atenciones.filter((a) => a.centroSalud === this.centroFiltro);
  }

  get totalAtenciones(): number {
    return this.atencionesFiltradas.length;
  }

  get atencionesActivas(): number {
    return this.atencionesFiltradas.filter((a) =>
      ['SOLICITADA', 'CONFIRMADA', 'EN_ESPERA', 'EN_ATENCIÓN'].includes(a.estado)
    ).length;
  }

  get tasaEfectividad(): number {
    if (this.totalAtenciones === 0) return 0;
    const validas = this.atencionesFiltradas.filter((a) => a.estado !== 'CANCELADA').length;
    return Math.round((validas / this.totalAtenciones) * 100);
  }

  get recaudacionTotal(): number {
    const mapaPrecios = new Map(this.prestaciones.map((p) => [p.id, p.precio]));
    return this.atencionesFiltradas
      .filter((a) => a.estado !== 'CANCELADA')
      .reduce((acc, cita) => acc + (mapaPrecios.get(cita.prestacionId) || 0), 0);
  }

  get cuposTotalesRed(): number {
    return this.prestaciones.reduce((acc, p) => acc + p.cuposDisponibles, 0);
  }

  get distribucionEstados(): ResumenEstado[] {
    const estadosConfig: { estado: EstadoAtencion; claseColor: string }[] = [
      { estado: 'SOLICITADA', claseColor: 'barra-amarilla' },
      { estado: 'CONFIRMADA', claseColor: 'barra-azul' },
      { estado: 'EN_ESPERA', claseColor: 'barra-indigo' },
      { estado: 'EN_ATENCIÓN', claseColor: 'barra-verde' },
      { estado: 'CERRADA', claseColor: 'barra-gris' },
      { estado: 'CANCELADA', claseColor: 'barra-roja' }
    ];

    const total = this.totalAtenciones;

    return estadosConfig.map((item) => {
      const cantidad = this.atencionesFiltradas.filter((a) => a.estado === item.estado).length;
      const porcentaje = total > 0 ? Math.round((cantidad / total) * 100) : 0;
      return {
        estado: item.estado,
        cantidad,
        porcentaje,
        claseColor: item.claseColor
      };
    });
  }

  get actividadPorCentro(): ResumenCentro[] {
    const total = this.atenciones.length;
    return this.centrosDisponibles.map((centro) => {
      const cantidad = this.atenciones.filter((a) => a.centroSalud === centro).length;
      const porcentaje = total > 0 ? Math.round((cantidad / total) * 100) : 0;
      return { centro, cantidad, porcentaje };
    });
  }

  get rendimientoPrestaciones(): ResumenPrestacion[] {
    return this.prestaciones.map((prest) => {
      const citasPrestacion = this.atencionesFiltradas.filter(
        (a) => a.prestacionId === prest.id && a.estado !== 'CANCELADA'
      );
      return {
        id: prest.id,
        nombre: prest.nombre,
        especialidad: prest.especialidad,
        box: prest.box,
        atencionesCount: citasPrestacion.length,
        cuposDisponibles: prest.cuposDisponibles,
        recaudacionEstimada: citasPrestacion.length * prest.precio
      };
    });
  }

  exportarCSV(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const encabezados = ['Codigo', 'Paciente', 'Centro', 'Prestacion', 'Box', 'Fecha_Cita', 'Hora', 'Estado', 'Registrada_En'];
    const filas = this.atencionesFiltradas.map((c) => [
      c.id,
      c.pacienteCorreo,
      `"${c.centroSalud}"`,
      `"${c.prestacionNombre}"`,
      c.box,
      c.fecha,
      c.hora,
      c.estado,
      c.creadaEn
    ]);

    const contenido = [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte-vidasalud-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);

    this.mensajeExportacion = `Reporte CSV descargado (${this.atencionesFiltradas.length} registros).`;
    setTimeout(() => (this.mensajeExportacion = ''), 4000);
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('vidasalud-rol-cambiado', this.listenerCambioRol);
    }
  }
}