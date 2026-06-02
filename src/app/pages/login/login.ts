import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  atribuicao: 'SOLICITANTE' | 'EXECUTOR' | 'ADMINISTRADOR';
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  senha = '';
  dominio = '';

  private dominioValido = '@unipar.com.br';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  fazerLogin(): void {
    if (!this.dominio || this.dominio !== this.dominioValido) {
      alert('Domínio incorreto ou não autorizado');
      return;
    }

    if (!this.email.trim() || !this.senha.trim()) {
      alert('Preencha email e senha');
      return;
    }

    this.http
      .post<UsuarioLogado>('http://localhost:8081/auth/login', {
        email: this.email.trim().toLowerCase(),
        senha: this.senha.trim(),
      })
      .subscribe({
        next: (usuario) => {
          localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
          this.redirecionarPorPerfil(usuario);
        },
        error: () => {
          alert('Login inválido');
        },
      });
  }

  private redirecionarPorPerfil(usuario: UsuarioLogado): void {

    if (
      usuario.atribuicao === 'ADMINISTRADOR' ||
      usuario.atribuicao === 'SOLICITANTE' ||
      usuario.atribuicao === 'EXECUTOR'
    ) {
      this.router.navigate(['/home']);
      return;
    }

    alert('Perfil de usuário não reconhecido');
    localStorage.removeItem('usuarioLogado');
    this.router.navigate(['/login']);
  }
}
