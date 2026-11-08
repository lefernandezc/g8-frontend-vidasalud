import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { PublicClientApplication, InteractionType, IPublicClientApplication } from '@azure/msal-browser';
import { 
  MsalService, MsalGuard, MsalInterceptor, MsalBroadcastService,
  MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration, MsalInterceptorConfiguration 
} from '@azure/msal-angular'; 

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '80f572d7-3e08-42e5-ae26-4351cb3f0700',
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: 'http://localhost:4200/dashboard'
    },
    cache: { cacheLocation: 'localStorage' }
  });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: { scopes: ['user.read'] }
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map([
      ['https://graph.microsoft.com/v1.0/me', ['user.read']]
    ])
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory },
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};
