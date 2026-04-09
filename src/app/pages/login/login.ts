import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email: string = '';
  senha: string = '';
  dominio: string = '';

  private dominioValido: string = '@unipar.com.br';

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}

  fazerLogin() {
    // 🔴 valida domínio
    if (!this.dominio || this.dominio !== this.dominioValido) {
      alert('Domínio incorreto ou não autorizado');
      return;
    }

    // 🔴 valida campos vazios
    if (!this.email || !this.senha) {
      alert('Preencha email e senha');
      return;
    }

    // 🚀 chamada para backend
    this.http
      .post('http://localhost:8081/auth/login', {
        email: this.email,
        senha: this.senha,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: () => {
          alert('Login inválido');
        },
      });
  }
}
