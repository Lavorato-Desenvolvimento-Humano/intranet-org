// src/services/postagemService.ts
import api from "./api";
import {
  Postagem,
  PostagemSimple,
  Imagem,
  Anexo,
  TabelaPostagem,
} from "./dashboardService";

export interface PostagemCreateRequest {
  title: string;
  text: string;
  convenioId: string;
  imagens?: ImagemCreateRequest[];
  anexos?: AnexoCreateRequest[];
  tabelas?: TabelaPostagemCreateRequest[];
}

export interface PostagemUpdateRequest {
  title?: string;
  text?: string;
  convenioId?: string;
  imagens?: ImagemCreateRequest[];
  anexos?: AnexoCreateRequest[];
  tabelas?: TabelaPostagemCreateRequest[];
}

export interface ImagemCreateRequest {
  url: string;
  description?: string;
}

export interface AnexoCreateRequest {
  nameFile: string;
  typeFile?: string;
  url: string;
}

export interface TabelaPostagemCreateRequest {
  conteudo: string; // JSON string
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}

/**
 * Serviço para operações relacionadas a postagens
 */
const postagemService = {
  /**
   * Obter todas as postagens
   */
  getAllPostagens: async (): Promise<PostagemSimple[]> => {
    try {
      const response = await api.get<PostagemSimple[]>("/postagens");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar postagens:", error);
      throw error;
    }
  },

  /**
   * Obter postagens paginadas
   */
  getPostagensPaginadas: async (
    page = 0,
    size = 10,
    sortBy = "createdAt",
    sortDir = "desc"
  ): Promise<PaginatedResponse<PostagemSimple>> => {
    try {
      const response = await api.get<PaginatedResponse<PostagemSimple>>(
        `/postagens/paginadas?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar postagens paginadas:", error);
      throw error;
    }
  },

  /**
   * Obter postagem por ID
   */
  getPostagemById: async (id: string): Promise<Postagem> => {
    try {
      const response = await api.get<Postagem>(`/postagens/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar postagem ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obter postagens por convênio
   */
  getPostagensByConvenioId: async (
    convenioId: string
  ): Promise<PostagemSimple[]> => {
    try {
      const response = await api.get<PostagemSimple[]>(
        `/postagens/convenio/${convenioId}`
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
   * Obter postagens paginadas por convênio
   */
  getPostagensByConvenioIdPaginadas: async (
    convenioId: string,
    page = 0,
    size = 10,
    sortBy = "createdAt",
    sortDir = "desc"
  ): Promise<PaginatedResponse<PostagemSimple>> => {
    try {
      const response = await api.get<PaginatedResponse<PostagemSimple>>(
        `/postagens/convenio/${convenioId}/paginadas?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao buscar postagens paginadas do convênio ${convenioId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Obter postagens recentes
   */
  getRecentPostagens: async (limit = 5): Promise<PostagemSimple[]> => {
    try {
      const response = await api.get<PostagemSimple[]>(
        `/postagens/recentes?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar postagens recentes:", error);
      throw error;
    }
  },

  /**
   * Criar uma nova postagem
   */
  createPostagem: async (request: PostagemCreateRequest): Promise<Postagem> => {
    try {
      const response = await api.post<Postagem>("/postagens", request);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar postagem:", error);
      throw error;
    }
  },

  /**
   * Atualizar uma postagem existente
   */
  updatePostagem: async (
    id: string,
    request: PostagemUpdateRequest
  ): Promise<Postagem> => {
    try {
      const response = await api.put<Postagem>(`/postagens/${id}`, request);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar postagem ${id}:`, error);
      throw error;
    }
  },

  /**
   * Excluir uma postagem
   */
  deletePostagem: async (id: string): Promise<void> => {
    try {
      await api.delete(`/postagens/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir postagem ${id}:`, error);
      throw error;
    }
  },
};

export default postagemService;
