import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtencionesService, type PrestacionCatalogo } from '../../services/atenciones.service';

@Component({
  selector: 'app-catalogo-prestaciones',
  imports: [FormsModule],
  templateUrl: './catalogo-prestaciones.html',
  styleUrl: './catalogo-prestaciones.css'
})
export class CatalogoPrestaciones implements OnInit, OnDestroy {
  private atencionesService = inject(AtencionesService);
  private platformId = inject(PLATFORM_ID);

  rolActual = 'Recepcionista';
  prestaciones: PrestacionCatalogo[] = [];
  filtroEspecialidad = 'TODAS';

  // Formulario de creación (solo Admin)
  nuevoNombre = '';
  nuevaEspecialidad = 'Atención Primaria';
  nuevoBox = '';
  nuevosCupos = 6;
  nuevoPrecio = 20000;

  // Edición en línea (solo Admin)
  editandoId: string | null = null;
  editBox = '';
  editCupos = 0;
  editPrecio = 0;

  mensajeExito = '';
  mensajeError = '';

  private listenerCambioRol = () => this.cargarDatos();

  ngOnInit(): void {
    this.cargarDatos();

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('vidasalud-rol-cambiado', this.listenerCambioRol);
    }
  }

  cargarDatos(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.rolActual = localStorage.getItem('vidasalud_rol_simulado') || 'Recepcionista';
    }
    this.prestaciones = this.atencionesService.obtenerPrestaciones();
  }

  get prestacionesFiltradas(): PrestacionCatalogo[] {
    if (this.filtroEspecialidad === 'TODAS') {
      return this.prestaciones;
    }
    return this.prestaciones.filter((p) => p.especialidad === this.filtroEspecialidad);
  }

  get totalCuposRed(): number {
    return this.prestaciones.reduce((acc, item) => acc + item.cuposDisponibles, 0);
  }

  agregarPrestacion(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.nuevoNombre.trim() || !this.nuevoBox.trim()) {
      this.mensajeError = 'Completa el nombre de la prestación y el box asignado.';
      return;
    }

    const creada = this.atencionesService.crearPrestacion({
      nombre: this.nuevoNombre.trim(),
      especialidad: this.nuevaEspecialidad,
      box: this.nuevoBox.trim(),
      cuposDisponibles: Number(this.nuevosCupos) || 1,
      precio: Number(this.nuevoPrecio) || 10000
    });

    this.nuevoNombre = '';
    this.nuevoBox = '';
    this.mensajeExito = `Prestación ${creada.id} (${creada.nombre}) agregada al catálogo.`;
    this.cargarDatos();
  }

  iniciarEdicion(item: PrestacionCatalogo): void {
    this.editandoId = item.id;
    this.editBox = item.box;
    this.editCupos = item.cuposDisponibles;
    this.editPrecio = item.precio;
  }

  cancelarEdicion(): void {
    this.editandoId = null;
  }

  guardarEdicion(id: string): void {
    this.atencionesService.actualizarPrestacion(id, {
      box: this.editBox.trim() || 'Box 101',
      cuposDisponibles: Math.max(0, Number(this.editCupos)),
      precio: Math.max(0, Number(this.editPrecio))
    });

    this.editandoId = null;
    this.mensajeExito = `Prestación ${id} actualizada correctamente.`;
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('vidasalud-rol-cambiado', this.listenerCambioRol);
    }
  }
}