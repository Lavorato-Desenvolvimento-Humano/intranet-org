// src/services/convenioService.ts
import api from "./api";
import { Convenio, ConvenioWithPostagens } from "./dashboardService";

export interface ConvenioCreateRequest {
  name: string;
  description?: string;
}

export interface ConvenioUpdateRequest {
  name?: string;
  description?: string;
}

/**
 * Serviço para operações relacionadas a convênios
 */
const convenioService = {
  /**
   * Obter todos os convênios
   */
  getAllConvenios: async (): Promise<Convenio[]> => {
    try {
      const response = await api.get<Convenio[]>("/convenios");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar convênios:", error);
      throw error;
    }
  },

  /**
   * Obter convênio por ID
   */
  getConvenioById: async (id: string): Promise<ConvenioWithPostagens> => {
    try {
      const response = await api.get<ConvenioWithPostagens>(`/convenios/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar convênio ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obter todos os convênios com suas postagens
   */
  getConveniosWithPostagens: async (): Promise<ConvenioWithPostagens[]> => {
    try {
      const response = await api.get<ConvenioWithPostagens[]>(
        "/convenios/with-postagens"
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar convênios com postagens:", error);
      throw error;
    }
  },

  /**
   * Criar um novo convênio
   */
  createConvenio: async (
    request: ConvenioCreateRequest
  ): Promise<ConvenioWithPostagens> => {
    try {
      const response = await api.post<ConvenioWithPostagens>(
        "/convenios",
        request
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao criar convênio:", error);
      throw error;
    }
  },

  /**
   * Atualizar um convênio existente
   */
  updateConvenio: async (
    id: string,
    request: ConvenioUpdateRequest
  ): Promise<ConvenioWithPostagens> => {
    try {
      const response = await api.put<ConvenioWithPostagens>(
        `/convenios/${id}`,
        request
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar convênio ${id}:`, error);
      throw error;
    }
  },

  /**
   * Excluir um convênio
   */
  deleteConvenio: async (id: string): Promise<void> => {
    try {
      await api.delete(`/convenios/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir convênio ${id}:`, error);
      throw error;
    }
  },
};

export default convenioService;
