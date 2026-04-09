export enum Atribuicao {
  SOLICITANTE = 'SOLICITANTE',
  EXECUTOR = 'EXECUTOR',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

export interface Usuario {

  id?: number;
  nome: string;
  email: string;
  telefone: string;
  senha?: string;
  ativo?: boolean;
  atribuicao: Atribuicao;
}
