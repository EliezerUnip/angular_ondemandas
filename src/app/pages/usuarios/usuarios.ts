import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Usuario, Atribuicao } from '../../models/usuarios.model';
import { UsuarioService } from '../../service/usuario.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
  ) {}

  modalAberto = false;

  Atribuicao = Atribuicao;

  usuarios: Usuario[] = [];

  novoUsuario: Usuario = {
    nome: '',
    email: '',
    telefone: '',
    atribuicao: Atribuicao.SOLICITANTE,
  };

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  irParaHome() {
    this.router.navigate(['/home']);
  }

  abrirModalCriarUsuario() {
    this.modalAberto = true;
  }

  fecharModalCriarUsuario() {
    this.modalAberto = false;
  }

  carregarUsuarios() {
    this.usuarioService.listar().subscribe({
      next: (dados) => {
        this.usuarios = dados;
      },
      error: () => {
        alert('Erro ao carregar usuários');
      },
    });
  }

  criarUsuario() {
    this.usuarioService.criar(this.novoUsuario).subscribe({
      next: () => {
        alert('Usuário criado com sucesso! ✅');

        this.carregarUsuarios();

        this.novoUsuario = {
          nome: '',
          email: '',
          telefone: '',
          atribuicao: Atribuicao.SOLICITANTE,
        };

        this.modalAberto = false;
      },
      error: () => {
        alert('Erro ao criar usuário ❌');
      },
    });
  }
}
