import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Demanda, DemandaRequest } from '../models/demandas.model';

@Injectable({
  providedIn: 'root',
})
export class DemandasService {
  private api = 'http://localhost:8081/demandas';

  constructor(private http: HttpClient) {}

  listar(): Observable<Demanda[]> {
    return this.http.get<Demanda[]>(this.api);
  }

  buscarPorId(id: number): Observable<Demanda> {
    return this.http.get<Demanda>(`${this.api}/${id}`);
  }

  criar(demanda: DemandaRequest): Observable<Demanda> {
    return this.http.post<Demanda>(this.api, demanda);
  }

  listarPendentes(): Observable<Demanda[]> {
    return this.http.get<Demanda[]>(`${this.api}/pendentes`);
  }

  listarPorSolicitante(solicitanteId: number): Observable<Demanda[]> {
    return this.http.get<Demanda[]>(`${this.api}/solicitante/${solicitanteId}`);
  }

  listarPorExecutor(executorId: number): Observable<Demanda[]> {
    return this.http.get<Demanda[]>(`${this.api}/executor/${executorId}`);
  }

  captar(demandaId: number, executorId: number): Observable<Demanda> {
    return this.http.put<Demanda>(
      `${this.api}/${demandaId}/captar/${executorId}`,
      {}
    );
  }

  concluir(demandaId: number): Observable<Demanda> {
    return this.http.put<Demanda>(`${this.api}/${demandaId}/concluir`, {});
  }

  cancelar(demandaId: number): Observable<Demanda> {
    return this.http.put<Demanda>(`${this.api}/${demandaId}/cancelar`, {});
  }
}
