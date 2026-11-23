import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, type Event } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus, AuthenticationResult } from '@azure/msal-browser';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(MsalService);
  private msalBroadcastService = inject(MsalBroadcastService);
  private platformId = inject(PLATFORM_ID);
  private readonly destroying$ = new Subject<void>();

  esLogin = false;
  menuUsuarioAbierto = false;

  nombreUsuario = 'Paciente';
  correoUsuario = 'paciente@vidasalud.cl';
  inicialUsuario = 'P';

  // Control de roles
  rolesDisponibles = ['Paciente', 'Recepcionista', 'Admin', 'Auditor'];
  rolUsuario = 'Paciente';
  mostrandoCambioRol = false;
  rolSeleccionado = 'Paciente';
  claveRol = '';
  errorClaveRol = '';

  ngOnInit(): void {
    this.verificarRuta(this.router.url);

    this.router.events
      .pipe(
        filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroying$)
      )
      .subscribe((event: NavigationEnd) => {
        this.verificarRuta(event.urlAfterRedirects);
        this.cerrarMenuUsuario();
      });

    if (isPlatformBrowser(this.platformId)) {
      const rolGuardado = localStorage.getItem('vidasalud_rol_simulado');
      if (rolGuardado && this.rolesDisponibles.includes(rolGuardado)) {
        this.rolUsuario = rolGuardado;
        this.rolSeleccionado = rolGuardado;
      }
      this.aplicarIdentidadRol(this.rolUsuario);

      this.cargarDatosUsuario();

      this.authService.handleRedirectObservable()
        .pipe(takeUntil(this.destroying$))
        .subscribe((result: AuthenticationResult | null) => {
          if (result?.account) {
            this.authService.instance.setActiveAccount(result.account);
            this.cargarDatosUsuario();
            this.router.navigate(['/dashboard']);
          }
        });

      this.msalBroadcastService.inProgress$
        .pipe(
          filter((status: InteractionStatus) => status === InteractionStatus.None),
          takeUntil(this.destroying$)
        )
        .subscribe(() => {
          this.cargarDatosUsuario();
        });
    }
  }

  private verificarRuta(url: string): void {
    const rutaLimpia = url.split('?')[0].split('#')[0];
    this.esLogin = rutaLimpia === '/' || rutaLimpia === '/login';
  }

  private aplicarIdentidadRol(rol: string): void {
    const rolNormalizado = rol.toLowerCase();
    this.correoUsuario = `${rolNormalizado}@vidasalud.cl`;
    this.nombreUsuario = rol;
    this.inicialUsuario = rol === 'Admin' ? 'AD' : rol.charAt(0).toUpperCase();
  }

  cargarDatosUsuario(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const cuentas = this.authService.instance.getAllAccounts();
    const cuenta = this.authService.instance.getActiveAccount() || cuentas[0];

    if (cuenta) {
      this.authService.instance.setActiveAccount(cuenta);

      const rolGuardado = localStorage.getItem('vidasalud_rol_simulado');
      if (rolGuardado && this.rolesDisponibles.includes(rolGuardado)) {
        this.rolUsuario = rolGuardado;
      } else {
        const claims = cuenta.idTokenClaims as { roles?: string[] } | undefined;
        this.rolUsuario = claims?.roles && claims.roles.length > 0
          ? claims.roles[0]
          : 'Paciente';
      }

      this.rolSeleccionado = this.rolUsuario;
      this.aplicarIdentidadRol(this.rolUsuario);

      if (this.esLogin) {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  // Permisos de navegación por rol
  get puedeVerAtenciones(): boolean {
    return ['Paciente', 'Recepcionista', 'Admin'].includes(this.rolUsuario);
  }

  get puedeVerCatalogo(): boolean {
    return ['Recepcionista', 'Admin'].includes(this.rolUsuario);
  }

  get puedeVerReporteria(): boolean {
    return this.rolUsuario === 'Admin';
  }

  get puedeVerAuditoria(): boolean {
    return ['Auditor', 'Admin'].includes(this.rolUsuario);
  }

  toggleMenuUsuario(): void {
    this.menuUsuarioAbierto = !this.menuUsuarioAbierto;
    if (!this.menuUsuarioAbierto) {
      this.cancelarCambioRol();
    }
  }

  cerrarMenuUsuario(): void {
    this.menuUsuarioAbierto = false;
    this.cancelarCambioRol();
  }

  abrirCambioRol(): void {
    this.mostrandoCambioRol = true;
    this.rolSeleccionado = this.rolUsuario;
    this.claveRol = '';
    this.errorClaveRol = '';
  }

  cancelarCambioRol(): void {
    this.mostrandoCambioRol = false;
    this.claveRol = '';
    this.errorClaveRol = '';
  }

  seleccionarRol(nuevoRol: string): void {
    this.rolSeleccionado = nuevoRol;
    this.errorClaveRol = '';
  }

  actualizarClave(valor: string): void {
    this.claveRol = valor;
    this.errorClaveRol = '';
  }

  confirmarCambioRol(): void {
    const claveEsperada = `${this.rolSeleccionado.toLowerCase()}123`;

    if (this.claveRol.trim().toLowerCase() !== claveEsperada) {
      this.errorClaveRol = `Clave incorrecta. Usa: ${this.rolSeleccionado.toLowerCase()}123`;
      return;
    }

    this.rolUsuario = this.rolSeleccionado;
    this.aplicarIdentidadRol(this.rolUsuario);
    this.cancelarCambioRol();

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('vidasalud_rol_simulado', this.rolUsuario);
      window.dispatchEvent(new Event('vidasalud-rol-cambiado'));
    }

    this.validarRutaSegunRol();
  }

  private validarRutaSegunRol(): void {
    const rutaActual = this.router.url.split('?')[0];
    if (
      (rutaActual === '/atenciones' && !this.puedeVerAtenciones) ||
      (rutaActual === '/catalogo-prestaciones' && !this.puedeVerCatalogo) ||
      (rutaActual === '/reporteria' && !this.puedeVerReporteria) ||
      (rutaActual === '/auditoria' && !this.puedeVerAuditoria)
    ) {
      this.router.navigate(['/dashboard']);
    }
  }

  cerrarSesion(): void {
    this.cerrarMenuUsuario();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('vidasalud_rol_simulado');
      this.authService.logoutRedirect({
        postLogoutRedirectUri: 'http://localhost:4200/'
      });
    }
  }

  ngOnDestroy(): void {
    this.destroying$.next(undefined);
    this.destroying$.complete();
  }
}