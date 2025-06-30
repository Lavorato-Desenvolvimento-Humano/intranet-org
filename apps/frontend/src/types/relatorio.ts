import { PageResponse } from "./clinical";

export enum StatusRelatorioEnum {
  PROCESSANDO = "PROCESSANDO",
  CONCLUIDO = "CONCLUIDO",
  ERRO = "ERRO",
  CANCELADO = "CANCELADO",
}

export interface RelatorioDto {
  id: string;
  titulo: string;
  descricao?: string;
  usuarioGeradorId: string;
  usuarioGeradorNome: string;
  periodoInicio: string;
  periodoFim: string;
  filtros: Record<string, any>;
  totalRegistros: number;
  hashCompartilhamento?: string;
  statusRelatorio: StatusRelatorioEnum;
  createdAt: string;
  updatedAt: string;
}

export interface RelatorioCreateRequest {
  titulo: string;
  descricao?: string;
  periodoInicio: string;
  periodoFim: string;
  usuarioResponsavelId?: string;
  status?: string[];
  especialidades?: string[];
  convenioIds?: string[];
  unidades?: string[]; // KIDS, SENIOR
  tipoEntidade?: string; // GUIA, FICHA, PACIENTE, TODOS
  incluirGraficos?: boolean;
  incluirEstatisticas?: boolean;
  formatoSaida?: string; // PDF, EXCEL
}

export interface RelatorioFilterRequest {
  titulo?: string;
  usuarioGeradorId?: string;
  statusRelatorio?: StatusRelatorioEnum;
  periodoInicio?: string;
  periodoFim?: string;
  tipoEntidade?: string;
}

export interface RelatorioDataDto {
  titulo: string;
  usuarioGerador: string;
  periodoInicio: string;
  periodoFim: string;
  totalRegistros: number;
  dataGeracao: string;
  filtrosAplicados: Record<string, any>;
  itens: RelatorioItemDto[];
  distribuicaoPorStatus: Record<string, number>;
  distribuicaoPorEspecialidade: Record<string, number>;
  distribuicaoPorConvenio: Record<string, number>;
  distribuicaoPorUnidade: Record<string, number>;
  timelineData: GraficoTimelineDto[];
}

export interface RelatorioSummaryDto {
  id: string;
  titulo: string;
  usuarioGeradorNome: string;
  periodoInicio: string;
  periodoFim: string;
  totalRegistros: number;
  statusRelatorio: StatusRelatorioEnum;
  createdAt: string;
  possuiCompartilhamento: boolean;
}

export interface RelatorioItemDto {
  tipoEntidade: string; // GUIA, FICHA, PACIENTE
  entidadeId: string;
  pacienteNome?: string;
  pacienteId?: string;
  numeroGuia?: string;
  guiaId?: string;
  codigoFicha?: string;
  fichaId?: string;
  convenioNome?: string;
  status: string;
  especialidade?: string;
  unidade?: string;
  mes?: number;
  ano?: number;
  quantidadeAutorizada?: number;
  usuarioResponsavelNome?: string;
  dataAtualizacao: string;
  statusAnterior?: string;
  statusNovo?: string;
  motivoMudanca?: string;
  dataMudancaStatus?: string;
}

export interface GraficoTimelineDto {
  data: string;
  total: number;
  porStatus: Record<string, number>;
  porEspecialidade: Record<string, number>;
}

export interface RelatorioCompartilhamentoDto {
  id: string;
  relatorioId: string;
  relatorioTitulo: string;
  usuarioOrigemId: string;
  usuarioOrigemNome: string;
  usuarioDestinoId: string;
  usuarioDestinoNome: string;
  observacao?: string;
  dataCompartilhamento: string;
  visualizado: boolean;
  dataVisualizacao?: string;
}

export interface RelatorioCompartilhamentoRequest {
  usuarioDestinoId: string;
  observacao?: string;
}

export interface RelatorioLogDto {
  id: string;
  acao: string;
  usuarioId: string;
  usuarioNome: string;
  detalhes: Record<string, any>;
  ipAddress: string;
  createdAt: string;
}

export type RelatorioPageResponse = PageResponse<RelatorioSummaryDto>;
export type CompartilhamentoPageResponse =
  PageResponse<RelatorioCompartilhamentoDto>;

export interface RelatorioEstatisticas {
  totalRelatorios: number;
  relatoriosConcluidos: number;
  relatoriosProcessando: number;
  relatoriosErro: number;
  compartilhamentosRecebidos: number;
  compartilhamentosEnviados: number;
  ultimoRelatorio?: RelatorioSummaryDto;
}
