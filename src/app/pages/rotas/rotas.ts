import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { RotasService, RotaRequest } from '../../service/rotas.service';

type Perfil = 'SOLICITANTE' | 'EXECUTOR' | 'ADMINISTRADOR';

interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  atribuicao: Perfil;
}

@Component({
  selector: 'app-rotas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rotas.html',
  styleUrl: './rotas.css',
})
export class Rotas implements OnInit {
  constructor(
    private router: Router,
    private rotasService: RotasService,
    private cdr: ChangeDetectorRef
  ) {}

  usuarioLogado: UsuarioLogado | null = null;
  rotas: any[] = [];

  modalCriarAberto = false;

  novaRota: RotaRequest = {
    nomeRota: '',
    dataExecucao: '',
    executorId: 0,
    veiculoId: null,
    kmInicial: null,
    descricaoRota: '',
  };

  ngOnInit(): void {
    const carregouUsuario = this.carregarUsuarioLogado();

    if (carregouUsuario) {
      this.carregarRotas();
    }
  }

  carregarUsuarioLogado(): boolean {
    const usuarioSalvo = sessionStorage.getItem('usuarioLogado');

    if (!usuarioSalvo) {
      this.router.navigate(['/login']);
      return false;
    }

    this.usuarioLogado = JSON.parse(usuarioSalvo);
    return true;
  }

  carregarRotas(): void {
    if (!this.usuarioLogado?.id) return;

    if (this.usuarioLogado.atribuicao === 'ADMINISTRADOR') {
      this.rotasService.listar().subscribe({
        next: (dados) => {
          this.rotas = dados;
          this.cdr.detectChanges();
        },
        error: () => {
          alert('Erro ao carregar rotas');
        },
      });

      return;
    }

    this.rotasService.listarPorExecutor(this.usuarioLogado.id).subscribe({
      next: (dados) => {
        this.rotas = dados;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Erro ao carregar rotas do executor');
      },
    });
  }

  abrirModalCriar(): void {
    if (!this.usuarioLogado?.id) return;

    this.novaRota = {
      nomeRota: '',
      dataExecucao: '',
      executorId: this.usuarioLogado.id,
      veiculoId: null,
      kmInicial: null,
      descricaoRota: '',
    };

    this.modalCriarAberto = true;
    this.cdr.detectChanges();
  }

  fecharModalCriar(): void {
    this.modalCriarAberto = false;
    this.cdr.detectChanges();
  }

  criarRota(): void {
    if (!this.novaRota.nomeRota.trim()) {
      alert('Informe o nome da rota');
      return;
    }

    if (!this.novaRota.dataExecucao) {
      alert('Informe a data de execução');
      return;
    }

    this.rotasService.criar(this.novaRota).subscribe({
      next: () => {
        alert('Rota criada com sucesso!');
        this.fecharModalCriar();
        this.carregarRotas();
      },
      error: () => {
        alert('Erro ao criar rota');
      },
    });
  }

  abrirRota(rota: any): void {
    this.router.navigate(['/rotas', rota.id]);
  }

  irParaHome(): void {
    this.router.navigate(['/home']);
  }

  irParaDemandas(): void {
    this.router.navigate(['/demandas']);
  }

  textoStatus(status: string): string {
    switch (status) {
      case 'PROGRAMADA':
        return 'Programada';
      case 'EM_ANDAMENTO':
        return 'Em andamento';
      case 'CONCLUIDA':
        return 'Concluída';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return status;
    }
  }
}
