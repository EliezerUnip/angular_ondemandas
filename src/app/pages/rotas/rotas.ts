import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Demanda } from '../../models/demandas.model';

@Component({
  selector: 'app-rotas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rotas.html',
  styleUrl: './rotas.css',
})
export class Rotas implements OnInit {
  constructor(private router: Router) {}

  demandasRota: Demanda[] = [];

  ngOnInit(): void {
    this.carregarDemandasDaRota();
  }

  carregarDemandasDaRota(): void {
    const demandasSalvas = localStorage.getItem('demandasRota');

    if (!demandasSalvas) {
      this.demandasRota = [];
      return;
    }

    this.demandasRota = JSON.parse(demandasSalvas);
  }

  removerDaRota(demandaId?: number): void {
    if (!demandaId) return;

    this.demandasRota = this.demandasRota.filter(
      (demanda) => demanda.id !== demandaId
    );

    localStorage.setItem('demandasRota', JSON.stringify(this.demandasRota));
  }

  limparRota(): void {
    const confirmar = confirm('Deseja limpar todas as demandas da rota?');

    if (!confirmar) return;

    this.demandasRota = [];
    localStorage.removeItem('demandasRota');
  }

  irParaHome(): void {
    this.router.navigate(['/home']);
  }

  irParaDemandas(): void {
    this.router.navigate(['/demandas']);
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
}
