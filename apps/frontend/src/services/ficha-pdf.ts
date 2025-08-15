import { PacienteSummaryDto } from "@/types/clinical";
import api from "./api";
import {
  FichaPdfPacienteRequest,
  FichaPdfConvenioRequest,
  FichaPdfLoteRequest,
  FichaPdfResponseDto,
  FichaPdfStatusDto,
  FichaPdfJobDto,
  ConvenioDto,
  FichaPdfPreviaDto,
  FichaPdfPreviaRequest,
  FichaPdfValidacaoRequest,
  FichaPdfValidacaoDto,
  FichaPdfEstatisticasDto,
  FichaPdfInfoDto,
  ConvenioEstatisticasDto,
  ConvenioFichaPdfConfigDto,
  PacienteVerificacaoDto,
  FichaPdfConfiguracaoDto,
  FichaPdfPageResponse,
  FichaPdfItemDto, // Importar o tipo que faltava
} from "@/types/fichaPdf";

const fichaPdfService = {
  // Geração de fichas

  /**
   * Busca pacientes por nome para seleção em geração de fichas PDF
   */
  buscarPacientesParaFichaPdf: async (
    nome: string,
    limit: number = 10
  ): Promise<PacienteSummaryDto[]> => {
    try {
      if (nome.trim().length < 2) {
        return [];
      }

      console.log("Buscando pacientes por nome:", nome);
      const response = await api.get<PacienteSummaryDto[]>(
        `/api/fichas-pdf/pacientes/buscar`,
        {
          params: { nome: nome.trim(), limit },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
      return [];
    }
  },

  /*
   * Gera fichas PDF para um paciente específico
   */
  gerarFichasPaciente: async (
    request: FichaPdfPacienteRequest
  ): Promise<FichaPdfResponseDto> => {
    try {
      console.log("Gerando fichas para paciente:", request);
      const response = await api.post<FichaPdfResponseDto>(
        "/api/fichas-pdf/paciente",
        request
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao gerar fichas para paciente:", error);
      throw error;
    }
  },

  /*
   * Gera fichas PDF para um convênio específico (assíncrono)
   */
  gerarFichasConvenio: async (
    request: FichaPdfConvenioRequest
  ): Promise<{
    message: string;
    jobId: string;
    async: boolean;
    statusUrl: string;
  }> => {
    try {
      console.log("Gerando fichas para convênio:", request);
      const response = await api.post<{
        message: string;
        jobId: string;
        async: boolean;
        statusUrl: string;
      }>("/api/fichas-pdf/convenio", request);
      return response.data;
    } catch (error) {
      console.error("Erro ao gerar fichas para convênio:", error);
      throw error;
    }
  },

  gerarFichasLote: async (
    request: FichaPdfLoteRequest
  ): Promise<{
    message: string;
    jobId: string;
    async: boolean;
    statusUrl: string;
  }> => {
    try {
      console.log("Gerando fichas em lote:", request);
      const response = await api.post<{
        message: string;
        jobId: string;
        async: boolean;
        statusUrl: string;
      }>("/api/fichas-pdf/lote", request);
      return response.data;
    } catch (error) {
      console.error("Erro ao gerar fichas em lote:", error);
      throw error;
    }
  },

  //Status e monitoramento
  getStatusGeracao: async (jobId: string): Promise<FichaPdfStatusDto> => {
    try {
      const response = await api.get<FichaPdfStatusDto>(
        `/api/fichas-pdf/status/${jobId}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao obter status de geração:", error);
      throw error;
    }
  },

  /*
   * Lista jobs de geração do usuário
   */
  getJobsUsuario: async (
    page: number = 0,
    size: number = 20
  ): Promise<FichaPdfJobDto[]> => {
    try {
      const response = await api.get<FichaPdfJobDto[]>("/api/fichas-pdf/jobs", {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao listar jobs do usuário:", error);
      throw error;
    }
  },

  /*
   * Cancelar um job especifico
   */
  cancelarJob: async (
    jobId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/fichas-pdf/cancelar/${jobId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao cancelar job ${jobId}:`, error);
      throw error;
    }
  },

  // Download
  baixarPdf: async (jobId: string): Promise<Blob> => {
    try {
      const response = await api.get(`/api/fichas-pdf/download/${jobId}`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao baixar PDF do job ${jobId}:`, error);
      throw error;
    }
  },

  baixarESalvarPdf: async (
    jobId: string,
    nomeArquivo?: string
  ): Promise<void> => {
    try {
      const blob = await fichaPdfService.baixarPdf(jobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nomeArquivo || `fichas_-${jobId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Erro ao baixar e salvar PDF:`, error);
      throw error;
    }
  },

  //Convênios

  /*
   * Lista de convênios habilitados para geração de fichas PDF
   */
  getConveniosHabilitados: async (): Promise<ConvenioDto[]> => {
    try {
      const response = await api.get<ConvenioDto[]>(
        "/api/fichas-pdf/convenios-habilitados"
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao obter convênios habilitados:", error);
      throw error;
    }
  },

  /**
   * Obtém configuração específica de um convênio para geração de PDF
   */
  getConvenioConfig: async (
    convenioId: string
  ): Promise<ConvenioFichaPdfConfigDto> => {
    try {
      const response = await api.get<ConvenioFichaPdfConfigDto>(
        `/api/fichas-pdf/convenios/${convenioId}/config`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao obter configuração do convênio ${convenioId}:`,
        error
      );
      throw error;
    }
  },

  /*
   * Habilita/desabilita convênio para geração de PDF
   */
  toggleConvenioHabilitado: async (
    convenioId: string,
    habilitado: boolean
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // CORREÇÃO: URL para "convenios" (plural) e "habilitado" como query param
      const response = await api.put<{ success: boolean; message: string }>(
        `/api/fichas-pdf/convenios/${convenioId}/toggle`,
        {}, // Corpo vazio
        { params: { habilitado } } // Parâmetro na query string
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao alternar habilitação do convênio ${convenioId}:`,
        error
      );
      throw error;
    }
  },

  /*
   * Obtém as estatísticas de um convênio específico
   */
  getEstatisticasConvenio: async (
    convenioId: string,
    mes: number,
    ano: number
  ): Promise<ConvenioEstatisticasDto> => {
    try {
      // CORREÇÃO: Adicionar mes e ano como query params
      const response = await api.get<ConvenioEstatisticasDto>(
        `/api/fichas-pdf/convenio/${convenioId}/estatisticas-fichas`,
        { params: { mes, ano } }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao obter estatísticas do convênio ${convenioId}:`,
        error
      );
      throw error;
    }
  },

  // Previa e validação

  /**
   * Gera prévia de convênio (estimativa de fichas)
   */
  gerarPreviaConvenio: async (
    request: FichaPdfConvenioRequest // CORREÇÃO: O endpoint de prévia espera o mesmo request da geração por convênio
  ): Promise<FichaPdfPreviaDto> => {
    try {
      const response = await api.post<FichaPdfPreviaDto>(
        "/api/fichas-pdf/convenio/previa",
        request
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao gerar prévia de convênio:", error);
      throw error;
    }
  },

  /**
   * Verifica fichas existentes para um paciente
   */
  verificarFichasPaciente: async (
    pacienteId: string,
    mes: number,
    ano: number,
    especialidades?: string[]
  ): Promise<PacienteVerificacaoDto> => {
    try {
      // CORREÇÃO: Adicionar mes, ano e especialidades como query params
      const response = await api.get<PacienteVerificacaoDto>(
        `/api/fichas-pdf/paciente/${pacienteId}/verificar-fichas`,
        { params: { mes, ano, especialidades } }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao verificar fichas do paciente ${pacienteId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Gera preview de uma ficha (apenas HTML, sem PDF)
   */
  gerarPreviewFicha: async (
    item: FichaPdfItemDto
  ): Promise<{ html: string }> => {
    try {
      // CORREÇÃO: Renomeado, tipo de request corrigido e tipo de response ajustado
      const response = await api.post<{ html: string }>(
        "/api/fichas-pdf/preview",
        item
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao gerar preview da ficha:", error);
      throw error;
    }
  },

  /**
   * Valida parâmetros de geração
   */
  validarParametros: async (
    request: FichaPdfValidacaoRequest
  ): Promise<FichaPdfValidacaoDto> => {
    try {
      const response = await api.post<FichaPdfValidacaoDto>(
        "/api/fichas-pdf/validar",
        request
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao validar parâmetros:", error);
      throw error;
    }
  },

  // Estatísticas e informações

  getEstatisticas: async (
    mes?: number,
    ano?: number
  ): Promise<FichaPdfEstatisticasDto> => {
    try {
      const params: any = {};
      if (mes) params.mes = mes;
      if (ano) params.ano = ano;

      const response = await api.get<FichaPdfEstatisticasDto>(
        "/api/fichas-pdf/estatisticas",
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      throw error;
    }
  },

  /**
   * Obtém informações do sistema de fichas PDF
   */
  getInfo: async (): Promise<FichaPdfInfoDto> => {
    try {
      const response = await api.get<FichaPdfInfoDto>("/api/fichas-pdf/info");
      return response.data;
    } catch (error) {
      console.error("Erro ao obter informações do sistema de fichas", error);

      // Retornar dados padrão se o endpoint não estiver disponível
      const fallbackInfo: FichaPdfInfoDto = {
        versaoSistema: "2.0.0",
        limitesOperacionais: {
          maxJobSimultaneos: 5,
          maxFichasPorJob: 1000,
          tempoRetencaoArquivos: "7 dias",
        },
        configuracaoGlobal: {
          batchSize: 50,
          timeoutMinutos: 30,
          formatoPadrao: "A4",
          compressao: true,
          qualidade: "ALTA",
        },
        statusServico: {
          ativo: false, // Marcar como inativo se não conseguir conectar
          queueSize: 0,
          processandoAtualmente: 0,
        },
      };

      return fallbackInfo;
    }
  },

  //Configurações (ADMIN)

  /**
   * Obtém as configurações do sistema
   */
  getConfiguracoes: async (): Promise<FichaPdfConfiguracaoDto> => {
    try {
      const response = await api.get<FichaPdfConfiguracaoDto>(
        "/api/fichas-pdf/configuracoes"
      );
      return response.data;
    } catch (error) {
      console.error(
        "Erro ao obter configurações do sistema de fichas PDF:",
        error
      );
      throw error;
    }
  },

  limparCache: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        "/api/fichas-pdf/limpar-cache"
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao limpar cache: ", error);
      throw error;
    }
  },

  monitorarJob: async (
    jobId: string,
    onUpdate: (status: FichaPdfStatusDto) => void,
    intervalMs: number = 2000
  ): Promise<void> => {
    const checkStatus = async () => {
      try {
        const status = await fichaPdfService.getStatusGeracao(jobId);
        onUpdate(status);

        // Continuar monitorando se ainda estiver em processamento
        if (status.status === "INICIADO" || status.status === "PROCESSANDO") {
          setTimeout(checkStatus, intervalMs);
        }
      } catch (error) {
        console.error(`Erro ao monitorar job ${jobId}:`, error);
        setTimeout(checkStatus, intervalMs * 2);
      }
    };
  },

  /**
   * Verifica se um job ainda existe no sistema
   */
  verificarExistenciaJob: async (jobId: string): Promise<boolean> => {
    try {
      const response = await api.get(`/api/fichas-pdf/jobs/${jobId}/exists`);
      return response.data.existe;
    } catch (error: any) {
      // Se retornar 404, o job foi removido pela limpeza
      if (error.response?.status === 404) {
        return false;
      }
      console.warn(`Erro ao verificar existência do job ${jobId}:`, error);
      return false;
    }
  },

  /**
   * Lista jobs do usuário atual (apenas os que existem no sistema)
   */
  getMeusJobs: async (): Promise<FichaPdfJobDto[]> => {
    try {
      const response = await api.get<FichaPdfJobDto[]>(
        "/api/fichas-pdf/meus-jobs"
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao listar meus jobs:", error);
      return [];
    }
  },

  /**
   * Monitora um job com verificação automática de existência
   */
  monitorarJobComLimpeza: async (
    jobId: string,
    onUpdate: (status: FichaPdfStatusDto | null) => void,
    onJobRemovido?: () => void,
    intervalMs: number = 2000
  ): Promise<void> => {
    const checkStatus = async () => {
      try {
        // Primeiro verificar se o job ainda existe
        const existe = await fichaPdfService.verificarExistenciaJob(jobId);

        if (!existe) {
          console.info(`Job ${jobId} foi removido pela limpeza automática`);
          onUpdate(null);
          if (onJobRemovido) {
            onJobRemovido();
          }
          return;
        }

        // Se existe, buscar o status
        const status = await fichaPdfService.getStatusGeracao(jobId);
        onUpdate(status);

        // Continuar monitorando se ainda estiver em processamento
        if (status.status === "INICIADO" || status.status === "PROCESSANDO") {
          setTimeout(checkStatus, intervalMs);
        }
      } catch (error) {
        console.error(`Erro ao monitorar job ${jobId}:`, error);

        // Tentar novamente após um intervalo maior em caso de erro
        setTimeout(checkStatus, intervalMs * 2);
      }
    };

    await checkStatus();
  },

  /**
   * Limpa jobs removidos de uma lista local
   */
  filtrarJobsExistentes: async (jobIds: string[]): Promise<string[]> => {
    const jobsExistentes: string[] = [];

    for (const jobId of jobIds) {
      const existe = await fichaPdfService.verificarExistenciaJob(jobId);
      if (existe) {
        jobsExistentes.push(jobId);
      }
    }

    return jobsExistentes;
  },

  /**
   * Verifica se o job pode ser cancelado
   */
  podeSerCancelado: (status: FichaPdfStatusDto): boolean => {
    return status.status === "INICIADO" || status.status === "PROCESSANDO";
  },

  estaFinalizado: (status: FichaPdfStatusDto): boolean => {
    return (
      status.status === "CONCLUIDO" ||
      status.status === "ERRO" ||
      status.status === "CANCELADO"
    );
  },

  /**
   * Calcula o tempo restante estimado para o job
   */
  calcularTempoRestante: (status: FichaPdfStatusDto): string | null => {
    if (status.status !== "PROCESSANDO" || status.progresso >= 100) {
      return null;
    }

    //Estimar baseado no progresso atual
    const tempoDecorrido =
      new Date().getTime() - new Date(status.iniciado).getTime();
    const progressoDecimal = status.progresso / 100;

    if (progressoDecimal === 0) {
      return "Calculando...";
    }

    const tempoEstimadoTotal = tempoDecorrido / progressoDecimal;
    const tempoRestante = tempoEstimadoTotal - tempoDecorrido;

    const segundos = Math.ceil(tempoRestante / 1000);

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
};

export default fichaPdfService;
