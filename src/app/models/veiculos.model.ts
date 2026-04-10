export interface Veiculo {
  id?: number;
  marcaVeiculo: string;
  modeloVeiculo: string;
  placaVeiculo: string;
  anoVeiculo: number | null;
  kmAtual: number | null;
  statusVeiculo: boolean;
  quantidadeLugares: number | null;
}
