import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
// teste
import { Veiculo } from '../../models/veiculos.model';
import { VeiculoService } from '../../service/veiculo.service';

import { Demanda } from '../../models/demandas.model';
import { DemandasService } from '../../service/demandas.service';

import { RotasService } from '../../service/rotas.service';
import * as L from 'leaflet';

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



  modalFinalizarAberto = false;
  kmFinalInformado: number | null = null;

  distanciaEstimadaKm: number | null = null;
  tempoEstimadoMinutos: number | null = null;

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

  mapa: L.Map | null = null;
  marcadores: L.Marker[] = [];
  linhaRota: L.Polyline | null = null;

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
        this.inicializarMapa();
        this.atualizarMapa();
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

        setTimeout(() => {
          this.atualizarMapa();
        }, 500);

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

        setTimeout(() => {
          this.atualizarMapa();
        }, 500);
      },
      error: () => {
        alert('Erro ao remover demanda da rota');
      },
    });
  }

  moverDemandaParaCima(item: any): void {
    if (!this.rota?.id || !item?.demanda?.id) return;

    this.rotasService
      .moverDemandaParaCima(this.rota.id, item.demanda.id)
      .subscribe({
        next: () => {
          this.carregarDemandasDaRota(this.rota.id);

          setTimeout(() => {
            this.atualizarMapa();
          }, 500);
        },
        error: () => {
          alert('Erro ao mover demanda para cima');
        },
      });
  }

  moverDemandaParaBaixo(item: any): void {
    if (!this.rota?.id || !item?.demanda?.id) return;

    this.rotasService
      .moverDemandaParaBaixo(this.rota.id, item.demanda.id)
      .subscribe({
        next: () => {
          this.carregarDemandasDaRota(this.rota.id);

          setTimeout(() => {
            this.atualizarMapa();
          }, 500);
        },
        error: () => {
          alert('Erro ao mover demanda para baixo');
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

  abrirModalFinalizar(): void {
    this.kmFinalInformado = null;
    this.modalFinalizarAberto = true;
    this.cdr.detectChanges();
  }

  fecharModalFinalizar(): void {
    this.modalFinalizarAberto = false;
    this.kmFinalInformado = null;
    this.cdr.detectChanges();
  }

  finalizarRota(): void {
    if (!this.rota?.id) {
      alert('Rota não identificada');
      return;
    }

    if (this.kmFinalInformado === null || this.kmFinalInformado < 0) {
      alert('Informe um KM final válido');
      return;
    }

    const demandasNaoConcluidas = this.demandasDaRota.filter(
      (item) => item.demanda?.status !== 'CONCLUIDA'
    );

    if (demandasNaoConcluidas.length > 0) {
      const confirmar = confirm(
        `Esta rota possui ${demandasNaoConcluidas.length} demanda(s) não concluída(s).\n\n` +
        `Ao finalizar, essas demandas sairão da rota e voltarão como pendentes para outros executores.\n\n` +
        `Deseja continuar mesmo assim?`
      );

      if (!confirmar) {
        return;
      }
    }

    this.rotasService
      .finalizarRota(this.rota.id, {
        kmFinal: this.kmFinalInformado,
      })
      .subscribe({
        next: (rotaAtualizada) => {
          this.rota = rotaAtualizada;
          this.fecharModalFinalizar();
          this.carregarDemandasDaRota(this.rota.id);
          alert('Rota finalizada com sucesso!');
          this.cdr.detectChanges();
        },
        error: () => {
          alert('Erro ao finalizar rota');
        },
      });
  }

  inicializarMapa(): void {
    setTimeout(() => {
      if (this.mapa) return;

      this.mapa = L.map('mapa-rota').setView([-24.6189, -53.3207], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(this.mapa);

      this.atualizarMapa();
    }, 300);

    setTimeout(() => {
      this.mapa?.invalidateSize();
    }, 500);
  }

  atualizarMapa(): void {
    if (!this.mapa) return;

    this.marcadores.forEach((marcador) => marcador.remove());
    this.marcadores = [];

    if (this.linhaRota) {
      this.linhaRota.remove();
      this.linhaRota = null;
    }

    this.distanciaEstimadaKm = null;
    this.tempoEstimadoMinutos = null;

    const pontos: L.LatLngExpression[] = [];

    const demandasParaRota = this.demandasDaRota.filter(
      (item) => item.demanda?.status !== 'CONCLUIDA'
    );

    demandasParaRota.forEach((item, index) => {
      const local = item.demanda?.local;

      if (!local?.latitude || !local?.longitude) return;

      const latitude = Number(local.latitude);
      const longitude = Number(local.longitude);

      if (isNaN(latitude) || isNaN(longitude)) return;

      const ponto: L.LatLngExpression = [latitude, longitude];
      pontos.push(ponto);

      const numero = index + 1;

      const iconeNumerado = L.divIcon({
        className: 'marker-number',
        html: `<div>${numero}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      const marcador = L.marker(ponto, { icon: iconeNumerado })
        .addTo(this.mapa!)
        .bindPopup(`
        <strong>${numero}. ${local.nomeLocal}</strong><br>
        ${local.endereco || ''}<br>
        ${local.cidade || ''}
      `);

      this.marcadores.push(marcador);
    });

    if (pontos.length > 0) {
      const bounds = L.latLngBounds(pontos);
      this.mapa.fitBounds(bounds, { padding: [40, 40] });
    }

    if (pontos.length > 1) {
      this.desenharRotaPelasRuas(pontos);
    }
  }

  desenharRotaPelasRuas(pontos: L.LatLngExpression[]): void {
    if (!this.mapa || pontos.length < 2) return;

    const coordenadasOsrm = pontos
      .map((ponto: any) => {
        const latitude = ponto[0];
        const longitude = ponto[1];

        return `${longitude},${latitude}`;
      })
      .join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${coordenadasOsrm}?overview=full&geometries=geojson`;

    fetch(url)
      .then((resposta) => resposta.json())
      .then((dados) => {
        if (!dados.routes || dados.routes.length === 0) {
          this.linhaRota = L.polyline(pontos).addTo(this.mapa!);
          return;
        }

        this.distanciaEstimadaKm = dados.routes[0].distance / 1000;

        this.tempoEstimadoMinutos =
          Math.round(dados.routes[0].duration / 60);
        this.cdr.detectChanges();




        const coordenadasRota = dados.routes[0].geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]]
        );

        this.linhaRota = L.polyline(coordenadasRota).addTo(this.mapa!);

        const bounds = L.latLngBounds(coordenadasRota);
        this.mapa!.fitBounds(bounds, { padding: [40, 40] });
      })
      .catch(() => {
        this.linhaRota = L.polyline(pontos).addTo(this.mapa!);
      });


  }

  concluirDemandaDaRota(item: any): void {
    if (!this.rota?.id || !item?.demanda?.id) return;

    const confirmar = confirm('Marcar esta demanda como concluída?');

    if (!confirmar) return;

    this.rotasService
      .concluirDemandaDaRota(this.rota.id, item.demanda.id)
      .subscribe({
        next: () => {
          this.carregarDemandasDaRota(this.rota.id);
        },
        error: () => {
          alert('Erro ao concluir demanda');
        },
      });
  }
}
