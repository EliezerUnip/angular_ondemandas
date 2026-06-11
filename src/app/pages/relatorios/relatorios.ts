import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { RotasService } from '../../service/rotas.service';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css',
})
export class Relatorios implements OnInit {
  constructor(
    private router: Router,
    private rotasService: RotasService,
    private cdr: ChangeDetectorRef
  ) {}

  carregando = true;

  rotas: any[] = [];
  produtividadeExecutores: any[] = [];

  totalRotas = 0;
  rotasProgramadas = 0;
  rotasEmAndamento = 0;
  rotasPausadas = 0;
  rotasConcluidas = 0;
  rotasCanceladas = 0;

  kmTotalPercorrido = 0;
  mediaKmPorRotaConcluida = 0;
  rotasComKmInformado = 0;
  taxaConclusaoRotas = 0;

  ngOnInit(): void {
    this.carregarRelatorios();
  }

  carregarRelatorios(): void {
    this.carregando = true;

    this.rotasService.listar().subscribe({
      next: (dados) => {
        this.rotas = dados || [];

        this.calcularMetricasRotas();

        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar relatórios:', erro);
        alert('Erro ao carregar relatórios');

        this.carregando = false;
        this.cdr.detectChanges();
      },
    });
  }

  calcularMetricasRotas(): void {
    this.totalRotas = this.rotas.length;

    this.rotasProgramadas = this.rotas.filter(
      (rota) => rota.status === 'PROGRAMADA'
    ).length;

    this.rotasEmAndamento = this.rotas.filter(
      (rota) => rota.status === 'EM_ANDAMENTO'
    ).length;

    this.rotasPausadas = this.rotas.filter(
      (rota) => rota.status === 'PAUSADA'
    ).length;

    this.rotasConcluidas = this.rotas.filter(
      (rota) => rota.status === 'CONCLUIDA'
    ).length;

    this.rotasCanceladas = this.rotas.filter(
      (rota) => rota.status === 'CANCELADA'
    ).length;

    this.taxaConclusaoRotas =
      this.totalRotas > 0
        ? Math.round((this.rotasConcluidas / this.totalRotas) * 100)
        : 0;

    const rotasComKm = this.rotas.filter(
      (rota) =>
        rota.kmInicial !== null &&
        rota.kmInicial !== undefined &&
        rota.kmFinal !== null &&
        rota.kmFinal !== undefined
    );

    this.rotasComKmInformado = rotasComKm.length;

    this.kmTotalPercorrido = rotasComKm.reduce((total, rota) => {
      const kmInicial = Number(rota.kmInicial);
      const kmFinal = Number(rota.kmFinal);

      if (isNaN(kmInicial) || isNaN(kmFinal)) {
        return total;
      }

      return total + Math.max(kmFinal - kmInicial, 0);
    }, 0);

    this.mediaKmPorRotaConcluida =
      rotasComKm.length > 0
        ? Math.round(this.kmTotalPercorrido / rotasComKm.length)
        : 0;

    this.calcularProdutividadeExecutores();
  }

  atualizar(): void {
    this.carregarRelatorios();
  }

  irParaHome(): void {
    this.router.navigate(['/home']);
  }

  irParaRotas(): void {
    this.router.navigate(['/rotas']);
  }

  calcularProdutividadeExecutores(): void {
    const mapa = new Map<string, any>();

    const rotasConcluidasComKm = this.rotas.filter(
      (rota) =>
        rota.status === 'CONCLUIDA' &&
        rota.executor?.nome &&
        rota.kmInicial !== null &&
        rota.kmInicial !== undefined &&
        rota.kmFinal !== null &&
        rota.kmFinal !== undefined
    );

    rotasConcluidasComKm.forEach((rota) => {
      const executor = rota.executor.nome;
      const kmPercorrido = Math.max(
        Number(rota.kmFinal) - Number(rota.kmInicial),
        0
      );

      if (!mapa.has(executor)) {
        mapa.set(executor, {
          executor,
          rotasConcluidas: 0,
          kmTotal: 0,
          mediaKmPorRota: 0,
        });
      }

      const item = mapa.get(executor);

      item.rotasConcluidas += 1;
      item.kmTotal += kmPercorrido;
    });

    this.produtividadeExecutores = Array.from(mapa.values())
      .map((item) => ({
        ...item,
        mediaKmPorRota:
          item.rotasConcluidas > 0
            ? Math.round(item.kmTotal / item.rotasConcluidas)
            : 0,
      }))
      .sort((a, b) => b.kmTotal - a.kmTotal);
  }
}
