// src/types/demanda.ts

export type DemandaStatus = "pendente" | "em_andamento" | "concluida";

export type DemandaPrioridade = "baixa" | "media" | "alta";

export interface Demanda {
  id: string;
  titulo: string;
  descricao: string;
  dataInicio: string; // ISO date string
  dataFim: string; // ISO date string
  criadoPorId: string;
  criadoPorNome: string;
  atribuidoParaId: string;
  atribuidoParaNome: string;
  status: DemandaStatus;
  prioridade: DemandaPrioridade;
  criadaEm: string; // ISO date string
  atualizadaEm: string; // ISO date string
  podeEditar?: boolean;
}

export interface DemandaCreateDto {
  titulo: string;
  descricao: string;
  dataInicio: string; // ISO date string
  dataFim: string; // ISO date string
  atribuidoParaId: string;
  prioridade?: DemandaPrioridade;
  status?: DemandaStatus;
}

export interface DemandaUpdateDto {
  id?: string; // Tornando opcional para compatibilidade
  titulo?: string;
  descricao?: string;
  dataInicio?: string; // ISO date string
  dataFim?: string; // ISO date string
  atribuidoParaId?: string;
  status?: DemandaStatus;
  prioridade?: DemandaPrioridade;
}

export interface DemandaFilterParams {
  status?: DemandaStatus;
  prioridade?: DemandaPrioridade;
  dataInicio?: string;
  dataFim?: string;
  atribuidoParaId?: string;
  criadoPorId?: string;
  textoBusca?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface DemandaAudit {
  id: string;
  demandaId: string;
  campo: string;
  valorAntigo: string;
  valorNovo: string;
  usuarioId: string;
  usuarioNome: string;
  timestamp: string;
}

export interface DemandaStats {
  totalDemandas: number;
  pendentes: number;
  emAndamento: number;
  concluidas: number;
  atrasadas: number;
  proximasAVencer: number; // próximos 3 dias
}

// Interface para representar demandas no formato de eventos de calendário
export interface DemandaEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    demandaId: string;
    prioridade: DemandaPrioridade;
    status: DemandaStatus;
    atribuidoParaNome: string;
  };
}

// Mapeamento de cores por prioridade e status para visualizações
export const PRIORIDADE_COLORS = {
  baixa: "#4CAF50", // verde
  media: "#FF9800", // laranja
  alta: "#F44336", // vermelho
};

export const STATUS_COLORS = {
  pendente: "#2196F3", // azul
  em_andamento: "#FF9800", // laranja
  concluida: "#4CAF50", // verde
};

// Helper para determinar se uma demanda está atrasada
export function isDemandaAtrasada(demanda: Demanda): boolean {
  if (demanda.status === "concluida") return false;
  const hoje = new Date();
  const dataFim = new Date(demanda.dataFim);
  return dataFim < hoje;
}

// Helper para determinar se uma demanda está próxima a vencer
export function isDemandaProximaAVencer(demanda: Demanda): boolean {
  if (demanda.status === "concluida") return false;
  const hoje = new Date();
  const dataFim = new Date(demanda.dataFim);
  const diffDias = Math.ceil(
    (dataFim.getTime() - hoje.getTime()) / (1000 * 3600 * 24)
  );
  return diffDias >= 0 && diffDias <= 3;
}
