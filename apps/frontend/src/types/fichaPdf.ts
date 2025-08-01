import { Inclusive_Sans } from "next/font/google";
import { PageResponse } from "./clinical";

/*
 * Enums
 */

export enum StatusJobEnum {
  INICIADO = "INICIADO",
  PROCESSANDO = "PROCESSANDO",
  CONCLUIDO = "CONCLUIDO",
  ERRO = "ERRO",
  CANCELADO = "CANCELADO",
}

export enum TipoGeracaoEnum {
  PACIENTE = "PACIENTE",
  CONVENIO = "CONVENIO",
  LOTE = "LOTE",
}

/*
 * DTOS PRINCIPAIS
 */
export interface FichaPdfPacienteRequest {
  pacienteId: string;
  mes: number;
  ano: number;
  especialidades?: string[];
  incluirInativos?: boolean;
}

export interface FichaPdfConvenioRequest {
  convenioId: string;
  mes: number;
  ano: number;
  especialidades?: string[];
  incluirInativos?: boolean;
}

export interface FichaPdfLoteRequest {
  convenioIds: string[];
  mes: number;
  ano: number;
  especialidades?: string[];
  incluirInativos?: boolean;
}

export interface FichaPdfResponseDto {
  sucesso: boolean;
  mensagem: string;
  jobId?: string;
  arquivo?: string;
  totalFichas?: number;
  dadosEstaticos?: {
    fichasPorConvenio: Record<string, number>;
    fichasPorEspecialidade: Record<string, number>;
    fichasPorUnidade: Record<string, number>;
  };
}

export interface FichaPdfStatusDto {
  jobId: string;
  status: StatusJobEnum;
  tipo: TipoGeracaoEnum;
  totalFichas: number;
  fichasProcessadas: number;
  progresso: number;
  iniciado: string;
  concluido?: string;
  erro?: string;
  podeDownload: boolean;
  arquivo?: string;
  usuarioNome: string;
  dadosJob?: {
    convenioNome?: string;
    pacienteNome?: string;
    mes: number;
    ano: number;
    especialidades?: string[];
  };
}

export interface FichaPdfJobDto {
  id: string;
  jobId: string;
  tipo: TipoGeracaoEnum;
  status: StatusJobEnum;
  totalFichas: number;
  fichasProcessadas: number;
  progresso: number;
  iniciado: string;
  concluido?: string;
  erro?: string;
  podeDownload: boolean;
  arquivo?: string;
  usuarioId: number;
  usuarioNome: string;
  createdAt: string;
  updatedAt: string;
}

export interface FichaPdfItemDto {
  pacienteId: string;
  pacienteNome: string;
  especialidade: string;
  mes: number;
  ano: number;
  mesExtenso: string;
  numeroIdentificacao: string;
  convenioId: string;
  convenioNome: string;
  unidade?: string;
  guiaId?: string;
  numeroGuia?: string;
  quantidadeAutorizada: number;
  ultimaAtividade?: string;
}

export interface ConvenioDto {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  postagemCount: number;
  pdfHabilitado: boolean;
}

export interface ConvenioFichaPdfConfigDto {
  id: string;
  convenioId: string;
  convenioNome: string;
  habilitado: boolean;
  diasAtividade: number;
  formatoPadrao: string;
  incluirLogo: boolean;
  incluirCarimbo: boolean;
  observacoes: string;
  createdAt: string;
  updatedAt: string;
}

/*
 * DTOS Prévia e Validação
 */
export interface FichaPdfPreviaRequest {
  pacienteId?: string;
  convenioId?: string;
  mes: number;
  ano: number;
  especialidades?: string[];
  incluirInativos?: boolean;
  tipoGeracao: "PACIENTE" | "CONVENIO";
}

export interface FichaPdfPreviaDto {
  totalFichasEstimadas: number;
  fichasPorConvenio: Record<string, number>;
  fichasPorEspecialidade: Record<string, number>;
  fichasPorUnidade: Record<string, number>;
  pacientesComFichas: {
    pacienteId: string;
    pacienteNome: string;
    totalFichas: number;
    especialidades: string[];
  }[];
  avisos: string[];
  bloqueios: string[];
}

export interface FichaPdfValidacaoRequest {
  pacienteId?: string;
  convenioId?: string;
  mes: number;
  ano: number;
  especialidades?: string[];
}

export interface FichaPdfValidacaoDto {
  valido: boolean;
  mensagem: string;
  fichasEstimadas: number;
  erros: Record<string, string>;
}

/*
 * DTOs para estatisticas e informações
 */
export interface FichaPdfEstatisticasDto {
  totalFichasGeradas: number;
  conveniosAtivos: number;
  jobsConcluidos: number;
  jobsEmAndamento: number;
  jobsComErro: number;
  totalJobs: number;
  periodo: string;
  taxaSucesso: number;
  fichasPorMes: Record<string, number>;
  conveniosMaisUtilizados: {
    convenioId: string;
    convenioNome: string;
    totalFichas: number;
  }[];
}

export interface FichaPdfInfoDto {
  versaoSistema: string;
  limitesOperacionais: {
    maxJobSimultaneos: number;
    maxFichasPorJob: number;
    tempoRetencaoArquivos: string;
  };
  configuracaoGlobal: {
    batchSize: number;
    timeoutMinutos: number;
    formatoPadrao: string;
    compressao: boolean;
    qualidade: string;
  };
  statusServico: {
    ativo: boolean;
    queueSize: number;
    processandoAtualmente: number;
  };
}

export interface ConvenioEstatisticasDto {
  convenioId: string;
  convenioNome: string;
  fichasGeradasMes: number;
  fichasGeradasAno: number;
  pacientesAtivos: number;
  especialidadesCobertas: string[];
  ultimaGeracao?: string;
  mediaFichasPorPaciente: number;
  distribuicaoPorUnidade: Record<string, number>;
}

export interface PacienteVerificacaoDto {
  pacienteId: string;
  pacienteNome: string;
  temFichasDisponiveis: boolean;
  fichasExistentes: {
    mes: number;
    ano: number;
    especialidade: string;
    numeroIdentificacao: string;
    dataGeracao: string;
  }[];
  proximasGeracoesPossiveis: {
    mes: number;
    ano: number;
    especialidades: string[];
  }[];
}

/*
 * Types auxiliares
 */
export type FichaPdfPageResponse = PageResponse<FichaPdfJobDto>;

/*
 * Helpers para manipulação de dados
 */
export interface FichaPdfConfiguracaoDto {
  conveniosHabilitados: ConvenioDto[];
  totalConvenios: number;
  configuracaoGlobal: {
    batchSize: number;
    timeoutMinutos: number;
    formatoPadrao: string;
    compressao: boolean;
    qualidade: string;
  };
  limitesOperacionais: {
    maxJobsSimultaneos: number;
    maxFichasPorJob: number;
    tempoRetencaoArquivos: string;
  };
  estatisticas: {
    conveniosAtivos: number;
    ultimaAtualizacao: number;
  };
}

export const fichaPdfHelpers = {
  getStatusColor: (status: StatusJobEnum): string => {
    switch (status) {
      case StatusJobEnum.CONCLUIDO:
        return "text-green-600";
      case StatusJobEnum.PROCESSANDO:
      case StatusJobEnum.INICIADO:
        return "text-blue-600";
      case StatusJobEnum.ERRO:
        return "text-red-600";
      case StatusJobEnum.CANCELADO:
        return "text-gray-600";
      default:
        return "text-gray-500";
    }
  },

  getStatusIcon: (status: StatusJobEnum): string => {
    switch (status) {
      case StatusJobEnum.CONCLUIDO:
        return "CheckCircle";
      case StatusJobEnum.PROCESSANDO:
      case StatusJobEnum.INICIADO:
        return "Clock";
      case StatusJobEnum.ERRO:
        return "XCircle";
      case StatusJobEnum.CANCELADO:
        return "Ban";
      default:
        return "Circle";
    }
  },

  formatarProgresso: (status: FichaPdfStatusDto): string => {
    if (status.status === StatusJobEnum.CONCLUIDO) {
      return "100%";
    }
    if (status.totalFichas === 0) {
      return "0%";
    }
    return `${Math.round(status.progresso)}%`;
  },

  formatarMesAno: (mes: number, ano: number): string => {
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return `${meses[mes - 1]} ${ano}`;
  },

  formatarDataHora: (dataString: string): string => {
    try {
      const data = new Date(dataString);
      return (
        data.toLocaleDateString("pt-BR") +
        " às " +
        data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return "-";
    }
  },

  getTipoGeracaoLabel: (tipo: TipoGeracaoEnum): string => {
    switch (tipo) {
      case TipoGeracaoEnum.PACIENTE:
        return "Paciente";
      case TipoGeracaoEnum.CONVENIO:
        return "Convênio";
      case TipoGeracaoEnum.LOTE:
        return "Lote";
      default:
        return tipo;
    }
  },

  calcularTempoEstimado: (totalFichas: number): string => {
    // Estimativa: ~2 fichas por segundo
    const segundos = Math.ceil(totalFichas / 2);

    if (segundos < 60) {
      return `${segundos}s`;
    } else if (segundos < 3600) {
      const minutos = Math.ceil(segundos / 60);
      return `${minutos}min`;
    } else {
      const horas = Math.floor(segundos / 3600);
      const minutosRestantes = Math.ceil((segundos % 3600) / 60);
      return `${horas}h${minutosRestantes > 0 ? ` ${minutosRestantes}min` : ""}`;
    }
  },

  validarPeriodo: (
    mes: number,
    ano: number
  ): { valido: boolean; erro?: string } => {
    const agora = new Date();
    const anoAtual = agora.getFullYear();
    const mesAtual = agora.getMonth() + 1;

    if (ano < 2020 || ano > anoAtual + 1) {
      return {
        valido: false,
        erro: "Ano deve estar entre 2020 e " + (anoAtual + 1),
      };
    }

    if (mes < 1 || mes > 12) {
      return { valido: false, erro: "Mês deve estar entre 1 e 12" };
    }

    // Verificar se não é futuro demais
    if (ano > anoAtual || (ano === anoAtual && mes > mesAtual + 1)) {
      return {
        valido: false,
        erro: "Não é possível gerar fichas para períodos muito futuros",
      };
    }

    return { valido: true };
  },
};
