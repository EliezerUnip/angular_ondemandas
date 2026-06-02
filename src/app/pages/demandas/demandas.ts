import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Demanda, DemandaRequest, StatusDemanda } from '../../models/demandas.model';
import { TipoDemanda } from '../../models/tipos-demandas.model';
import { Local } from '../../models/local.model';
import { Usuario, Atribuicao } from '../../models/usuarios.model';

import { DemandasService } from '../../service/demandas.service';
import { TipoDemandasService } from '../../service/tipo-demandas.service';
import { LocalService } from '../../service/local.service';
import { UsuarioService } from '../../service/usuario.service';

@Component({
  selector: 'app-demandas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demandas.html',
  styleUrl: './demandas.css',
})
export class Demandas implements OnInit {
  constructor(
    private router: Router,
    private route:ActivatedRoute,
    private demandasService: DemandasService,
    private tipoDemandasService: TipoDemandasService,
    private localService: LocalService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

  demandas: Demanda[] = [];
  demandasFiltradas: Demanda[] = [];

  tiposDemandas: TipoDemanda[] = [];
  locais: Local[] = [];
  executores: Usuario[] = [];

  usuarioLogado: Usuario | null = null;
  demandaSelecionada: Demanda | null = null;
  demandaIdAbrirAutomaticamente: number | null = null;

  modalCriarAberto = false;
  modalDetalhesAberto = false;

  termoBusca = '';
  statusSelecionado: StatusDemanda | '' = '';
  menuFiltrosAberto = false;

  ordenacaoDataAtiva = false;
  ordenacaoTipoAtiva = false;
  agrupamentoStatusAtivo = false;

  executorSelecionadoId: number | null = null;

  mensagemSistema = '';
  tipoMensagem: 'sucesso' | 'erro' = 'sucesso';
  private timeoutMensagem: any;

  novaDemanda: DemandaRequest = this.criarDemandaVazia();

  ngOnInit(): void {
    this.carregarUsuarioLogado();

    this.route.queryParams.subscribe((params) => {
      if (params['demandaId']) {
        this.demandaIdAbrirAutomaticamente = Number(params['demandaId']);
      }
    });

    this.carregarDadosIniciais();
  }

  @HostListener('document:click', ['$event'])
  fecharFiltrosAoClicarFora(event: MouseEvent): void {
    const elementoClicado = event.target as HTMLElement;

    const menuFiltros = this.elementRef.nativeElement.querySelector(
      '.filter-menu-area'
    );

    if (!menuFiltros?.contains(elementoClicado)) {
      this.menuFiltrosAberto = false;
    }
  }

  irParaHome(): void {
    this.router.navigate(['/home']);
  }

  carregarUsuarioLogado(): void {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');

    if (!usuarioSalvo) {
      this.exibirMensagem('Usuário não identificado. Faça login novamente.', 'erro');
      this.router.navigate(['/login']);
      return;
    }

    this.usuarioLogado = JSON.parse(usuarioSalvo);
  }

  carregarDadosIniciais(): void {
    this.carregarDemandas();
    this.carregarTipos();
    this.carregarLocais();
    this.carregarUsuarios();
  }

  carregarDemandas(): void {
    this.demandasService.listar().subscribe({
      next: (dados) => {
        this.demandas = this.filtrarDemandasPorPerfil(dados);
        this.aplicarFiltros();

        if (this.demandaIdAbrirAutomaticamente) {
          const demanda = this.demandas.find(
            (item) => item.id === this.demandaIdAbrirAutomaticamente
          );

          if (demanda) {
            this.abrirModalDetalhes(demanda);
          }

          this.demandaIdAbrirAutomaticamente = null;

          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true,
          });
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.exibirMensagem('Erro ao carregar demandas.', 'erro');
      },
    });
  }

  filtrarDemandasPorPerfil(demandas: Demanda[]): Demanda[] {
    if (!this.usuarioLogado) return [];

    if (this.ehAdministrador()) {
      return demandas;
    }

    if (this.ehSolicitante()) {
      return demandas.filter(
        (demanda) => demanda.solicitante?.id === this.usuarioLogado?.id
      );
    }

    if (this.ehExecutor()) {
      return demandas.filter((demanda) => {
        const pendente = demanda.status === 'PENDENTE';
        const minhaDemanda = demanda.executor?.id === this.usuarioLogado?.id;

        return pendente || minhaDemanda;
      });
    }

    return [];
  }

  carregarTipos(): void {
    this.tipoDemandasService.listar().subscribe({
      next: (dados) => {
        this.tiposDemandas = dados.filter((tipo) => tipo.ativo === true);
        this.cdr.detectChanges();
      },
      error: () => {
        this.exibirMensagem('Erro ao carregar tipos de demanda.', 'erro');
      },
    });
  }

  carregarLocais(): void {
    this.localService.listar().subscribe({
      next: (dados) => {
        this.locais = dados.filter((local) => local.ativo === true);
        this.cdr.detectChanges();
      },
      error: () => {
        this.exibirMensagem('Erro ao carregar locais.', 'erro');
      },
    });
  }

  carregarUsuarios(): void {
    this.usuarioService.listar().subscribe({
      next: (dados) => {
        this.executores = dados.filter(
          (usuario) =>
            usuario.ativo === true &&
            usuario.atribuicao === Atribuicao.EXECUTOR
        );

        this.cdr.detectChanges();
      },
      error: () => {
        this.exibirMensagem('Erro ao carregar usuários.', 'erro');
      },
    });
  }

  alternarMenuFiltros(): void {
    this.menuFiltrosAberto = !this.menuFiltrosAberto;
  }

  ordenarPorData(): void {
    this.ordenacaoDataAtiva = !this.ordenacaoDataAtiva;

    if (this.ordenacaoDataAtiva) {
      this.ordenacaoTipoAtiva = false;
    }

    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  ordenarPorTipo(): void {
    this.ordenacaoTipoAtiva = !this.ordenacaoTipoAtiva;

    if (this.ordenacaoTipoAtiva) {
      this.ordenacaoDataAtiva = false;
    }

    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  agruparPorStatus(): void {
    this.agrupamentoStatusAtivo = !this.agrupamentoStatusAtivo;
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  filtrarPorStatus(): void {
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  limparFiltros(): void {
    this.termoBusca = '';
    this.statusSelecionado = '';
    this.ordenacaoDataAtiva = false;
    this.ordenacaoTipoAtiva = false;
    this.agrupamentoStatusAtivo = false;
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let lista = [...this.demandas];

    const busca = this.termoBusca.trim().toLowerCase();

    if (busca) {
      lista = lista.filter((demanda) => {
        const tipo = demanda.tipo?.tipoDemanda?.toLowerCase() || '';
        const local = demanda.local?.nomeLocal?.toLowerCase() || '';
        const cidade = demanda.local?.cidade?.toLowerCase() || '';
        const observacoes = demanda.observacoes?.toLowerCase() || '';
        const solicitante = demanda.solicitante?.nome?.toLowerCase() || '';
        const executor = demanda.executor?.nome?.toLowerCase() || '';

        return (
          tipo.includes(busca) ||
          local.includes(busca) ||
          cidade.includes(busca) ||
          observacoes.includes(busca) ||
          solicitante.includes(busca) ||
          executor.includes(busca)
        );
      });
    }

    if (this.statusSelecionado !== '') {
      lista = lista.filter(
        (demanda) => demanda.status === this.statusSelecionado
      );
    }

    if (this.ordenacaoDataAtiva) {
      lista.sort(
        (a, b) =>
          new Date(b.dataHoraCriacao).getTime() -
          new Date(a.dataHoraCriacao).getTime()
      );
    }

    if (this.ordenacaoTipoAtiva) {
      lista.sort((a, b) =>
        a.tipo.tipoDemanda.localeCompare(b.tipo.tipoDemanda, 'pt-BR')
      );
    }

    if (this.agrupamentoStatusAtivo) {
      const ordemStatus: Record<StatusDemanda, number> = {
        PENDENTE: 1,
        EM_ANDAMENTO: 2,
        CONCLUIDA: 3,
        CANCELADA: 4,
      };

      lista.sort((a, b) => ordemStatus[a.status] - ordemStatus[b.status]);
    }

    this.demandasFiltradas = lista;
    this.cdr.detectChanges();
  }

  abrirModalCriar(): void {
    if (!this.podeCriarDemanda()) {
      this.exibirMensagem('Seu perfil não pode criar demandas.', 'erro');
      return;
    }

    if (!this.usuarioLogado?.id) {
      this.exibirMensagem('Usuário não identificado. Faça login novamente.', 'erro');
      this.router.navigate(['/login']);
      return;
    }

    this.novaDemanda.solicitanteId = this.usuarioLogado.id;
    this.modalCriarAberto = true;
  }

  fecharModalCriar(): void {
    this.modalCriarAberto = false;
    this.novaDemanda = this.criarDemandaVazia();

    if (this.usuarioLogado?.id) {
      this.novaDemanda.solicitanteId = this.usuarioLogado.id;
    }
  }

  criarDemanda(): void {
    if (!this.podeCriarDemanda()) {
      this.exibirMensagem('Seu perfil não pode criar demandas.', 'erro');
      return;
    }

    if (this.usuarioLogado?.id) {
      this.novaDemanda.solicitanteId = this.usuarioLogado.id;
    }

    if (!this.validarNovaDemanda()) return;

    this.demandasService.criar(this.novaDemanda).subscribe({
      next: () => {
        this.exibirMensagem('Demanda criada com sucesso!', 'sucesso');
        this.fecharModalCriar();
        this.carregarDemandas();
      },
      error: () => {
        this.exibirMensagem('Erro ao criar demanda.', 'erro');
      },
    });
  }

  abrirModalDetalhes(demanda: Demanda): void {
    if (!demanda.id) {
      this.exibirMensagem('Demanda sem ID.', 'erro');
      return;
    }

    this.demandasService.buscarPorId(demanda.id).subscribe({
      next: (demandaAtualizada) => {
        this.demandaSelecionada = demandaAtualizada;

        if (this.ehExecutor() && this.usuarioLogado?.id) {
          this.executorSelecionadoId = this.usuarioLogado.id;
        } else {
          this.executorSelecionadoId = demandaAtualizada.executor?.id || null;
        }

        this.modalDetalhesAberto = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.exibirMensagem('Erro ao buscar detalhes da demanda.', 'erro');
      },
    });
  }

  fecharModalDetalhes(): void {
    this.modalDetalhesAberto = false;
    this.demandaSelecionada = null;
    this.executorSelecionadoId = null;
    this.cdr.detectChanges();
  }

  captarDemanda(): void {
    if (!this.demandaSelecionada?.id) {
      this.exibirMensagem('Demanda sem ID.', 'erro');
      return;
    }

    if (!this.podeCaptarDemanda(this.demandaSelecionada)) {
      this.exibirMensagem('Seu perfil não pode captar esta demanda.', 'erro');
      return;
    }

    if (this.ehExecutor() && this.usuarioLogado?.id) {
      this.executorSelecionadoId = this.usuarioLogado.id;
    }

    if (!this.executorSelecionadoId) {
      this.exibirMensagem('Selecione um executor.', 'erro');
      return;
    }

    this.demandasService
      .captar(this.demandaSelecionada.id, this.executorSelecionadoId)
      .subscribe({
        next: () => {
          this.exibirMensagem('Demanda captada com sucesso!', 'sucesso');
          this.fecharModalDetalhes();
          this.carregarDemandas();
        },
        error: () => {
          this.exibirMensagem('Erro ao captar demanda.', 'erro');
        },
      });
  }

  concluirDemanda(): void {
    if (!this.demandaSelecionada?.id) {
      this.exibirMensagem('Demanda sem ID.', 'erro');
      return;
    }

    if (!this.podeConcluirDemanda(this.demandaSelecionada)) {
      this.exibirMensagem('Você não pode concluir esta demanda.', 'erro');
      return;
    }

    this.demandasService.concluir(this.demandaSelecionada.id).subscribe({
      next: () => {
        this.exibirMensagem('Demanda concluída com sucesso!', 'sucesso');
        this.fecharModalDetalhes();
        this.carregarDemandas();
      },
      error: () => {
        this.exibirMensagem('Erro ao concluir demanda.', 'erro');
      },
    });
  }

  cancelarDemanda(): void {
    if (!this.demandaSelecionada?.id) {
      this.exibirMensagem('Demanda sem ID.', 'erro');
      return;
    }

    if (!this.podeCancelarDemanda(this.demandaSelecionada)) {
      this.exibirMensagem('Você não pode cancelar esta demanda.', 'erro');
      return;
    }

    const confirmar = confirm('Tem certeza que deseja cancelar esta demanda?');

    if (!confirmar) return;

    this.demandasService.cancelar(this.demandaSelecionada.id).subscribe({
      next: () => {
        this.exibirMensagem('Demanda cancelada com sucesso!', 'sucesso');
        this.fecharModalDetalhes();
        this.carregarDemandas();
      },
      error: () => {
        this.exibirMensagem('Erro ao cancelar demanda.', 'erro');
      },
    });
  }

  podeCriarDemanda(): boolean {
    return this.ehAdministrador() || this.ehSolicitante();
  }

  podeCaptarDemanda(demanda: Demanda): boolean {
    return (
      demanda.status === 'PENDENTE' &&
      (this.ehExecutor() || this.ehAdministrador())
    );
  }

  podeConcluirDemanda(demanda: Demanda): boolean {
    if (demanda.status !== 'EM_ANDAMENTO') return false;

    if (this.ehAdministrador()) return true;

    return (
      this.ehExecutor() &&
      demanda.executor?.id === this.usuarioLogado?.id
    );
  }

  podeCancelarDemanda(demanda: Demanda): boolean {
    if (demanda.status === 'CONCLUIDA' || demanda.status === 'CANCELADA') {
      return false;
    }

    if (this.ehAdministrador()) return true;

    return (
      this.ehSolicitante() &&
      demanda.solicitante?.id === this.usuarioLogado?.id
    );
  }

  ehAdministrador(): boolean {
    return this.usuarioLogado?.atribuicao === Atribuicao.ADMINISTRADOR;
  }

  ehSolicitante(): boolean {
    return this.usuarioLogado?.atribuicao === Atribuicao.SOLICITANTE;
  }

  ehExecutor(): boolean {
    return this.usuarioLogado?.atribuicao === Atribuicao.EXECUTOR;
  }

  textoStatus(status: StatusDemanda): string {
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

  iconeStatus(status: StatusDemanda): string {
    switch (status) {
      case 'PENDENTE':
        return 'schedule';
      case 'EM_ANDAMENTO':
        return 'local_shipping';
      case 'CONCLUIDA':
        return 'check_circle';
      case 'CANCELADA':
        return 'cancel';
      default:
        return 'help';
    }
  }

  classeStatus(status: StatusDemanda): string {
    switch (status) {
      case 'PENDENTE':
        return 'status-pendente';
      case 'EM_ANDAMENTO':
        return 'status-andamento';
      case 'CONCLUIDA':
        return 'status-concluida';
      case 'CANCELADA':
        return 'status-cancelada';
      default:
        return '';
    }
  }

  private criarDemandaVazia(): DemandaRequest {
    return {
      tipoDemandaId: null,
      localId: null,
      solicitanteId: this.usuarioLogado?.id || null,
      observacoes: '',
      nomeReceptor: '',
    };
  }

  private validarNovaDemanda(): boolean {
    if (!this.usuarioLogado?.id) {
      this.exibirMensagem('Usuário não identificado. Faça login novamente.', 'erro');
      return false;
    }

    if (!this.novaDemanda.tipoDemandaId) {
      this.exibirMensagem('Selecione o tipo de demanda.', 'erro');
      return false;
    }

    if (!this.novaDemanda.localId) {
      this.exibirMensagem('Selecione o local.', 'erro');
      return false;
    }

    if (!this.novaDemanda.observacoes.trim()) {
      this.exibirMensagem('Informe as observações da demanda.', 'erro');
      return false;
    }

    return true;
  }

  private exibirMensagem(
    mensagem: string,
    tipo: 'sucesso' | 'erro' = 'sucesso'
  ): void {
    this.mensagemSistema = mensagem;
    this.tipoMensagem = tipo;

    if (this.timeoutMensagem) {
      clearTimeout(this.timeoutMensagem);
    }

    this.timeoutMensagem = setTimeout(() => {
      this.mensagemSistema = '';
      this.cdr.detectChanges();
    }, 3000);

    this.cdr.detectChanges();
  }
}
