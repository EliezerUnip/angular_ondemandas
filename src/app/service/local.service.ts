import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Local } from '../models/local.model'

@Injectable({
  providedIn: 'root',
})
export class LocalService {
  private api = 'http://localhost:8081/locais';

  constructor(private http: HttpClient) {}

  listar(): Observable<Local[]> {
    return this.http.get<Local[]>(this.api);
  }

  buscarPorId(id: number): Observable<Local> {
    return this.http.get<Local>(`${this.api}/${id}`);
  }

  criar(local: Local): Observable<Local> {
    return this.http.post<Local>(this.api, local);
  }

  atualizar(id: number, local: Local): Observable<Local> {
    return this.http.put<Local>(`${this.api}/${id}`, local);
  }
}
