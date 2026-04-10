import { CommonModule } from '@angular/common';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
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
    private cdr: ChangeDetectorRef
  ) {}

  veiculos: Veiculo[] = [];
  veiculoSelecionado: Veiculo | null = null;

  modalCriarAberto = false;
  modalDetalhesAberto = false;

  marcas: MarcaFipe[] = [];
  modelos: ModeloFipe[] = [];

  marcaSelecionadaId = '';

  novoVeiculo: Veiculo = {
    marcaVeiculo: '',
    modeloVeiculo: '',
    placaVeiculo: '',
    anoVeiculo: null,
    kmAtual: null,
    statusVeiculo: true,
    quantidadeLugares: null,
  };

  ngOnInit(): void {
    this.carregarVeiculos();
    this.carregarMarcas();
  }

  irParaHome() {
    this.router.navigate(['/home']);
  }

  carregarVeiculos() {
    this.veiculoService.listar().subscribe({
      next: (dados) => {
        this.veiculos = dados;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Erro ao carregar veículos');
      },
    });
  }

  carregarMarcas() {
    this.fipeService.listarMarcas().subscribe({
      next: (dados) => {
        this.marcas = dados;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Erro ao carregar marcas');
      },
    });
  }

  aoSelecionarMarca() {
    this.novoVeiculo.modeloVeiculo = '';
    this.modelos = [];

    if (!this.marcaSelecionadaId) {
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
        alert('Erro ao carregar modelos');
      },
    });
  }

  abrirModalCriar() {
    this.modalCriarAberto = true;
  }

  fecharModalCriar() {
    this.modalCriarAberto = false;
    this.marcaSelecionadaId = '';
    this.modelos = [];
    this.novoVeiculo = {
      marcaVeiculo: '',
      modeloVeiculo: '',
      placaVeiculo: '',
      anoVeiculo: null,
      kmAtual: null,
      statusVeiculo: true,
      quantidadeLugares: null,
    };
  }

  criarVeiculo() {
    if (
      !this.novoVeiculo.marcaVeiculo ||
      !this.novoVeiculo.modeloVeiculo ||
      !this.novoVeiculo.placaVeiculo ||
      this.novoVeiculo.anoVeiculo === null ||
      this.novoVeiculo.kmAtual === null ||
      this.novoVeiculo.quantidadeLugares === null
    ) {
      alert('Preencha todos os campos');
      return;
    }

    this.veiculoService.criar(this.novoVeiculo).subscribe({
      next: () => {
        alert('Veículo criado com sucesso! ✅');
        this.carregarVeiculos();
        this.fecharModalCriar();
      },
      error: () => {
        alert('Erro ao criar veículo ❌');
      },
    });
  }

  abrirModalDetalhes(veiculo: Veiculo) {
    this.veiculoSelecionado = { ...veiculo };
    this.modalDetalhesAberto = true;
  }

  fecharModalDetalhes() {
    this.modalDetalhesAberto = false;
    this.veiculoSelecionado = null;
  }

  alterarStatusVeiculo() {
    if (!this.veiculoSelecionado || !this.veiculoSelecionado.id) {
      return;
    }

    const body: Veiculo = {
      ...this.veiculoSelecionado,
      statusVeiculo: !this.veiculoSelecionado.statusVeiculo,
    };

    this.veiculoService.atualizar(this.veiculoSelecionado.id, body).subscribe({
      next: () => {
        alert(
          `Veículo ${
            body.statusVeiculo ? 'ativado' : 'inativado'
          } com sucesso! ✅`
        );
        this.carregarVeiculos();
        this.fecharModalDetalhes();
      },
      error: () => {
        alert('Erro ao alterar status do veículo ❌');
      },
    });
  }
}
