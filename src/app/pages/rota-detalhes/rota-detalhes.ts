import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Veiculo } from '../../models/veiculos.model';
import { VeiculoService } from '../../service/veiculo.service';

import { Demanda } from '../../models/demandas.model';
import { DemandasService } from '../../service/demandas.service';

import { RotasService } from '../../service/rotas.service';

@Component({
  selector: 'app-rota-detalhes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rota-detalhes.html',
  styleUrl: './rota-detalhes.css',
})
export class RotaDetalhes implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rotasService: RotasService,
    private cdr: ChangeDetectorRef,
    private veiculoService: VeiculoService,
    private demandasService: DemandasService
  ) {}

  rota: any = null;
  demandasDaRota: any[] = [];

  carregando = true;
  erroCarregamento = '';

  veiculos: Veiculo[] = [];

  modalIniciarAberto = false;
  veiculoSelecionadoId: number | null = null;
  kmInicialInformado: number | null = null;

  modalDemandasAberto = false;
  demandasPendentes: Demanda[] = [];
  demandasPendentesFiltradas: Demanda[] = [];
  demandaSelecionada: Demanda | null = null;

  termoBuscaDemandas = '';

  ngOnInit(): void {
    const rotaId = Number(this.route.snapshot.paramMap.get('id'));

    if (!rotaId) {
      this.router.navigate(['/rotas']);
      return;
    }

    this.carregarRota(rotaId);
    this.carregarVeiculos();
    this.carregarDemandasDaRota(rotaId);
  }

  carregarRota(id: number): void {
    this.rotasService.buscarPorId(id).subscribe({
      next: (dados) => {
        this.rota = dados;
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.erroCarregamento = 'Erro ao carregar rota.';
        this.carregando = false;
        this.cdr.detectChanges();
      },
    });
  }

  carregarDemandasDaRota(id: number): void {
    this.rotasService.listarDemandasDaRota(id).subscribe({
      next: (dados) => {
        this.demandasDaRota = dados;
        this.cdr.detectChanges();
      },
      error: () => {
        this.demandasDaRota = [];
        this.cdr.detectChanges();
      },
    });
  }

  carregarVeiculos(): void {
    this.veiculoService.listar().subscribe({
      next: (dados) => {
        this.veiculos = dados.filter((veiculo) => veiculo.statusVeiculo === true);
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Erro ao carregar veículos');
      },
    });
  }

  abrirModalDemandas(): void {
    this.modalDemandasAberto = true;
    this.termoBuscaDemandas = '';
    this.demandaSelecionada = null;
    this.carregarDemandasPendentes();
  }

  fecharModalDemandas(): void {
    this.modalDemandasAberto = false;
    this.demandaSelecionada = null;
    this.termoBuscaDemandas = '';
    this.cdr.detectChanges();
  }

  carregarDemandasPendentes(): void {
    this.demandasService.listarPendentes().subscribe({
      next: (dados) => {
        this.demandasPendentes = dados.sort(
          (a, b) =>
            new Date(a.dataHoraCriacao).getTime() -
            new Date(b.dataHoraCriacao).getTime()
        );

        this.aplicarFiltroDemandasPendentes();
      },
      error: () => {
        alert('Erro ao carregar demandas pendentes');
      },
    });
  }

  aplicarFiltroDemandasPendentes(): void {
    const busca = this.termoBuscaDemandas.trim().toLowerCase();

    let lista = [...this.demandasPendentes];

    if (busca) {
      lista = lista.filter((demanda) => {
        const tipo = demanda.tipo?.tipoDemanda?.toLowerCase() || '';
        const local = demanda.local?.nomeLocal?.toLowerCase() || '';
        const cidade = demanda.local?.cidade?.toLowerCase() || '';
        const endereco = demanda.local?.endereco?.toLowerCase() || '';
        const solicitante = demanda.solicitante?.nome?.toLowerCase() || '';
        const observacoes = demanda.observacoes?.toLowerCase() || '';

        return (
          tipo.includes(busca) ||
          local.includes(busca) ||
          cidade.includes(busca) ||
          endereco.includes(busca) ||
          solicitante.includes(busca) ||
          observacoes.includes(busca)
        );
      });
    }

    this.demandasPendentesFiltradas = lista;
    this.cdr.detectChanges();
  }

  abrirDetalhesDemanda(demanda: Demanda): void {
    this.demandaSelecionada = demanda;
    this.cdr.detectChanges();
  }

  fecharDetalhesDemanda(): void {
    this.demandaSelecionada = null;
    this.cdr.detectChanges();
  }

  adicionarDemandaNaRota(demanda: Demanda): void {
    if (!this.rota?.id || !demanda.id) {
      alert('Rota ou demanda não identificada');
      return;
    }

    this.rotasService.adicionarDemanda(this.rota.id, demanda.id).subscribe({
      next: () => {
        this.carregarDemandasDaRota(this.rota.id);
        this.carregarDemandasPendentes();
        this.demandaSelecionada = null;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Erro ao adicionar demanda à rota');
      },
    });
  }

  removerDemanda(item: any): void {
    if (!this.rota?.id || !item?.demanda?.id) return;

    const confirmar = confirm('Remover esta demanda da rota?');

    if (!confirmar) return;

    this.rotasService.removerDemanda(this.rota.id, item.demanda.id).subscribe({
      next: () => {
        this.carregarDemandasDaRota(this.rota.id);
      },
      error: () => {
        alert('Erro ao remover demanda da rota');
      },
    });
  }

  abrirModalIniciar(): void {
    this.veiculoSelecionadoId = null;
    this.kmInicialInformado = null;
    this.modalIniciarAberto = true;
    this.cdr.detectChanges();
  }

  fecharModalIniciar(): void {
    this.modalIniciarAberto = false;
    this.veiculoSelecionadoId = null;
    this.kmInicialInformado = null;
    this.cdr.detectChanges();
  }

  iniciarRota(): void {
    if (!this.rota?.id) {
      alert('Rota não identificada');
      return;
    }

    if (!this.veiculoSelecionadoId) {
      alert('Selecione um veículo');
      return;
    }

    if (this.kmInicialInformado === null || this.kmInicialInformado < 0) {
      alert('Informe um KM inicial válido');
      return;
    }

    this.rotasService
      .iniciarRota(this.rota.id, {
        veiculoId: this.veiculoSelecionadoId,
        kmInicial: this.kmInicialInformado,
      })
      .subscribe({
        next: (rotaAtualizada) => {
          this.rota = rotaAtualizada;
          this.fecharModalIniciar();
          alert('Rota iniciada com sucesso!');
          this.cdr.detectChanges();
        },
        error: () => {
          alert('Erro ao iniciar rota');
        },
      });
  }

  irParaRotas(): void {
    this.router.navigate(['/rotas']);
  }

  irParaDemandas(): void {
    this.router.navigate(['/demandas']);
  }

  textoStatusDemanda(status: string): string {
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

  textoStatusRota(status: string): string {
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

  pausarRota(): void {
    if (!this.rota?.id) {
      alert('Rota não identificada');
      return;
    }

    this.rotasService.pausarRota(this.rota.id).subscribe({
      next: (rotaAtualizada) => {
        this.rota = rotaAtualizada;
        alert('Rota pausada com sucesso!');
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Erro ao pausar rota');
      },
    });
  }

  retomarRota(): void {
    if (!this.rota?.id) {
      alert('Rota não identificada');
      return;
    }

    this.rotasService.retomarRota(this.rota.id).subscribe({
      next: (rotaAtualizada) => {
        this.rota = rotaAtualizada;
        alert('Rota retomada com sucesso!');
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Erro ao retomar rota');
      },
    });
  }

  podeAlterarDemandas(): boolean {
    return this.rota?.status === 'PROGRAMADA' || this.rota?.status === 'PAUSADA';
  }
}
