// src/services/demanda.ts
import api from "./api";
import {
  Demanda,
  DemandaCreateDto,
  DemandaUpdateDto,
  DemandaFilterParams,
  DemandaAudit,
  DemandaStats,
  DemandaEvent,
} from "@/types/demanda";

/**
 * Serviço para operações com demandas
 */
const demandaService = {
  /**
   * Obtém todas as demandas com filtros opcionais
   */
  getAllDemandas: async (
    params: DemandaFilterParams = {}
  ): Promise<{
    content: Demanda[];
    totalElements: number;
    totalPages: number;
  }> => {
    try {
      const response = await api.get("/api/demandas", { params });
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar demandas:", error);
      throw error;
    }
  },

  /**
   * Obtém uma demanda pelo ID
   */
  getDemandaById: async (id: string): Promise<Demanda> => {
    try {
      const response = await api.get(`/api/demandas/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar demanda ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria uma nova demanda
   */
  createDemanda: async (demanda: DemandaCreateDto): Promise<Demanda> => {
    try {
      const response = await api.post("/api/demandas", demanda);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar demanda:", error);
      throw error;
    }
  },

  /**
   * Atualiza uma demanda existente
   */
  updateDemanda: async (
    id: string,
    demanda: DemandaUpdateDto
  ): Promise<Demanda> => {
    try {
      const response = await api.put(`/api/demandas/${id}`, demanda);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar demanda ${id}:`, error);
      throw error;
    }
  },

  /**
   * Atualiza apenas o status de uma demanda
   */
  updateDemandaStatus: async (id: string, status: string): Promise<Demanda> => {
    try {
      const response = await api.patch(
        `/api/demandas/${id}/status?status=${status}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar status da demanda ${id}:`, error);
      throw error;
    }
  },

  /**
   * Exclui uma demanda
   */
  deleteDemanda: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/demandas/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir demanda ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtém demandas do usuário atual
   */
  getMinhasDemandas: async (
    params: DemandaFilterParams = {}
  ): Promise<{
    content: Demanda[];
    totalElements: number;
    totalPages: number;
  }> => {
    try {
      const response = await api.get("/api/demandas/minhas", { params });
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar minhas demandas:", error);
      throw error;
    }
  },

  /**
   * Obtém demandas criadas pelo usuário atual
   */
  getDemandasCriadas: async (
    params: DemandaFilterParams = {}
  ): Promise<{
    content: Demanda[];
    totalElements: number;
    totalPages: number;
  }> => {
    try {
      const response = await api.get("/api/demandas/criadas", { params });
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar demandas criadas:", error);
      throw error;
    }
  },

  /**
   * Obtém demandas para visualização em calendário
   */
  getDemandasCalendario: async (
    dataInicio: string,
    dataFim: string
  ): Promise<DemandaEvent[]> => {
    try {
      const response = await api.get("/api/demandas/calendario", {
        params: {
          dataInicio,
          dataFim,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar demandas para calendário:", error);
      throw error;
    }
  },

  /**
   * Obtém estatísticas de demandas
   */
  getDemandaStats: async (): Promise<DemandaStats> => {
    try {
      const response = await api.get("/api/demandas/stats");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar estatísticas de demandas:", error);
      throw error;
    }
  },

  /**
   * Obtém o histórico de auditoria de uma demanda
   */
  getDemandaAudit: async (demandaId: string): Promise<DemandaAudit[]> => {
    try {
      const response = await api.get(`/api/demandas/${demandaId}/audit`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar histórico da demanda ${demandaId}:`, error);
      throw error;
    }
  },
};

export default demandaService;
