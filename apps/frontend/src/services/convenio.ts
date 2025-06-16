// src/services/convenio.ts
import api from "./api";

export interface ConvenioDto {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  postagemCount: number;
}

export interface ConvenioCreateDto {
  name: string;
  description: string;
}

export interface PostagemSummaryDto {
  id: string;
  title: string;
  convenioId: string;
  convenioName: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  hasImagens: boolean;
  hasAnexos: boolean;
  hasTabelas: boolean;
}

/**
 * Serviço para operações com convênios
 */
const convenioService = {
  /**
   * Obtém todos os convênios
   */
  getAllConvenios: async (): Promise<ConvenioDto[]> => {
    try {
      console.log("Iniciando busca de convênios...");
      const response = await api.get<ConvenioDto[]>("/api/convenios");
      console.log("Convênios recebidos:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar convênios:", error);
      return [];
    }
  },

  /**
   * Obtém um convênio pelo ID
   */
  getConvenioById: async (id: string): Promise<ConvenioDto> => {
    try {
      const response = await api.get<ConvenioDto>(`/api/convenios/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar convênio ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria um novo convênio
   */
  createConvenio: async (convenio: ConvenioCreateDto): Promise<ConvenioDto> => {
    try {
      const response = await api.post<ConvenioDto>("/api/convenios", convenio);
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
    convenio: ConvenioCreateDto
  ): Promise<ConvenioDto> => {
    try {
      const response = await api.put<ConvenioDto>(
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

  /**
   * Obtém postagens de um convênio
   */
  getPostagens: async (convenioId: string): Promise<PostagemSummaryDto[]> => {
    try {
      const response = await api.get<PostagemSummaryDto[]>(
        `/api/convenios/${convenioId}/postagens`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao buscar postagens do convênio ${convenioId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Conta o número de postagens de um convênio
   */
  countPostagens: async (convenioId: string): Promise<number> => {
    try {
      const response = await api.get<number>(
        `/api/convenios/${convenioId}/postagens/count`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao contar postagens do convênio ${convenioId}:`,
        error
      );
      throw error;
    }
  },
};

export default convenioService;
