import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RotaRequest {
  nomeRota: string;
  dataExecucao: string;
  executorId: number;
  veiculoId?: number | null;
  kmInicial?: number | null;
  descricaoRota?: string;
}

export interface IniciarRotaRequest {
  veiculoId: number;
  kmInicial: number;
}

@Injectable({
  providedIn: 'root',
})
export class RotasService {
  private api = 'http://localhost:8081/rotas';

  constructor(private http: HttpClient) {}

  criar(rota: RotaRequest): Observable<any> {
    return this.http.post<any>(this.api, rota);
  }

  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.api);
  }

  listarPorExecutor(executorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/executor/${executorId}`);
  }

  buscarPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  listarDemandasDaRota(rotaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${rotaId}/demandas`);
  }

  adicionarDemanda(rotaId: number, demandaId: number): Observable<any> {
    return this.http.post<any>(`${this.api}/${rotaId}/demandas/${demandaId}`, {});
  }

  removerDemanda(rotaId: number, demandaId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${rotaId}/demandas/${demandaId}`);
  }

  iniciarRota(rotaId: number, dados: IniciarRotaRequest): Observable<any> {
    return this.http.put<any>(`${this.api}/${rotaId}/iniciar`, dados);
  }

  pausarRota(rotaId: number): Observable<any> {
    return this.http.put<any>(`${this.api}/${rotaId}/pausar`, {});
  }

  retomarRota(rotaId: number): Observable<any> {
    return this.http.put<any>(`${this.api}/${rotaId}/retomar`, {});
  }


}
