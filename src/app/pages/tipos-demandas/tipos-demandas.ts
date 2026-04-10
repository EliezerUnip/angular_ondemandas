import { CommonModule } from '@angular/common';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
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
    private cdr: ChangeDetectorRef
  ) {}

  tiposDemandas: TipoDemanda[] = [];

  modalCriarAberto = false;
  modalVisualizarAberto = false;

  novoTipo: TipoDemandaRequest = {
    tipoDemandaDescricao: '',
    ativo: true,
  };

  tipoSelecionado: TipoDemanda | null = null;

  ngOnInit(): void {
    this.carregarTiposDemandas();
  }

  irParaHome() {
    this.router.navigate(['/home']);
  }

  abrirModalCriar() {
    this.modalCriarAberto = true;
  }

  fecharModalCriar() {
    this.modalCriarAberto = false;
    this.novoTipo = {
      tipoDemandaDescricao: '',
      ativo: true,
    };
  }

  abrirModalVisualizar(tipo: TipoDemanda) {
    this.tipoSelecionado = { ...tipo };
    this.modalVisualizarAberto = true;
  }

  fecharModalVisualizar() {
    this.modalVisualizarAberto = false;
    this.tipoSelecionado = null;
  }

  carregarTiposDemandas() {
    this.tipoDemandasService.listar().subscribe({
      next: (dados) => {
        this.tiposDemandas = dados;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Erro ao carregar tipos de demanda');
      },
    });
  }

  criarTipoDemanda() {
    if (!this.novoTipo.tipoDemandaDescricao.trim()) {
      alert('Preencha a descrição do tipo de demanda');
      return;
    }

    this.tipoDemandasService.criar(this.novoTipo).subscribe({
      next: () => {
        alert('Tipo de demanda criado com sucesso! ✅');
        this.carregarTiposDemandas();
        this.fecharModalCriar();
      },
      error: () => {
        alert('Erro ao criar tipo de demanda ❌');
      },
    });
  }

  alterarStatusTipoDemanda() {
    if (!this.tipoSelecionado || !this.tipoSelecionado.id) {
      return;
    }

    const body: TipoDemandaRequest = {
      tipoDemandaDescricao: this.tipoSelecionado.tipoDemanda,
      ativo: !this.tipoSelecionado.ativo,
    };

    this.tipoDemandasService
      .atualizar(this.tipoSelecionado.id, body)
      .subscribe({
        next: () => {
          alert(
            `Tipo de demanda ${
              body.ativo ? 'ativado' : 'inativado'
            } com sucesso! ✅`
          );
          this.carregarTiposDemandas();
          this.fecharModalVisualizar();
        },
        error: () => {
          alert('Erro ao atualizar status do tipo de demanda ❌');
        },
      });
  }
}
