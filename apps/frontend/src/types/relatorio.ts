import { PageResponse } from "./clinical";

export enum StatusRelatorioEnum {
  PROCESSANDO = "PROCESSANDO",
  CONCLUIDO = "CONCLUIDO",
  ERRO = "ERRO",
  CANCELADO = "CANCELADO",
}

export enum RelatorioTipo {
  ESTADO_ATUAL = "ESTADO_ATUAL",
  HISTORICO_MUDANCAS = "HISTORICO_MUDANCAS",
  RELATORIO_GERAL = "RELATORIO_GERAL",
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
  tipoRelatorio: RelatorioTipo;
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
  tipoRelatorio: RelatorioTipo;
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
  tipoRelatorio: RelatorioTipo;
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
  updatedAt: string;
}

export interface RelatorioItemDto {
  tipoEntidade: string; // GUIA, FICHA
  entidadeId: string;
  pacienteNome?: string;
  pacienteId?: string;
  convenioNome?: string;
  numeroGuia?: string;
  guiaId?: string;
  codigoFicha?: string;
  fichaId?: string;
  status: string;
  especialidade?: string;
  mes?: number;
  ano?: number;
  quantidadeAutorizada?: number;
  dataAtualizacao: string;
  unidade?: string;
  usuarioResponsavelNome?: string;
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

export const relatorioItemHelpers = {
  getNumeroOuCodigo: (item: RelatorioItemDto): string => {
    if (item.tipoEntidade === "GUIA" && item.numeroGuia) {
      return item.numeroGuia;
    } else if (item.tipoEntidade === "FICHA" && item.codigoFicha) {
      return item.codigoFicha;
    }
    return "-";
  },

  getMesFormatado: (item: RelatorioItemDto): string => {
    if (item.mes && item.ano) {
      return `${item.mes.toString().padStart(2, "0")}/${item.ano}`;
    }
    return "-";
  },

  getQuantidadeFormatada: (item: RelatorioItemDto): string => {
    return item.quantidadeAutorizada?.toString() || "-";
  },

  formatDataAtualizacao: (dataString: string): string => {
    try {
      const data = new Date(dataString);
      return (
        data.toLocaleDateString("pt-BR") +
        " " +
        data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return "-";
    }
  },
};
