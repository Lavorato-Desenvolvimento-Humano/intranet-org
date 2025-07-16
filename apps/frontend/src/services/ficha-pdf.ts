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
  PacienteVerificacaoDto,
  FichaPdfConfiguracaoDto,
  FichaPdfPageResponse,
} from "@/types/fichaPdf";

const fichaPdfService = {
  // Geração de fichas

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

  /*
   * Habilita/desabilita convênio para geração de PDF
   */
  toggleConvenioHabilitado: async (
    convenioId: string,
    habilitado: boolean
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.put<{ success: boolean; message: string }>(
        `/api/fichas-pdf/convenio/${convenioId}/toggle`,
        { habilitado }
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
    convenioId: string
  ): Promise<ConvenioEstatisticasDto> => {
    try {
      const response = await api.get<ConvenioEstatisticasDto>(
        `/api/fichas-pdf/convenio/${convenioId}/estatisticas-fichas`
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
    request: FichaPdfPreviaRequest
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
    pacienteId: string
  ): Promise<PacienteVerificacaoDto> => {
    try {
      const response = await api.get<PacienteVerificacaoDto>(
        `/api/fichas-pdf/paciente/${pacienteId}/verificar-fichas`
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
   * Gerar prévia geral (qualquer tipo)
   */
  gerarPrevia: async (
    request: FichaPdfPreviaRequest
  ): Promise<FichaPdfPreviaDto> => {
    try {
      const response = await api.post<FichaPdfPreviaDto>(
        "/api/fichas-pdf/preview",
        request
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao gerar prévia:", error);
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
