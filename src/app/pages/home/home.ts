import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  constructor(private router: Router) {}

  irParaUsuarios() {
    this.router.navigate(['/usuarios']);
  }

  irParaTiposDemandas() {
    this.router.navigate(['/tipos-demandas']);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
  
  irParaVeiculos() {
    this.router.navigate(['/veiculos']);
  }

  enderecoMapa = 'Toledo PR';
}
