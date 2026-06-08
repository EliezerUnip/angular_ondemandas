import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RotasService } from '../../service/rotas.service';

@Component({
  selector: 'app-rota-detalhes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rota-detalhes.html',
  styleUrl: './rota-detalhes.css',
})
export class RotaDetalhes implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rotasService: RotasService,
    private cdr: ChangeDetectorRef
  ) {}

  rota: any = null;
  demandasDaRota: any[] = [];

  carregando = true;
  erroCarregamento = '';

  ngOnInit(): void {
    const rotaId = Number(this.route.snapshot.paramMap.get('id'));

    if (!rotaId) {
      this.router.navigate(['/rotas']);
      return;
    }

    this.carregarRota(rotaId);
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
}
