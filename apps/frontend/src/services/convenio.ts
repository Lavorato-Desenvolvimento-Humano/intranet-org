// src/services/convenio.ts
import api from "./api";

export interface Convenio {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Serviço para gerenciar operações relacionadas aos convênios
 */
const convenioService = {
  /**
   * Obtém todos os convênios
   */
  getAllConvenios: async (): Promise<Convenio[]> => {
    try {
      const response = await api.get<Convenio[]>("/api/convenios");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar convênios:", error);
      throw error;
    }
  },

  /**
   * Obtém um convênio pelo ID
   */
  getConvenioById: async (id: string): Promise<Convenio> => {
    try {
      const response = await api.get<Convenio>(`/api/convenios/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar convênio ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria um novo convênio
   */
  createConvenio: async (
    convenio: Omit<Convenio, "id" | "createdAt" | "updatedAt">
  ): Promise<Convenio> => {
    try {
      const response = await api.post<Convenio>("/api/convenios", convenio);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar convênio:", error);
      throw error;
    }
  },

  /**
   * Atualiza um convênio existente
   */
  updateConvenio: async (
    id: string,
    convenio: Partial<Convenio>
  ): Promise<Convenio> => {
    try {
      const response = await api.put<Convenio>(
        `/api/convenios/${id}`,
        convenio
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar convênio ${id}:`, error);
      throw error;
    }
  },

  /**
   * Exclui um convênio
   */
  deleteConvenio: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/convenios/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir convênio ${id}:`, error);
      throw error;
    }
  },
};

export default convenioService;
