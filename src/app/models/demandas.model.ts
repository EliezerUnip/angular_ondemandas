import { TipoDemanda } from './tipos-demandas.model';
import { Local } from './local.model';
import { Usuario } from './usuarios.model';

export type StatusDemanda =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export interface Demanda {
  id?: number;
  tipo: TipoDemanda;
  dataHoraCriacao: string;
  local: Local;
  solicitante: Usuario;
  observacoes: string;
  executor?: Usuario | null;
  dataHoraConclusao?: string | null;
  status: StatusDemanda;
  nomeReceptor?: string | null;
}

export interface DemandaRequest {
  tipoDemandaId: number | null;
  localId: number | null;
  solicitanteId: number | null;
  observacoes: string;
  nomeReceptor?: string;
}
