import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AtencionesService {
  private apiUrl = environment.apiUrlAtenciones;

  constructor(private http: HttpClient) {}

  obtenerAtenciones(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearAtencion(atencion: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, atencion);
  }
}