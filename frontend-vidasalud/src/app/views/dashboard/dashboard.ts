import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AtencionesService, type Atencion } from '../../services/atenciones.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private atencionesService = inject(AtencionesService);
  private platformId = inject(PLATFORM_ID);

  rolActual = 'Paciente';
  nombreUsuario = 'Paciente';
  correoUsuario = 'paciente@vidasalud.cl';

  // Datos para Paciente
  proximasAtenciones: Atencion[] = [];
  totalSolicitadas = 0;
  totalConfirmadas = 0;
  totalEnCurso = 0;

  // Datos resumidos para otros roles
  todasLasAtenciones: Atencion[] = [];
  cuposTotalesDisponibles = 0;

  private listenerCambioRol = () => this.cargarResumenDashboard();

  ngOnInit(): void {
    this.cargarResumenDashboard();

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('vidasalud-rol-cambiado', this.listenerCambioRol);
    }
  }

  cargarResumenDashboard(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.rolActual = localStorage.getItem('vidasalud_rol_simulado') || 'Paciente';
      this.correoUsuario = `${this.rolActual.toLowerCase()}@vidasalud.cl`;
      this.nombreUsuario = this.rolActual;
    }

    const citasPaciente = this.atencionesService.obtenerAtencionesPaciente('paciente@vidasalud.cl');

    // Filtramos citas vigentes (excluyendo cerradas o canceladas)
    this.proximasAtenciones = citasPaciente.filter(
      (c) => c.estado !== 'CERRADA' && c.estado !== 'CANCELADA'
    );

    this.totalSolicitadas = citasPaciente.filter((c) => c.estado === 'SOLICITADA').length;
    this.totalConfirmadas = citasPaciente.filter((c) => c.estado === 'CONFIRMADA').length;
    this.totalEnCurso = citasPaciente.filter(
      (c) => c.estado === 'EN_ESPERA' || c.estado === 'EN_ATENCIÓN'
    ).length;

    // Métricas globales para Recepcionista / Admin / Auditor
    this.todasLasAtenciones = this.atencionesService.obtenerAtenciones();
    const prestaciones = this.atencionesService.obtenerPrestaciones();
    this.cuposTotalesDisponibles = prestaciones.reduce(
      (acum, item) => acum + item.cuposDisponibles,
      0
    );
  }

  get pendientesRecepcion(): Atencion[] {
    return this.todasLasAtenciones.filter(
      (c) => c.estado === 'SOLICITADA' || c.estado === 'CONFIRMADA' || c.estado === 'EN_ESPERA'
    );
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('vidasalud-rol-cambiado', this.listenerCambioRol);
    }
  }
}