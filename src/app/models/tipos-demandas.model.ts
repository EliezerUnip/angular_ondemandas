export interface TipoDemanda {
  id?: number;
  tipoDemanda: string;
  ativo: boolean;
}

export interface TipoDemandaRequest {
  tipoDemandaDescricao: string;
  ativo: boolean;
}
