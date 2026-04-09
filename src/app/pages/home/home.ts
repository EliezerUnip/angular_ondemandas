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

  logout() {
    // se usar token futuramente
    localStorage.clear();

    // redireciona para login
    this.router.navigate(['/login']);
  }

  enderecoMapa = 'Toledo PR';
}
