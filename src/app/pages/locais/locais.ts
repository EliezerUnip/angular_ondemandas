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

import * as L from 'leaflet';

import { Local } from '../../models/local.model';
import { LocalService } from '../../service/local.service';

@Component({
  selector: 'app-locais',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './locais.html',
  styleUrl: './locais.css',
})
export class Locais implements OnInit {
  constructor(
    private router: Router,
    private localService: LocalService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

  locais: Local[] = [];
  locaisFiltrados: Local[] = [];

  localSelecionado: Local | null = null;
  localEdicao: Local = this.criarLocalVazio();

  modalCriarAberto = false;
  modalDetalhesAberto = false;
  modoEdicaoDetalhes = false;

  termoBusca = '';
  menuFiltrosAberto = false;

  ordenacaoNomeAtiva = false;
  ordenacaoCidadeAtiva = false;
  agrupamentoStatusAtivo = false;
  statusSelecionado = '';

  mensagemSistema = '';
  tipoMensagem: 'sucesso' | 'erro' = 'sucesso';
  private timeoutMensagem: any;

  novoLocal: Local = this.criarLocalVazio();

  private mapa: L.Map | null = null;
  private marcador: L.Marker | null = null;
  private mapaInicializado = false;

  ngOnInit(): void {
    this.carregarLocais();
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

  ordenarPorNome(): void {
    this.ordenacaoNomeAtiva = !this.ordenacaoNomeAtiva;

    if (this.ordenacaoNomeAtiva) {
      this.ordenacaoCidadeAtiva = false;
    }

    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  ordenarPorCidade(): void {
    this.ordenacaoCidadeAtiva = !this.ordenacaoCidadeAtiva;

    if (this.ordenacaoCidadeAtiva) {
      this.ordenacaoNomeAtiva = false;
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
    this.ordenacaoNomeAtiva = false;
    this.ordenacaoCidadeAtiva = false;
    this.agrupamentoStatusAtivo = false;
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let lista = [...this.locais];

    const busca = this.termoBusca.trim().toLowerCase();

    if (busca) {
      lista = lista.filter((local) => {
        const nome = local.nomeLocal?.toLowerCase() || '';
        const cidade = local.cidade?.toLowerCase() || '';
        const endereco = local.endereco?.toLowerCase() || '';

        return nome.includes(busca) || cidade.includes(busca) || endereco.includes(busca);
      });
    }

    if (this.statusSelecionado) {
      lista = lista.filter((local) => {
        if (this.statusSelecionado === 'ativo') return local.ativo === true;
        if (this.statusSelecionado === 'inativo') return local.ativo === false;
        return true;
      });
    }

    if (this.ordenacaoNomeAtiva) {
      lista.sort((a, b) =>
        (a.nomeLocal || '').localeCompare(b.nomeLocal || '', 'pt-BR')
      );
    }

    if (this.ordenacaoCidadeAtiva) {
      lista.sort((a, b) =>
        (a.cidade || '').localeCompare(b.cidade || '', 'pt-BR')
      );
    }

    if (this.agrupamentoStatusAtivo) {
      lista.sort((a, b) => Number(b.ativo) - Number(a.ativo));
    }

    this.locaisFiltrados = lista;
    this.cdr.detectChanges();
  }

  carregarLocais(): void {
    this.localService.listar().subscribe({
      next: (dados) => {
        this.locais = dados;
        this.aplicarFiltros();
      },
      error: () => {
        this.exibirMensagem('Erro ao carregar locais.', 'erro');
      },
    });
  }

  abrirModalCriar(): void {
    this.modalCriarAberto = true;

    setTimeout(() => {
      this.inicializarMapa();
    }, 150);
  }

  fecharModalCriar(): void {
    this.modalCriarAberto = false;
    this.novoLocal = this.criarLocalVazio();
    this.destruirMapa();
  }

  criarLocal(): void {
    if (!this.validarLocal(this.novoLocal)) return;

    const localParaCriar: Local = {
      ...this.novoLocal,
      nomeLocal: this.novoLocal.nomeLocal.trim(),
      cidade: this.novoLocal.cidade.trim(),
      endereco: this.novoLocal.endereco.trim(),
      ativo: true,
    };

    this.localService.criar(localParaCriar).subscribe({
      next: () => {
        this.exibirMensagem('Local criado com sucesso!', 'sucesso');
        this.fecharModalCriar();
        this.carregarLocais();
      },
      error: () => {
        this.exibirMensagem('Erro ao criar local.', 'erro');
      },
    });
  }

  async buscarCoordenadasPorEndereco(): Promise<void> {
    if (!this.novoLocal.endereco?.trim()) {
      this.exibirMensagem('Informe o endereço antes de buscar no mapa.', 'erro');
      return;
    }

    if (!this.novoLocal.cidade?.trim()) {
      this.exibirMensagem('Informe a cidade antes de buscar no mapa.', 'erro');
      return;
    }

    try {
      const enderecoOriginal = this.novoLocal.endereco || '';
      const cidade = this.novoLocal.cidade || '';

      const enderecoNormalizado = this.normalizarEndereco(enderecoOriginal);

      const tentativas = [
        `${enderecoNormalizado}, ${cidade}, PR, Brasil`,
        `${enderecoNormalizado}, ${cidade}, Paraná, Brasil`,
        `${enderecoNormalizado}, Brasil`,
        `${enderecoNormalizado}`,
        `${cidade}, PR, Brasil`,
      ];

      let resultadoEncontrado: any = null;

      for (const consulta of tentativas) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(consulta)}`;

        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (dados && dados.length > 0) {
          resultadoEncontrado = dados[0];
          break;
        }
      }

      if (!resultadoEncontrado) {
        this.exibirMensagem('Endereço não encontrado no mapa. Tente escrever o nome da rua por extenso.', 'erro');
        return;
      }

      const latitude = Number(Number(resultadoEncontrado.lat).toFixed(6));
      const longitude = Number(Number(resultadoEncontrado.lon).toFixed(6));

      this.novoLocal.latitude = latitude;
      this.novoLocal.longitude = longitude;

      this.atualizarMarcador(latitude, longitude);
      this.exibirMensagem('Coordenadas encontradas pelo endereço.', 'sucesso');
      this.cdr.detectChanges();
    } catch (erro) {
      console.error('Erro ao buscar endereço:', erro);
      this.exibirMensagem('Erro ao buscar coordenadas pelo endereço.', 'erro');
    }
  }

  normalizarEndereco(endereco: string): string {
    return endereco
      .replace(/\bAv\.\s*/gi, 'Avenida ')
      .replace(/\bAv\s+/gi, 'Avenida ')
      .replace(/\bMin\.\s*/gi, 'Ministro ')
      .replace(/\bMin\s+/gi, 'Ministro ')
      .replace(/\bMal\.\s*/gi, 'Marechal ')
      .replace(/\bMal\s+/gi, 'Marechal ')
      .replace(/\bR\.\s*/gi, 'Rua ')
      .replace(/\bR\s+/gi, 'Rua ')
      .replace(/\bRod\.\s*/gi, 'Rodovia ')
      .replace(/\bRod\s+/gi, 'Rodovia ')
      .replace(/\bS\/N\b/gi, '')
      .replace(/\s-\s/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  abrirModalDetalhes(local: Local): void {
    if (!local.id) {
      this.exibirMensagem('Local sem ID.', 'erro');
      return;
    }

    this.localService.buscarPorId(local.id).subscribe({
      next: (localAtualizado) => {
        this.localSelecionado = localAtualizado;
        this.localEdicao = { ...localAtualizado };
        this.modoEdicaoDetalhes = false;
        this.modalDetalhesAberto = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.exibirMensagem('Erro ao buscar detalhes do local.', 'erro');
      },
    });
  }

  fecharModalDetalhes(): void {
    this.modalDetalhesAberto = false;
    this.localSelecionado = null;
    this.localEdicao = this.criarLocalVazio();
    this.modoEdicaoDetalhes = false;
    this.cdr.detectChanges();
  }

  ativarModoEdicao(): void {
    if (!this.localSelecionado) return;

    this.localEdicao = { ...this.localSelecionado };
    this.modoEdicaoDetalhes = true;
  }

  cancelarEdicao(): void {
    if (!this.localSelecionado) return;

    this.localEdicao = { ...this.localSelecionado };
    this.modoEdicaoDetalhes = false;
  }

  salvarAlteracaoLocal(): void {
    if (!this.localSelecionado?.id) {
      this.exibirMensagem('Local sem ID.', 'erro');
      return;
    }

    if (!this.localEdicao.nomeLocal?.trim()) {
      this.exibirMensagem('Informe o nome do local.', 'erro');
      return;
    }

    if (!this.localEdicao.cidade?.trim()) {
      this.exibirMensagem('Informe a cidade.', 'erro');
      return;
    }

    if (!this.localEdicao.endereco?.trim()) {
      this.exibirMensagem('Informe o endereço.', 'erro');
      return;
    }

    const body: Local = {
      ...this.localSelecionado,
      nomeLocal: this.localEdicao.nomeLocal.trim(),
      cidade: this.localEdicao.cidade.trim(),
      endereco: this.localEdicao.endereco.trim(),
    };

    this.localService.atualizar(this.localSelecionado.id, body).subscribe({
      next: (localAtualizado) => {
        const localFinal = localAtualizado || body;

        this.localSelecionado = localFinal;
        this.localEdicao = { ...localFinal };

        this.locais = this.locais.map((local) =>
          local.id === localFinal.id ? localFinal : local
        );

        this.modoEdicaoDetalhes = false;
        this.aplicarFiltros();
        this.exibirMensagem('Local alterado com sucesso!', 'sucesso');
      },
      error: () => {
        this.exibirMensagem('Erro ao alterar local.', 'erro');
      },
    });
  }

  alterarStatusLocal(): void {
    if (
      !this.localSelecionado ||
      this.localSelecionado.id === undefined ||
      this.localSelecionado.id === null
    ) {
      this.exibirMensagem('Local sem ID.', 'erro');
      return;
    }

    const novoStatus = !this.localSelecionado.ativo;

    const body: Local = {
      id: this.localSelecionado.id,
      nomeLocal: this.localSelecionado.nomeLocal?.trim(),
      cidade: this.localSelecionado.cidade?.trim(),
      endereco: this.localSelecionado.endereco?.trim(),
      latitude: Number(this.localSelecionado.latitude),
      longitude: Number(this.localSelecionado.longitude),
      ativo: novoStatus,
    };

    console.log('BODY ENVIADO PARA ALTERAR STATUS:', body);

    this.localService.atualizar(this.localSelecionado.id, body).subscribe({
      next: (localAtualizado) => {
        const localFinal = localAtualizado || body;

        this.locais = this.locais.map((local) =>
          local.id === localFinal.id ? localFinal : local
        );

        this.localSelecionado = localFinal;
        this.localEdicao = { ...localFinal };

        this.aplicarFiltros();

        this.exibirMensagem(
          `Local ${novoStatus ? 'ativado' : 'inativado'} com sucesso!`,
          'sucesso'
        );

        this.fecharModalDetalhes();
        this.carregarLocais();
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('ERRO AO ALTERAR STATUS DO LOCAL:', erro);
        console.error('RESPOSTA DO BACKEND:', erro?.error);

        this.exibirMensagem('Erro ao alterar status do local.', 'erro');
      },
    });
  }

  selecionarCoordenadasManuais(): void {
    if (
      this.novoLocal.latitude === null ||
      this.novoLocal.longitude === null
    ) {
      this.exibirMensagem('Informe latitude e longitude.', 'erro');
      return;
    }

    this.atualizarMarcador(this.novoLocal.latitude, this.novoLocal.longitude);
  }

  private inicializarMapa(): void {
    if (this.mapaInicializado) return;

    const elementoMapa = document.getElementById('mapa-local');

    if (!elementoMapa) return;

    this.mapa = L.map('mapa-local').setView([-24.7246, -53.7412], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap',
    }).addTo(this.mapa);

    this.mapa.on('click', (evento: L.LeafletMouseEvent) => {
      const latitude = Number(evento.latlng.lat.toFixed(6));
      const longitude = Number(evento.latlng.lng.toFixed(6));

      this.novoLocal.latitude = latitude;
      this.novoLocal.longitude = longitude;

      this.atualizarMarcador(latitude, longitude);
      this.cdr.detectChanges();
    });

    this.mapaInicializado = true;

    setTimeout(() => {
      this.mapa?.invalidateSize();
    }, 200);
  }

  private atualizarMarcador(latitude: number, longitude: number): void {
    if (!this.mapa) return;

    const iconeMarcador = L.divIcon({
      className: 'custom-map-marker',
      html: '<span class="material-icons">location_on</span>',
      iconSize: [42, 42],
      iconAnchor: [21, 42],
    });

    if (this.marcador) {
      this.marcador.setLatLng([latitude, longitude]);
    } else {
      this.marcador = L.marker([latitude, longitude], {
        icon: iconeMarcador,
      }).addTo(this.mapa);
    }

    this.mapa.setView([latitude, longitude], 16);
  }

  private destruirMapa(): void {
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
      this.marcador = null;
      this.mapaInicializado = false;
    }
  }

  private criarLocalVazio(): Local {
    return {
      nomeLocal: '',
      cidade: '',
      endereco: '',
      latitude: null,
      longitude: null,
      ativo: true,
    };
  }

  private validarLocal(local: Local): boolean {
    if (!local.nomeLocal?.trim()) {
      this.exibirMensagem('Informe o nome do local.', 'erro');
      return false;
    }

    if (!local.cidade?.trim()) {
      this.exibirMensagem('Informe a cidade.', 'erro');
      return false;
    }

    if (!local.endereco?.trim()) {
      this.exibirMensagem('Informe o endereço do local.', 'erro');
      return false;
    }

    if (local.latitude === null) {
      this.exibirMensagem('Selecione o local no mapa, busque pelo endereço ou informe a latitude.', 'erro');
      return false;
    }

    if (local.longitude === null) {
      this.exibirMensagem('Selecione o local no mapa, busque pelo endereço ou informe a longitude.', 'erro');
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
