import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { Usuarios } from './pages/usuarios/usuarios';
import { TiposDemandas } from './pages/tipos-demandas/tipos-demandas';
import { Veiculos } from './pages/veiculos/veiculos';
import { Locais } from './pages/locais/locais';
import { Demandas } from './pages/demandas/demandas';
import { Rotas } from './pages/rotas/rotas';


import { perfilGuard } from './guards/perfil.guard';

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: 'home',
    component: Home,
    canActivate: [perfilGuard],
    data: { perfis: ['ADMINISTRADOR', 'SOLICITANTE', 'EXECUTOR'] },
  },

  {
    path: 'usuarios',
    component: Usuarios,
    canActivate: [perfilGuard],
    data: { perfis: ['ADMINISTRADOR'] },
  },

  {
    path: 'tipos-demandas',
    component: TiposDemandas,
    canActivate: [perfilGuard],
    data: { perfis: ['ADMINISTRADOR'] },
  },

  {
    path: 'veiculos',
    component: Veiculos,
    canActivate: [perfilGuard],
    data: { perfis: ['ADMINISTRADOR'] },
  },

  {
    path: 'locais',
    component: Locais,
    canActivate: [perfilGuard],
    data: { perfis: ['ADMINISTRADOR'] },
  },

  {
    path: 'demandas',
    component: Demandas,
    canActivate: [perfilGuard],
    data: { perfis: ['ADMINISTRADOR', 'SOLICITANTE', 'EXECUTOR'] },
  },

  {
    path: 'rotas',
    component: Rotas,
    canActivate: [perfilGuard],
    data: { perfis: ['EXECUTOR', 'ADMINISTRADOR'] },
  },
  
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
