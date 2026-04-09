import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { Usuarios } from './pages/usuarios/usuarios';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'home', component: Home },
  { path: 'usuarios', component: Usuarios },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
