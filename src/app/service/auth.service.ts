import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private API = 'http://localhost:8080/auth';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(email: string, senha: string) {
    return this.http.post(`${this.API}/login`, { email, senha });
  }

  salvarSessao() {
    localStorage.setItem('logado', 'true');
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  estaLogado(): boolean {
    return localStorage.getItem('logado') === 'true';
  }
}
