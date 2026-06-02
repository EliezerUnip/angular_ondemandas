import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TipoDemandasService } from '../../service/tipo-demandas.service';
import {
  TipoDemanda,
  TipoDemandaRequest,
} from '../../models/tipos-demandas.model';

@Component({
  selector: 'app-tipos-demandas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipos-demandas.html',
  styleUrl: './tipos-demandas.css',
})
export class TiposDemandas implements OnInit {
  constructor(
    private router: Router,
    private tipoDemandasService: TipoDemandasService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

  tiposDemandas: TipoDemanda[] = [];
  tiposDemandasFiltrados: TipoDemanda[] = [];

  termoBusca = '';
  menuFiltrosAberto = false;
  ordenacaoDescricaoAtiva = false;
  agrupamentoStatusAtivo = false;

  modalCriarAberto = false;
  modalVisualizarAberto = false;

  mensagemSistema = '';
  tipoMensagem: 'sucesso' | 'erro' = 'sucesso';
  private timeoutMensagem: any;

  novoTipo: TipoDemandaRequest = {
    tipoDemandaDescricao: '',
    ativo: true,
  };

  tipoSelecionado: TipoDemanda | null = null;

  ngOnInit(): void {
    this.carregarTiposDemandas();
  }

  @HostListener('document:click', ['$event'])
  fecharElementosAoClicarFora(event: MouseEvent): void {
    const elementoClicado = event.target as HTMLElement;

    const menuFiltros = this.elementRef.nativeElement.querySelector(
      '.filter-menu-area'
    );

    const modalContainer = this.elementRef.nativeElement.querySelector(
      '.modal-container'
    );

    if (!menuFiltros?.contains(elementoClicado)) {
      this.menuFiltrosAberto = false;
    }

    if (
      (this.modalCriarAberto || this.modalVisualizarAberto) &&
      modalContainer &&
      !modalContainer.contains(elementoClicado)
    ) {
      this.fecharModalCriar();
      this.fecharModalVisualizar();
    }
  }

  irParaHome(): void {
    this.router.navigate(['/home']);
  }

  alternarMenuFiltros(): void {
    this.menuFiltrosAberto = !this.menuFiltrosAberto;
  }

  ordenarPorDescricao(): void {
    this.ordenacaoDescricaoAtiva = !this.ordenacaoDescricaoAtiva;
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  agruparPorStatus(): void {
    this.agrupamentoStatusAtivo = !this.agrupamentoStatusAtivo;
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  limparFiltros(): void {
    this.termoBusca = '';
    this.ordenacaoDescricaoAtiva = false;
    this.agrupamentoStatusAtivo = false;
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let lista = [...this.tiposDemandas];

    const busca = this.termoBusca.trim().toLowerCase();

    if (busca) {
      lista = lista.filter((tipo) =>
        tipo.tipoDemanda.toLowerCase().includes(busca)
      );
    }

    if (this.ordenacaoDescricaoAtiva) {
      lista.sort((a, b) =>
        a.tipoDemanda.localeCompare(b.tipoDemanda, 'pt-BR')
      );
    }

    if (this.agrupamentoStatusAtivo) {
      lista.sort((a, b) => Number(b.ativo) - Number(a.ativo));
    }

    this.tiposDemandasFiltrados = lista;
  }

  abrirModalCriar(): void {
    this.modalCriarAberto = true;
  }

  fecharModalCriar(): void {
    this.modalCriarAberto = false;
    this.novoTipo = {
      tipoDemandaDescricao: '',
      ativo: true,
    };
  }

  abrirModalVisualizar(tipo: TipoDemanda): void {
    this.tipoSelecionado = { ...tipo };
    this.modalVisualizarAberto = true;
  }

  fecharModalVisualizar(): void {
    this.modalVisualizarAberto = false;
    this.tipoSelecionado = null;
  }

  carregarTiposDemandas(): void {
    this.tipoDemandasService.listar().subscribe({
      next: (dados) => {
        this.tiposDemandas = dados;
        this.aplicarFiltros();
        this.cdr.detectChanges();
      },
      error: () => {
        this.exibirMensagem('Erro ao carregar tipos de demanda.', 'erro');
      },
    });
  }

  criarTipoDemanda(): void {
    if (!this.novoTipo.tipoDemandaDescricao.trim()) {
      this.exibirMensagem('Preencha a descrição do tipo de demanda.', 'erro');
      return;
    }

    const body: TipoDemandaRequest = {
      tipoDemandaDescricao: this.novoTipo.tipoDemandaDescricao.trim(),
      ativo: true,
    };

    this.tipoDemandasService.criar(body).subscribe({
      next: () => {
        this.exibirMensagem('Tipo de demanda criado com sucesso!', 'sucesso');
        this.carregarTiposDemandas();
        this.fecharModalCriar();
      },
      error: () => {
        this.exibirMensagem('Erro ao criar tipo de demanda.', 'erro');
      },
    });
  }

  alterarStatusTipoDemanda(): void {
    if (!this.tipoSelecionado || !this.tipoSelecionado.id) {
      return;
    }

    const body: TipoDemandaRequest = {
      tipoDemandaDescricao: this.tipoSelecionado.tipoDemanda,
      ativo: !this.tipoSelecionado.ativo,
    };

    this.tipoDemandasService.atualizar(this.tipoSelecionado.id, body).subscribe({
      next: () => {
        this.exibirMensagem(
          `Tipo de demanda ${body.ativo ? 'ativado' : 'inativado'} com sucesso!`,
          'sucesso'
        );

        this.carregarTiposDemandas();
        this.fecharModalVisualizar();
      },
      error: () => {
        this.exibirMensagem('Erro ao atualizar status do tipo de demanda.', 'erro');
      },
    });
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
  }
}
