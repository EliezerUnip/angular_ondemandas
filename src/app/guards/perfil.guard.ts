import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

type Perfil = 'SOLICITANTE' | 'EXECUTOR' | 'ADMINISTRADOR';

interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  atribuicao: Perfil;
}

export const perfilGuard: CanActivateFn = (route) => {
  const router = inject(Router);

  const usuarioSalvo = sessionStorage.getItem('usuarioLogado');

  if (!usuarioSalvo) {
    router.navigate(['/login']);
    return false;
  }

  const usuario = JSON.parse(usuarioSalvo) as UsuarioLogado;

  const perfisPermitidos = route.data?.['perfis'] as Perfil[];

  if (!perfisPermitidos || perfisPermitidos.length === 0) {
    return true;
  }

  if (perfisPermitidos.includes(usuario.atribuicao)) {
    return true;
  }

  alert('Você não tem permissão para acessar esta página.');

  if (usuario.atribuicao === 'ADMINISTRADOR') {
    router.navigate(['/home']);
  } else {
    router.navigate(['/demandas']);
  }

  return false;
};
