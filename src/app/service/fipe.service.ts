import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MarcaFipe, ModeloFipe } from '../models/fipe.model';

@Injectable({
  providedIn: 'root',
})
export class FipeService {
  private api = 'http://localhost:8081/fipe';

  constructor(private http: HttpClient) {}

  listarMarcas(): Observable<MarcaFipe[]> {
    return this.http.get<MarcaFipe[]>(`${this.api}/marcas`);
  }

  listarModelos(marcaId: string): Observable<ModeloFipe[]> {
    return this.http.get<ModeloFipe[]>(`${this.api}/modelos/${marcaId}`);
  }
}
