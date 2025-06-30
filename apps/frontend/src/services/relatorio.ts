import api from "./api";
import {
  RelatorioDto,
  RelatorioSummaryDto,
  RelatorioCreateRequest,
  RelatorioFilterRequest,
  RelatorioDataDto,
  RelatorioCompartilhamentoDto,
  RelatorioCompartilhamentoRequest,
  RelatorioLogDto,
  RelatorioPageResponse,
  CompartilhamentoPageResponse,
  RelatorioEstatisticas,
} from "@/types/relatorio";

const relatorioService = {
  gerarRelatorio: async (
    request: RelatorioCreateRequest
  ): Promise<RelatorioDto> => {
    try {
      console.log("Gerando relatório:", request);
      const response = await api.post<RelatorioDto>("/api/relatorios", request);
      return response.data;
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      throw error;
    }
  },

  getRelatorioById: async (id: string): Promise<RelatorioDto> => {
    try {
      const response = await api.get<RelatorioDto>(`/api/relatorios/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar relatório ${id}:`, error);
      throw error;
    }
  },

  getRelatorioByHash: async (hash: string): Promise<RelatorioDto> => {
    try {
      const response = await api.get<RelatorioDto>(
        `/api/relatorios/compartilhado/${hash}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar relatório compartilhado ${hash}:`, error);
      throw error;
    }
  },

  getMeusRelatorios: async (
    page: number = 0,
    size: number = 20
  ): Promise<RelatorioPageResponse> => {
    try {
      const response = await api.get<RelatorioPageResponse>(
        "/api/relatorios/meus",
        {
          params: { page, size },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar meus relatórios:", error);
      throw error;
    }
  },

  /**
   * Lista todos os relatórios (apenas admins/supervisores)
   */
  getAllRelatorios: async (
    page: number = 0,
    size: number = 20
  ): Promise<RelatorioPageResponse> => {
    try {
      const response = await api.get<RelatorioPageResponse>(
        "/api/relatorios/todos",
        {
          params: { page, size },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar todos os relatórios:", error);
      throw error;
    }
  },

  buscarRelatorios: async (
    filter: RelatorioFilterRequest,
    page: number = 0,
    size: number = 20
  ): Promise<RelatorioPageResponse> => {
    try {
      const response = await api.get<RelatorioPageResponse>(
        "/api/relatorios/buscar",
        {
          params: { ...filter, page, size },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar relatórios com filtros:", error);
      throw error;
    }
  },

  getDadosRelatorio: async (relatorioId: string): Promise<RelatorioDataDto> => {
    try {
      const response = await api.get<RelatorioDataDto>(
        `/api/relatorios/${relatorioId}/dados`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter dados do relatório ${relatorioId}:`, error);
      throw error;
    }
  },

  compartilharRelatorio: async (
    relatorioId: string,
    request: RelatorioCompartilhamentoRequest
  ): Promise<RelatorioCompartilhamentoDto> => {
    try {
      const response = await api.post<RelatorioCompartilhamentoDto>(
        `/api/relatorios/${relatorioId}/compartilhar`,
        request
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao compartilhar relatório ${relatorioId}:`, error);
      throw error;
    }
  },

  getCompartilhamentosRecebidos: async (
    page: number = 0,
    size: number = 20
  ): Promise<CompartilhamentoPageResponse> => {
    try {
      const response = await api.get<CompartilhamentoPageResponse>(
        "/api/relatorios/compartilhamentos/recebidos",
        { params: { page, size } }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar compartilhamentos recebidos:", error);
      throw error;
    }
  },

  getCompartilhamentosEnviados: async (
    page: number = 0,
    size: number = 20
  ): Promise<CompartilhamentoPageResponse> => {
    try {
      const response = await api.get<CompartilhamentoPageResponse>(
        "/api/relatorios/compartilhamentos/enviados",
        { params: { page, size } }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar compartilhamentos enviados:", error);
      throw error;
    }
  },

  marcarCompartilhamentoComoVisualizado: async (
    compartilhamentoId: string
  ): Promise<void> => {
    try {
      await api.put(
        `/api/relatorios/compartilhamentos/${compartilhamentoId}/visualizar`
      );
    } catch (error) {
      console.error(
        `Erro ao marcar compartilhamento ${compartilhamentoId} como visualizado:`,
        error
      );
      throw error;
    }
  },

  countCompartilhamentosNaoVisualizados: async (): Promise<number> => {
    try {
      const response = await api.get<{ count: number }>(
        "/api/relatorios/compartilhamentos/nao-visualizados/count"
      );
      return response.data.count;
    } catch (error) {
      console.error(
        "Erro ao contar compartilhamentos não visualizados:",
        error
      );
      return 0;
    }
  },

  excluirRelatorio: async (relatorioId: string): Promise<void> => {
    try {
      await api.delete(`/api/relatorios/${relatorioId}`);
    } catch (error) {
      console.error(`Erro ao excluir relatório ${relatorioId}:`, error);
      throw error;
    }
  },

  baixarRelatorioPDF: async (relatorioId: string): Promise<Blob> => {
    try {
      const response = await api.get(`/api/relatorios/${relatorioId}/pdf`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao baixar PDF do relatório ${relatorioId}:`, error);
      throw error;
    }
  },

  baixarRelatorioPDFByHash: async (hash: string): Promise<Blob> => {
    try {
      const response = await api.get(
        `/api/relatorios/compartilhado/${hash}/pdf`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao baixar PDF do relatório compartilhado ${hash}:`,
        error
      );
      throw error;
    }
  },

  getEstatisticasRelatorios: async (): Promise<RelatorioEstatisticas> => {
    try {
      const response = await api.get<RelatorioEstatisticas>(
        "/api/relatorios/estatisticas"
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao obter estatísticas de relatórios:", error);
      throw error;
    }
  },

  reprocessarRelatorio: async (relatorioId: string): Promise<RelatorioDto> => {
    try {
      const response = await api.post<RelatorioDto>(
        `/api/relatorios/${relatorioId}/reprocessar`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao reprocessar relatório ${relatorioId}:`, error);
      throw error;
    }
  },

  getLogsRelatorio: async (relatorioId: string): Promise<RelatorioLogDto[]> => {
    try {
      const response = await api.get<RelatorioLogDto[]>(
        `/api/relatorios/${relatorioId}/logs`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter logs do relatório ${relatorioId}:`, error);
      throw error;
    }
  },

  downloadFile: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default relatorioService;
