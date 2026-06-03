import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { DemandasService } from '../../service/demandas.service';
import { Demanda } from '../../models/demandas.model';

type Perfil = 'SOLICITANTE' | 'EXECUTOR' | 'ADMINISTRADOR';

interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  atribuicao: Perfil;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  constructor(
    private router: Router,
    private demandasService: DemandasService,
    private cdr: ChangeDetectorRef
  ) {}

  usuarioLogado: UsuarioLogado | null = null;

  demandas: Demanda[] = [];
  demandasDashboard: Demanda[] = [];

  mensagemVazia = '';

  ngOnInit(): void {
    this.carregarUsuarioLogado();
    this.carregarDemandasDashboard();
  }

  carregarUsuarioLogado(): void {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');

    if (!usuarioSalvo) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuarioLogado = JSON.parse(usuarioSalvo);
  }

  carregarDemandasDashboard(): void {
    this.demandasService.listar().subscribe({
      next: (dados) => {
        this.demandas = dados;
        this.filtrarDemandasPorPerfil();
        this.cdr.detectChanges();
      },
      error: () => {
        this.demandasDashboard = [];
        this.mensagemVazia = 'Erro ao carregar demandas.';
        this.cdr.detectChanges();
      },
    });
  }

  filtrarDemandasPorPerfil(): void {
    if (!this.usuarioLogado) {
      this.demandasDashboard = [];
      this.mensagemVazia = 'Usuário não identificado.';
      return;
    }

    if (this.ehAdministrador()) {
      this.demandasDashboard = [...this.demandas];
      this.mensagemVazia = 'Nenhuma demanda cadastrada no sistema.';
      return;
    }

    if (this.ehSolicitante()) {
      this.demandasDashboard = this.demandas.filter(
        (demanda) => Number(demanda.solicitante?.id) === Number(this.usuarioLogado?.id)
      );

      this.mensagemVazia = 'Você ainda não possui demandas cadastradas.';
      return;
    }

    if (this.ehExecutor()) {
      this.demandasDashboard = this.demandas.filter(
        (demanda) => demanda.status === 'PENDENTE'
      );

      this.mensagemVazia = 'Não há demandas pendentes no momento.';
      return;
    }

    this.demandasDashboard = [];
    this.mensagemVazia = 'Perfil não reconhecido.';
  }

  abrirDemanda(demanda: Demanda): void {
    if (!demanda.id) return;

    this.router.navigate(['/demandas'], {
      queryParams: { demandaId: demanda.id },
    });
  }

  irParaUsuarios(): void {
    this.router.navigate(['/usuarios']);
  }

  irParaTiposDemandas(): void {
    this.router.navigate(['/tipos-demandas']);
  }

  irParaVeiculos(): void {
    this.router.navigate(['/veiculos']);
  }

  irParaLocal(): void {
    this.router.navigate(['/locais']);
  }

  irParaDemandas(): void {
    this.router.navigate(['/demandas']);
  }

  criarNovaDemanda(): void {
    this.router.navigate(['/demandas']);
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  ehAdministrador(): boolean {
    return this.usuarioLogado?.atribuicao === 'ADMINISTRADOR';
  }

  ehSolicitante(): boolean {
    return this.usuarioLogado?.atribuicao === 'SOLICITANTE';
  }

  ehExecutor(): boolean {
    return this.usuarioLogado?.atribuicao === 'EXECUTOR';
  }

  textoPerfil(): string {
    if (this.ehAdministrador()) return 'Administrador';
    if (this.ehSolicitante()) return 'Solicitante';
    if (this.ehExecutor()) return 'Executor';
    return 'Usuário';
  }

  textoStatus(status: string): string {
    switch (status) {
      case 'PENDENTE':
        return 'Pendente';
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

  irParaRotas(): void {
    this.router.navigate(['/rotas']);
  }
}
