import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Veiculo } from '../../models/veiculos.model';
import { MarcaFipe, ModeloFipe } from '../../models/fipe.model';
import { VeiculoService } from '../../service/veiculo.service';
import { FipeService } from '../../service/fipe.service';

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './veiculos.html',
  styleUrl: './veiculos.css',
})
export class Veiculos implements OnInit {
  constructor(
    private router: Router,
    private veiculoService: VeiculoService,
    private fipeService: FipeService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

  veiculos: Veiculo[] = [];
  veiculosFiltrados: Veiculo[] = [];

  veiculoSelecionado: Veiculo | null = null;

  modalCriarAberto = false;
  modalDetalhesAberto = false;

  marcas: MarcaFipe[] = [];
  modelos: ModeloFipe[] = [];

  marcaSelecionadaId = '';

  termoBusca = '';
  menuFiltrosAberto = false;

  ordenacaoMarcaAtiva = false;
  ordenacaoModeloAtiva = false;
  ordenacaoAnoAtiva = false;
  ordenacaoKmAtiva = false;
  agrupamentoStatusAtivo = false;

  statusSelecionado = '';
  lugaresSelecionado = '';

  mensagemSistema = '';
  tipoMensagem: 'sucesso' | 'erro' = 'sucesso';
  private timeoutMensagem: any;

  novoVeiculo: Veiculo = this.criarVeiculoVazio();

  ngOnInit(): void {
    this.carregarVeiculos();
    this.carregarMarcas();
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

  alternarMenuFiltros(): void {
    this.menuFiltrosAberto = !this.menuFiltrosAberto;
  }

  ordenarPorMarca(): void {
    this.limparOrdenacoes();
    this.ordenacaoMarcaAtiva = true;
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  ordenarPorModelo(): void {
    this.limparOrdenacoes();
    this.ordenacaoModeloAtiva = true;
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  ordenarPorAno(): void {
    this.limparOrdenacoes();
    this.ordenacaoAnoAtiva = true;
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  ordenarPorKm(): void {
    this.limparOrdenacoes();
    this.ordenacaoKmAtiva = true;
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

  filtrarPorLugares(): void {
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  limparFiltros(): void {
    this.termoBusca = '';
    this.statusSelecionado = '';
    this.lugaresSelecionado = '';
    this.agrupamentoStatusAtivo = false;
    this.limparOrdenacoes();
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let lista = [...this.veiculos];

    const busca = this.termoBusca.trim().toLowerCase();

    if (busca) {
      lista = lista.filter((veiculo) => {
        const marca = veiculo.marcaVeiculo?.toLowerCase() || '';
        const modelo = veiculo.modeloVeiculo?.toLowerCase() || '';
        const placa = veiculo.placaVeiculo?.toLowerCase() || '';

        return (
          marca.includes(busca) ||
          modelo.includes(busca) ||
          placa.includes(busca)
        );
      });
    }

    if (this.statusSelecionado) {
      lista = lista.filter((veiculo) => {
        if (this.statusSelecionado === 'disponivel') {
          return veiculo.statusVeiculo === true;
        }

        if (this.statusSelecionado === 'inativo') {
          return veiculo.statusVeiculo === false;
        }

        return true;
      });
    }

    if (this.lugaresSelecionado) {
      lista = lista.filter((veiculo) => {
        const lugares = veiculo.quantidadeLugares || 0;

        if (this.lugaresSelecionado === '6') {
          return lugares >= 6;
        }

        return lugares === Number(this.lugaresSelecionado);
      });
    }

    if (this.ordenacaoMarcaAtiva) {
      lista.sort((a, b) =>
        a.marcaVeiculo.localeCompare(b.marcaVeiculo, 'pt-BR')
      );
    }

    if (this.ordenacaoModeloAtiva) {
      lista.sort((a, b) =>
        a.modeloVeiculo.localeCompare(b.modeloVeiculo, 'pt-BR')
      );
    }

    if (this.ordenacaoAnoAtiva) {
      lista.sort((a, b) => (b.anoVeiculo || 0) - (a.anoVeiculo || 0));
    }

    if (this.ordenacaoKmAtiva) {
      lista.sort((a, b) => (a.kmAtual || 0) - (b.kmAtual || 0));
    }

    if (this.agrupamentoStatusAtivo) {
      lista.sort((a, b) => Number(b.statusVeiculo) - Number(a.statusVeiculo));
    }

    this.veiculosFiltrados = lista;
    this.cdr.detectChanges();
  }

  carregarVeiculos(): void {
    this.veiculoService.listar().subscribe({
      next: (dados) => {
        this.veiculos = dados;
        this.aplicarFiltros();
      },
      error: () => {
        this.exibirMensagem('Erro ao carregar veículos.', 'erro');
      },
    });
  }

  carregarMarcas(): void {
    this.fipeService.listarMarcas().subscribe({
      next: (dados) => {
        this.marcas = dados;
        this.cdr.detectChanges();
      },
      error: () => {
        this.exibirMensagem('Erro ao carregar marcas da FIPE.', 'erro');
      },
    });
  }

  aoSelecionarMarca(): void {
    this.novoVeiculo.modeloVeiculo = '';
    this.modelos = [];

    if (!this.marcaSelecionadaId) {
      this.novoVeiculo.marcaVeiculo = '';
      return;
    }

    const marca = this.marcas.find(
      (item) => item.codigo === this.marcaSelecionadaId
    );

    this.novoVeiculo.marcaVeiculo = marca ? marca.nome : '';

    this.fipeService.listarModelos(this.marcaSelecionadaId).subscribe({
      next: (dados) => {
        this.modelos = dados;
        this.cdr.detectChanges();
      },
      error: () => {
        this.exibirMensagem('Erro ao carregar modelos da FIPE.', 'erro');
      },
    });
  }

  abrirModalCriar(): void {
    this.modalCriarAberto = true;
  }

  fecharModalCriar(): void {
    this.modalCriarAberto = false;
    this.marcaSelecionadaId = '';
    this.modelos = [];
    this.novoVeiculo = this.criarVeiculoVazio();
  }

  criarVeiculo(): void {
    if (!this.validarVeiculo()) return;

    const veiculoParaCriar: Veiculo = {
      ...this.novoVeiculo,
      placaVeiculo: this.novoVeiculo.placaVeiculo.trim().toUpperCase(),
      statusVeiculo: true,
    };

    this.veiculoService.criar(veiculoParaCriar).subscribe({
      next: () => {
        this.exibirMensagem('Veículo criado com sucesso!', 'sucesso');
        this.fecharModalCriar();
        this.carregarVeiculos();
      },
      error: () => {
        this.exibirMensagem('Erro ao criar veículo.', 'erro');
      },
    });
  }

  abrirModalDetalhes(veiculo: Veiculo): void {
    this.veiculoSelecionado = { ...veiculo };
    this.modalDetalhesAberto = true;
  }

  fecharModalDetalhes(): void {
    this.modalDetalhesAberto = false;
    this.veiculoSelecionado = null;
    this.cdr.detectChanges();
  }

  alterarStatusVeiculo(): void {
    if (!this.veiculoSelecionado || this.veiculoSelecionado.id === undefined || this.veiculoSelecionado.id === null) {
      this.exibirMensagem('Veículo sem ID.', 'erro');
      return;
    }

    const novoStatus = !this.veiculoSelecionado.statusVeiculo;

    const body: Veiculo = {
      ...this.veiculoSelecionado,
      statusVeiculo: novoStatus,
    };

    this.veiculoService.atualizar(this.veiculoSelecionado.id, body).subscribe({
      next: (veiculoAtualizado) => {
        const veiculoFinal: Veiculo = veiculoAtualizado || body;

        this.veiculos = this.veiculos.map((veiculo) =>
          veiculo.id === veiculoFinal.id ? veiculoFinal : veiculo
        );

        this.veiculoSelecionado = veiculoFinal;
        this.aplicarFiltros();

        this.exibirMensagem(
          `Veículo ${novoStatus ? 'ativado' : 'inativado'} com sucesso!`,
          'sucesso'
        );

        this.fecharModalDetalhes();

        this.carregarVeiculos();
        this.cdr.detectChanges();
      },
      error: () => {
        this.exibirMensagem('Erro ao alterar status do veículo.', 'erro');
      },
    });
  }

  private limparOrdenacoes(): void {
    this.ordenacaoMarcaAtiva = false;
    this.ordenacaoModeloAtiva = false;
    this.ordenacaoAnoAtiva = false;
    this.ordenacaoKmAtiva = false;
  }

  private criarVeiculoVazio(): Veiculo {
    return {
      marcaVeiculo: '',
      modeloVeiculo: '',
      placaVeiculo: '',
      anoVeiculo: null,
      kmAtual: null,
      statusVeiculo: true,
      quantidadeLugares: null,
    };
  }

  private validarVeiculo(): boolean {
    if (!this.novoVeiculo.marcaVeiculo?.trim()) {
      this.exibirMensagem('Selecione a marca do veículo.', 'erro');
      return false;
    }

    if (!this.novoVeiculo.modeloVeiculo?.trim()) {
      this.exibirMensagem('Selecione o modelo do veículo.', 'erro');
      return false;
    }

    if (!this.novoVeiculo.placaVeiculo?.trim()) {
      this.exibirMensagem('Informe a placa do veículo.', 'erro');
      return false;
    }

    if (this.novoVeiculo.anoVeiculo === null) {
      this.exibirMensagem('Informe o ano do veículo.', 'erro');
      return false;
    }

    if (this.novoVeiculo.kmAtual === null) {
      this.exibirMensagem('Informe a quilometragem atual.', 'erro');
      return false;
    }

    if (this.novoVeiculo.quantidadeLugares === null) {
      this.exibirMensagem('Informe a quantidade de lugares.', 'erro');
      return false;
    }

    if (this.novoVeiculo.anoVeiculo < 1900) {
      this.exibirMensagem('Informe um ano válido.', 'erro');
      return false;
    }

    if (this.novoVeiculo.kmAtual < 0) {
      this.exibirMensagem('A quilometragem não pode ser negativa.', 'erro');
      return false;
    }

    if (this.novoVeiculo.quantidadeLugares <= 0) {
      this.exibirMensagem('A quantidade de lugares deve ser maior que zero.', 'erro');
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
