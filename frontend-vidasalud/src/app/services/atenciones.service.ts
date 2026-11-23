import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type EstadoAtencion =
  | 'SOLICITADA'
  | 'CONFIRMADA'
  | 'EN_ESPERA'
  | 'EN_ATENCIÓN'
  | 'CERRADA'
  | 'CANCELADA';

export interface PrestacionCatalogo {
  id: string;
  nombre: string;
  especialidad: string;
  box: string;
  cuposDisponibles: number;
  precio: number;
}

export interface Atencion {
  id: string;
  pacienteNombre: string;
  pacienteCorreo: string;
  centroSalud: string;
  prestacionId: string;
  prestacionNombre: string;
  box: string;
  fecha: string;
  hora: string;
  estado: EstadoAtencion;
  motivo: string;
  creadaEn: string;
}

export interface TicketAdmision {
  codigoTicket: string;
  atencionId: string;
  pacienteCorreo: string;
  prestacionNombre: string;
  centroSalud: string;
  box: string;
  colaDestino: string;
  mensajeNotificacion: string;
  emitidoEn: string;
}

export interface EventoAuditoria {
  id: string;
  atencionId: string;
  accion: string;
  estadoNuevo: EstadoAtencion;
  usuario: string;
  rol: string;
  fechaHora: string;
  detalle: string;
}

@Injectable({
  providedIn: 'root'
})
export class AtencionesService {
  private platformId = inject(PLATFORM_ID);

  private readonly KEY_ATENCIONES = 'vidasalud_atenciones_v1';
  private readonly KEY_CATALOGO = 'vidasalud_catalogo_v1';
  private readonly KEY_AUDITORIA = 'vidasalud_auditoria_v1';

  private prestacionesIniciales: PrestacionCatalogo[] = [
    {
      id: 'PREST-01',
      nombre: 'Consulta Medicina General',
      especialidad: 'Atención Primaria',
      box: 'Box 101',
      cuposDisponibles: 8,
      precio: 15000
    },
    {
      id: 'PREST-02',
      nombre: 'Evaluación y Limpieza Dental',
      especialidad: 'Odontología',
      box: 'Box Dental 201',
      cuposDisponibles: 5,
      precio: 28000
    },
    {
      id: 'PREST-03',
      nombre: 'Control Preventivo Cardiovascular',
      especialidad: 'Atención Primaria',
      box: 'Box 104',
      cuposDisponibles: 6,
      precio: 18000
    },
    {
      id: 'PREST-04',
      nombre: 'Urgencia Dental Básica',
      especialidad: 'Odontología',
      box: 'Box Dental 202',
      cuposDisponibles: 3,
      precio: 35000
    }
  ];

  private atencionesIniciales: Atencion[] = [
    {
      id: 'ATN-1001',
      pacienteNombre: 'Paciente Demo',
      pacienteCorreo: 'paciente@vidasalud.cl',
      centroSalud: 'Centro Atención Primaria Viña del Mar',
      prestacionId: 'PREST-01',
      prestacionNombre: 'Consulta Medicina General',
      box: 'Box 101',
      fecha: '2026-11-24',
      hora: '10:00',
      estado: 'CONFIRMADA',
      motivo: 'Control general anual',
      creadaEn: '2026-11-22 09:30:00'
    },
    {
      id: 'ATN-1002',
      pacienteNombre: 'Paciente Demo',
      pacienteCorreo: 'paciente@vidasalud.cl',
      centroSalud: 'Clínica Dental Valparaíso',
      prestacionId: 'PREST-02',
      prestacionNombre: 'Evaluación y Limpieza Dental',
      box: 'Box Dental 201',
      fecha: '2026-11-26',
      hora: '15:30',
      estado: 'SOLICITADA',
      motivo: 'Revisión dental semestral',
      creadaEn: '2026-11-22 18:15:00'
    }
  ];

  constructor() {
    this.inicializarStorage();
  }

  private obtenerFechaHoraDispositivo(): string {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');

    return `${anio}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
  }

  private inicializarStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!localStorage.getItem(this.KEY_CATALOGO)) {
      localStorage.setItem(this.KEY_CATALOGO, JSON.stringify(this.prestacionesIniciales));
    }
    if (!localStorage.getItem(this.KEY_ATENCIONES)) {
      localStorage.setItem(this.KEY_ATENCIONES, JSON.stringify(this.atencionesIniciales));
    }
    if (!localStorage.getItem(this.KEY_AUDITORIA)) {
      const eventosBase: EventoAuditoria[] = [
        {
          id: 'AUD-01',
          atencionId: 'ATN-1001',
          accion: 'Confirmación de atención y reserva de cupo',
          estadoNuevo: 'CONFIRMADA',
          usuario: 'recepcionista@vidasalud.cl',
          rol: 'Recepcionista',
          fechaHora: '2026-11-22 10:05:00',
          detalle: 'Box 101 asignado · Cola q.cmd.email despachada'
        }
      ];
      localStorage.setItem(this.KEY_AUDITORIA, JSON.stringify(eventosBase));
    }
  }

  obtenerPrestaciones(): PrestacionCatalogo[] {
    if (!isPlatformBrowser(this.platformId)) return this.prestacionesIniciales;
    const raw = localStorage.getItem(this.KEY_CATALOGO);
    return raw ? JSON.parse(raw) : this.prestacionesIniciales;
  }

  crearPrestacion(datos: Omit<PrestacionCatalogo, 'id'>): PrestacionCatalogo {
    const prestaciones = this.obtenerPrestaciones();
    const nuevoNumero = String(prestaciones.length + 1).padStart(2, '0');
    const nueva: PrestacionCatalogo = {
      id: `PREST-${nuevoNumero}`,
      ...datos
    };

    const actualizadas = [...prestaciones, nueva];
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.KEY_CATALOGO, JSON.stringify(actualizadas));
    }

    return nueva;
  }

  actualizarPrestacion(id: string, cambios: { precio: number; cuposDisponibles: number; box: string }): void {
    const prestaciones = this.obtenerPrestaciones();
    const idx = prestaciones.findIndex((p) => p.id === id);
    if (idx === -1) return;

    prestaciones[idx] = {
      ...prestaciones[idx],
      precio: cambios.precio,
      cuposDisponibles: cambios.cuposDisponibles,
      box: cambios.box
    };

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.KEY_CATALOGO, JSON.stringify(prestaciones));
    }
  }

  obtenerAtenciones(): Atencion[] {
    if (!isPlatformBrowser(this.platformId)) return this.atencionesIniciales;
    const raw = localStorage.getItem(this.KEY_ATENCIONES);
    return raw ? JSON.parse(raw) : this.atencionesIniciales;
  }

  obtenerAtencionesPaciente(correo: string): Atencion[] {
    const todas = this.obtenerAtenciones();
    return todas.filter(
      (a) => a.pacienteCorreo.toLowerCase() === correo.toLowerCase() || a.pacienteCorreo === 'paciente@vidasalud.cl'
    );
  }

  crearAtencion(datos: {
    pacienteNombre: string;
    pacienteCorreo: string;
    centroSalud: string;
    prestacionId: string;
    fecha: string;
    hora: string;
    motivo: string;
    rolCreador: string;
  }): Atencion {
    const prestaciones = this.obtenerPrestaciones();
    const prestacion = prestaciones.find((p) => p.id === datos.prestacionId) || prestaciones[0];
    const atenciones = this.obtenerAtenciones();

    const nuevoNumero = 1001 + atenciones.length;
    const ahora = this.obtenerFechaHoraDispositivo();

    const nuevaAtencion: Atencion = {
      id: `ATN-${nuevoNumero}`,
      pacienteNombre: datos.pacienteNombre,
      pacienteCorreo: datos.pacienteCorreo,
      centroSalud: datos.centroSalud,
      prestacionId: prestacion.id,
      prestacionNombre: prestacion.nombre,
      box: prestacion.box,
      fecha: datos.fecha,
      hora: datos.hora,
      estado: 'SOLICITADA',
      motivo: datos.motivo.trim() || 'Consulta agendada vía web',
      creadaEn: ahora
    };

    const actualizadas = [nuevaAtencion, ...atenciones];
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.KEY_ATENCIONES, JSON.stringify(actualizadas));
    }

    this.registrarAuditoria({
      atencionId: nuevaAtencion.id,
      accion: 'Solicitud de atención registrada',
      estadoNuevo: 'SOLICITADA',
      usuario: datos.pacienteCorreo,
      rol: datos.rolCreador,
      detalle: `${nuevaAtencion.prestacionNombre} - ${nuevaAtencion.centroSalud}`
    });

    return nuevaAtencion;
  }

  cambiarEstado(
    id: string,
    nuevoEstado: EstadoAtencion,
    usuario: string,
    rol: string
  ): { ok: boolean; mensaje?: string; ticket?: TicketAdmision } {
    const atenciones = this.obtenerAtenciones();
    const indice = atenciones.findIndex((a) => a.id === id);

    if (indice === -1) {
      return { ok: false, mensaje: 'Atención no encontrada.' };
    }

    const actual = atenciones[indice];

    // Regla del caso: No se puede pasar a EN_ATENCIÓN sin CONFIRMAR previamente
    if (nuevoEstado === 'EN_ATENCIÓN' && actual.estado === 'SOLICITADA') {
      return {
        ok: false,
        mensaje: 'Regla de negocio: No se puede pasar a EN_ATENCIÓN sin CONFIRMAR primero.'
      };
    }

    // Regla del caso: El cupo del box disminuye al confirmar la atención
    if (nuevoEstado === 'CONFIRMADA' && actual.estado !== 'CONFIRMADA') {
      const prestaciones = this.obtenerPrestaciones();
      const idxPrest = prestaciones.findIndex((p) => p.id === actual.prestacionId);
      if (idxPrest !== -1 && prestaciones[idxPrest].cuposDisponibles > 0) {
        prestaciones[idxPrest].cuposDisponibles -= 1;
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.KEY_CATALOGO, JSON.stringify(prestaciones));
        }
      }
    }

    atenciones[indice] = { ...actual, estado: nuevoEstado };

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.KEY_ATENCIONES, JSON.stringify(atenciones));
    }

    const ahora = this.obtenerFechaHoraDispositivo();
    let ticketEmitido: TicketAdmision | undefined;
    let detalleAuditoria = `Estado anterior: ${actual.estado}`;

    if (nuevoEstado === 'CONFIRMADA') {
      ticketEmitido = {
        codigoTicket: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        atencionId: actual.id,
        pacienteCorreo: actual.pacienteCorreo,
        prestacionNombre: actual.prestacionNombre,
        centroSalud: actual.centroSalud,
        box: actual.box,
        colaDestino: 'q.cmd.email (email.send)',
        mensajeNotificacion: `Notificación de confirmación enviada a ${actual.pacienteCorreo} y cupo descontado en ${actual.box}.`,
        emitidoEn: ahora
      };
      detalleAuditoria += ` · Cola ${ticketEmitido.colaDestino}`;
    } else if (nuevoEstado === 'EN_ATENCIÓN') {
      ticketEmitido = {
        codigoTicket: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
        atencionId: actual.id,
        pacienteCorreo: actual.pacienteCorreo,
        prestacionNombre: actual.prestacionNombre,
        centroSalud: actual.centroSalud,
        box: actual.box,
        colaDestino: 'q.cmd.admission (admission.ticket)',
        mensajeNotificacion: `Ticket de admisión emitido hacia ${actual.box} y llamado enviado al paciente.`,
        emitidoEn: ahora
      };
      detalleAuditoria += ` · Ticket ${ticketEmitido.codigoTicket} (${ticketEmitido.colaDestino})`;
    }

    this.registrarAuditoria({
      atencionId: id,
      accion: `Cambio de estado a ${nuevoEstado}`,
      estadoNuevo: nuevoEstado,
      usuario,
      rol,
      detalle: detalleAuditoria
    });

    return { ok: true, ticket: ticketEmitido };
  }

  obtenerAuditoria(): EventoAuditoria[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    const raw = localStorage.getItem(this.KEY_AUDITORIA);
    return raw ? JSON.parse(raw) : [];
  }

  private registrarAuditoria(evento: Omit<EventoAuditoria, 'id' | 'fechaHora'>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = localStorage.getItem(this.KEY_AUDITORIA);
    const lista: EventoAuditoria[] = raw ? JSON.parse(raw) : [];
    const ahora = this.obtenerFechaHoraDispositivo();

    lista.unshift({
      id: `AUD-${100 + lista.length + 1}`,
      fechaHora: ahora,
      ...evento
    });

    localStorage.setItem(this.KEY_AUDITORIA, JSON.stringify(lista));
  }
}