import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { Usuarios } from './pages/usuarios/usuarios';
import { TiposDemandas } from './pages/tipos-demandas/tipos-demandas';
import { Veiculos } from './pages/veiculos/veiculos';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'home', component: Home },
  { path: 'usuarios', component: Usuarios },
  { path: 'tipos-demandas', component: TiposDemandas },
  { path: 'veiculos', component: Veiculos },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
