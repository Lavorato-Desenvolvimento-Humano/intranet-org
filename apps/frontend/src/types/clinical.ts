// src/types/clinical.ts
// Enums
export enum UnidadeEnum {
  KIDS = "KIDS",
  SENIOR = "SENIOR",
}

export enum TipoFichaEnum {
  COM_GUIA = "COM_GUIA",
  ASSINATURA = "ASSINATURA",
}

export enum EntityTypeEnum {
  GUIA = "GUIA",
  FICHA = "FICHA",
}

export interface GuiaItem {
  id?: string;
  especialidade: string;
  quantidadeAutorizada: number;
  quantidadeExecutada?: number;
}

export interface GuiaItemRequest {
  especialidade: string;
  quantidade: number;
}

export interface PacienteDto {
  id: string;
  nome: string;
  dataNascimento: string;
  responsavel?: string;
  convenioId: string;
  convenioNome: string;
  unidade: UnidadeEnum;
  createdAt: string;
  updatedAt: string;
  createdByName: string;
}

export interface PacienteSummaryDto {
  id: string;
  nome: string;
  responsavel?: string;
  dataNascimento: string;
  convenioId: string;
  convenioNome: string;
  unidade: UnidadeEnum;
  createdAt: string;
}

export interface PacienteCreateRequest {
  nome: string;
  dataNascimento: string;
  responsavel?: string;
  convenioId: string;
  unidade: UnidadeEnum;
}

export interface PacienteUpdateRequest {
  nome?: string;
  dataNascimento?: string;
  responsavel?: string;
  convenioId?: string;
  unidade?: UnidadeEnum;
}

export interface GuiaDto {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  numeroGuia: string;
  numeroVenda: string;
  itens: GuiaItem[];
  // especialidades: string[];
  // quantidadeAutorizada: number;
  convenioId: string;
  convenioNome: string;
  mes: number;
  ano: number;
  validade: string;
  lote?: string;
  quantidadeFaturada: number;
  valorReais: number;
  status: string;
  usuarioResponsavelId: string;
  usuarioResponsavelNome: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuiaSummaryDto {
  id: string;
  numeroGuia: string;
  numeroVenda: string;
  pacienteNome: string;
  // especialidades: string[];
  quantidadeAutorizada: number;
  itens: GuiaItem[];
  convenioNome: string;
  valorReais: number;
  mes: number;
  ano: number;
  validade: string;
  status: string;
  usuarioResponsavelNome: string;
  createdAt: string;
}

export interface GuiaCreateRequest {
  pacienteId: string;
  numeroGuia: string;
  numeroVenda: string;
  status: string;
  itens: GuiaItemRequest[];
  convenioId: string;
  mes: number;
  ano: number;
  validade: string;
  lote?: string;
  valorReais?: number;
  quantidadeFaturada?: number;
}

export interface GuiaUpdateRequest {
  // especialidades?: string[];
  // quantidadeAutorizada?: number;
  itens?: GuiaItem[];
  numeroVenda?: string;
  mes?: number;
  ano?: number;
  validade?: string;
  lote?: string;
  valorReais?: number;
  quantidadeFaturada?: number;
  status?: string;
}

export interface FichaDto {
  id: string;
  guiaId?: string;
  pacienteId?: string;
  codigoFicha: string;
  status: string;
  pacienteNome: string;
  especialidade: string;
  quantidadeAutorizada: number;
  convenioId: string;
  convenioNome: string;
  mes: number;
  ano: number;
  tipoFicha: TipoFichaEnum;
  usuarioResponsavelId: string;
  usuarioResponsavelNome: string;
  createdAt: string;
  updatedAt: string;
}

export interface FichaSummaryDto {
  id: string;
  codigoFicha: string;
  status: string;
  pacienteNome: string;
  especialidade: string;
  quantidadeAutorizada: number;
  convenioNome: string;
  mes: number;
  ano: number;
  usuarioResponsavelNome: string;
  createdAt: string;
  tipoFicha?: TipoFichaEnum;
  guiaId?: string;
}

export interface FichaCreateRequest {
  guiaId: string;
  especialidade: string;
  quantidadeAutorizada: number;
  convenioId: string;
  mes: number;
  ano: number;
  status: string;
}

export interface FichaAssinaturaCreateRequest {
  pacienteId: string;
  especialidade: string;
  quantidadeAutorizada: number;
  convenioId: string;
  mes: number;
  ano: number;
  status: string;
}

export interface FichaUpdateRequest {
  especialidade?: string;
  quantidadeAutorizada?: number;
  mes?: number;
  ano?: number;
  status?: string;
}

export interface StatusDto {
  id: string;
  status: string;
  descricao?: string;
  ativo: boolean;
  cor: string;
  ordemExibicao?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatusCreateRequest {
  status: string;
  descricao?: string;
  ativo: boolean;
  ordemExibicao?: number;
}

export interface StatusUpdateRequest {
  status: string;
  descricao?: string;
  ativo: boolean;
  ordemExibicao?: number;
}

export interface StatusHistoryDto {
  id: string;
  entityType: string;
  entityId: string;
  statusAnterior?: string;
  statusNovo: string;
  motivo?: string;
  observacoes?: string;
  dataAlteracao: string;
  alteradoPorId: string;
  alteradoPorNome: string;
  alteradoPorEmail: string;
}

export interface StatusHistorySummaryDto {
  id: string;
  entityType: string;
  entityId: string;
  statusAnterior?: string;
  statusNovo: string;
  motivo?: string;
  dataAlteracao: string;
  alteradoPorNome: string;
  alteradoPorEmail: string;
}

export interface StatusHistoryCreateRequest {
  entityType: string;
  entityId: string;
  statusAnterior?: string;
  statusNovo: string;
  motivo?: string;
  observacoes?: string;
}

export interface StatusHistoryFilterRequest {
  entityType?: string;
  entityId?: string;
  statusNovo?: string;
  alteradoPorId?: string;
  startDate?: string;
  endDate?: string;
}

export interface StatusStatsDto {
  totalStatuses: number;
  statusesAtivos: number;
  statusesInativos: number;
  ultimaAtualizacao?: string;
}

export interface StatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export interface StatusChangeRequest {
  novoStatus: string;
  motivo?: string;
  observacoes?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface ClinicalStats {
  totalPacientes: number;
  pacientesKids: number;
  pacientesSenior: number;
  totalGuias: number;
  guiasVencidas: number;
  guiasComQuantidadeExcedida: number;
  totalFichas: number;
  fichasPorStatus: Record<string, number>;
}

export interface FichaStats {
  totalFichas: number;
  fichasPorStatus: Record<string, number>;
  fichasPorConvenio?: Record<string, number>;
  fichasPorUnidade?: Record<string, number>;
}

export interface StatusInitializeResponse {
  message: string;
  statusesCriados: number;
  statusesExistentes: number;
  detalhes: string[];
}
