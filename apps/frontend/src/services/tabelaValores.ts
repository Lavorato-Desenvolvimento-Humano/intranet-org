// src/services/tabelaValores.ts
import api from "./api";

export interface TabelaValoresDto {
  id: string;
  nome: string;
  descricao: string;
  conteudo: string; // JSON como string
  convenioId: string;
  convenioNome: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface TabelaValoresCreateDto {
  nome: string;
  descricao: string;
  conteudo: string;
  convenioId: string;
}

export interface TabelaValoresPageResponse {
  content: TabelaValoresDto[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

/**
 * Serviço para operações com tabelas de valores
 */
const tabelaValoresService = {
  /**
   * Obtém todas as tabelas de valores paginadas
   */
  getAllTabelas: async (
    page: number = 0,
    size: number = 10,
    sort: string = "nome"
  ): Promise<TabelaValoresPageResponse> => {
    try {
      const response = await api.get<TabelaValoresPageResponse>(
        `/api/tabelas-valores?page=${page}&size=${size}&sort=${sort}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar tabelas de valores:", error);
      throw error;
    }
  },

  /**
   * Obtém uma tabela de valores pelo ID
   */
  getTabelaById: async (id: string): Promise<TabelaValoresDto> => {
    try {
      const response = await api.get<TabelaValoresDto>(
        `/api/tabelas-valores/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar tabela de valores ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtém tabelas de valores por convênio
   */
  getTabelasByConvenio: async (
    convenioId: string
  ): Promise<TabelaValoresDto[]> => {
    try {
      const response = await api.get<TabelaValoresDto[]>(
        `/api/tabelas-valores/convenio/${convenioId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao buscar tabelas de valores do convênio ${convenioId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Obtém tabelas de valores do usuário atual
   */
  getMinhasTabelas: async (): Promise<TabelaValoresDto[]> => {
    try {
      const response = await api.get<TabelaValoresDto[]>(
        "/api/tabelas-valores/minhas"
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar minhas tabelas de valores:", error);
      throw error;
    }
  },

  /**
   * Cria uma nova tabela de valores
   */
  createTabela: async (
    tabela: TabelaValoresCreateDto
  ): Promise<TabelaValoresDto> => {
    try {
      const response = await api.post<TabelaValoresDto>(
        "/api/tabelas-valores",
        tabela
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao criar tabela de valores:", error);
      throw error;
    }
  },

  /**
   * Atualiza uma tabela de valores existente
   */
  updateTabela: async (
    id: string,
    tabela: TabelaValoresCreateDto
  ): Promise<TabelaValoresDto> => {
    try {
      const response = await api.put<TabelaValoresDto>(
        `/api/tabelas-valores/${id}`,
        tabela
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar tabela de valores ${id}:`, error);
      throw error;
    }
  },

  /**
   * Exclui uma tabela de valores
   */
  deleteTabela: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/tabelas-valores/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir tabela de valores ${id}:`, error);
      throw error;
    }
  },

  /**
   * Conta o número de tabelas de valores por convênio
   */
  countTabelasByConvenio: async (convenioId: string): Promise<number> => {
    try {
      const response = await api.get<number>(
        `/api/tabelas-valores/convenio/${convenioId}/count`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao contar tabelas de valores do convênio ${convenioId}:`,
        error
      );
      throw error;
    }
  },
};

export default tabelaValoresService;
