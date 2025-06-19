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
  especialidades: string[];
  quantidadeAutorizada: number;
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
  pacienteNome: string;
  especialidades: string[];
  quantidadeAutorizada: number;
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
  especialidades: string[];
  quantidadeAutorizada: number;
  convenioId: string;
  mes: number;
  ano: number;
  validade: string;
  lote?: string;
  valorReais?: number;
}

export interface GuiaUpdateRequest {
  especialidades?: string[];
  quantidadeAutorizada?: number;
  mes?: number;
  ano?: number;
  validade?: string;
  lote?: string;
  valorReais?: number;
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
}

export interface FichaCreateRequest {
  guiaId: string;
  especialidade: string;
  quantidadeAutorizada: number;
  convenioId: string;
  mes: number;
  ano: number;
}

export interface FichaAssinaturaCreateRequest {
  pacienteId: string;
  especialidade: string;
  quantidadeAutorizada: number;
  convenioId: string;
  mes: number;
  ano: number;
}

export interface FichaUpdateRequest {
  especialidade?: string;
  quantidadeAutorizada?: number;
  mes?: number;
  ano?: number;
}

export interface StatusDto {
  id: string;
  status: string;
  descricao: string;
  cor: string;
  icone?: string;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StatusCreateRequest {
  status: string;
  descricao: string;
  cor: string;
  icone?: string;
  ordem?: number;
}

export interface StatusUpdateRequest {
  status?: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  ordem?: number;
  ativo?: boolean;
}

export interface StatusHistoryDto {
  id: string;
  entityType: EntityTypeEnum;
  entityId: string;
  statusAnterior: string;
  statusNovo: string;
  motivo: string;
  observacoes?: string;
  alteradoPorId: string;
  alteradoPorNome: string;
  alteradoPorEmail: string;
  dataAlteracao: string;
  createdAt: string;
  updatedAt: string;
  entityDescricao?: string;
  numeroGuia?: string;
  codigoFicha?: string;
}

export interface StatusHistorySummaryDto {
  id: string;
  entityType: EntityTypeEnum;
  entityId: string;
  statusAnterior: string;
  statusNovo: string;
  motivo: string;
  alteradoPorNome: string;
  dataAlteracao: string;
  entityDescricao: string;
}

export interface StatusChangeRequest {
  novoStatus: string;
  motivo: string;
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
