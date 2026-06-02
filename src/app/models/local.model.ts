export interface Local {
  id?: number;
  nomeLocal: string;
  latitude: number | null;
  longitude: number | null;
  cidade: string;
  endereco: string;
  ativo: boolean;
}
