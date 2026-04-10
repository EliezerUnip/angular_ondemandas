import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TipoDemanda,
  TipoDemandaRequest,
} from '../models/tipos-demandas.model';

@Injectable({
  providedIn: 'root',
})
export class TipoDemandasService {
  private api = 'http://localhost:8081/tipo-demandas';

  constructor(private http: HttpClient) {}

  listar(): Observable<TipoDemanda[]> {
    return this.http.get<TipoDemanda[]>(this.api);
  }

  buscarPorId(id: number): Observable<TipoDemanda> {
    return this.http.get<TipoDemanda>(`${this.api}/${id}`);
  }

  criar(tipo: TipoDemandaRequest): Observable<TipoDemanda> {
    return this.http.post<TipoDemanda>(this.api, tipo);
  }

  atualizar(id: number, tipo: TipoDemandaRequest): Observable<TipoDemanda> {
    return this.http.put<TipoDemanda>(`${this.api}/${id}`, tipo);
  }
}
