// src/services/postagem.ts
import api from "./api";

export interface PostagemDto {
  id: string;
  title: string;
  text: string;
  convenioId: string;
  convenioName: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  imagens: ImagemDto[];
  anexos: AnexoDto[];
  tabelas: TabelaPostagemDto[];
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

export interface PostagemCreateDto {
  title: string;
  text: string;
  convenioId: string;
}

export interface ImagemDto {
  id: string;
  postagemId: string;
  url: string;
  description: string;
}

export interface AnexoDto {
  id: string;
  postagemId: string;
  nameFile: string;
  typeFile: string;
  url: string;
}

export interface TabelaPostagemDto {
  id: string;
  postagemId: string;
  conteudo: string; // JSON como string
}

/**
 * Serviço para operações com postagens
 */
const postagemService = {
  /**
   * Obtém todas as postagens paginadas
   */
  getAllPostagens: async (
    page: number = 0,
    size: number = 10
  ): Promise<{
    content: PostagemSummaryDto[];
    totalPages: number;
    totalElements: number;
  }> => {
    try {
      const response = await api.get<any>(
        `/api/postagens?page=${page}&size=${size}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar postagens:", error);
      throw error;
    }
  },

  /**
   * Obtém uma postagem pelo ID
   */
  getPostagemById: async (id: string): Promise<PostagemDto> => {
    try {
      const response = await api.get<PostagemDto>(`/api/postagens/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar postagem ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtém postagens do usuário atual
   */
  getMinhasPostagens: async (): Promise<PostagemSummaryDto[]> => {
    try {
      const response = await api.get<PostagemSummaryDto[]>(
        "/api/postagens/minhas"
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar minhas postagens:", error);
      throw error;
    }
  },

  /**
   * Cria uma nova postagem
   */
  createPostagem: async (postagem: PostagemCreateDto): Promise<PostagemDto> => {
    try {
      const response = await api.post<PostagemDto>("/api/postagens", postagem);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar postagem:", error);
      throw error;
    }
  },

  /**
   * Atualiza uma postagem existente
   */
  updatePostagem: async (
    id: string,
    postagem: PostagemCreateDto
  ): Promise<PostagemDto> => {
    try {
      const response = await api.put<PostagemDto>(
        `/api/postagens/${id}`,
        postagem
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar postagem ${id}:`, error);
      throw error;
    }
  },

  /**
   * Exclui uma postagem
   */
  deletePostagem: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/postagens/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir postagem ${id}:`, error);
      throw error;
    }
  },

  /**
   * Adiciona uma imagem temporária (sem postagem vinculada)
   */
  addTempImagem: async (
    file: File,
    description?: string
  ): Promise<ImagemDto> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (description) {
        formData.append("description", description);
      }

      const response = await api.post<ImagemDto>(
        `/postagens/temp/imagens`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao adicionar imagem temporária:`, error);
      throw error;
    }
  },

  /**
   * Adiciona um anexo temporário (sem postagem vinculada)
   */
  addTempAnexo: async (file: File): Promise<AnexoDto> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<AnexoDto>(
        `/postagens/temp/anexos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao adicionar anexo temporário:`, error);
      throw error;
    }
  },

  /**
   * Adiciona uma imagem à postagem
   */
  addImagem: async (
    postagemId: string,
    file: File,
    description?: string
  ): Promise<ImagemDto> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (description) {
        formData.append("description", description);
      }

      const response = await api.post<ImagemDto>(
        `/api/postagens/${postagemId}/imagens`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao adicionar imagem à postagem ${postagemId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Exclui uma imagem
   */
  deleteImagem: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/postagens/imagens/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir imagem ${id}:`, error);
      throw error;
    }
  },

  /**
   * Adiciona um anexo à postagem
   */
  addAnexo: async (postagemId: string, file: File): Promise<AnexoDto> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<AnexoDto>(
        `/api/postagens/${postagemId}/anexos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao adicionar anexo à postagem ${postagemId}:`, error);
      throw error;
    }
  },

  /**
   * Exclui um anexo
   */
  deleteAnexo: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/postagens/anexos/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir anexo ${id}:`, error);
      throw error;
    }
  },

  /**
   * Adiciona uma tabela à postagem
   */
  addTabela: async (
    postagemId: string,
    conteudoJson: string
  ): Promise<TabelaPostagemDto> => {
    try {
      const response = await api.post<TabelaPostagemDto>(
        `/api/postagens/${postagemId}/tabelas`,
        conteudoJson,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao adicionar tabela à postagem ${postagemId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Atualiza uma tabela
   */
  updateTabela: async (
    id: string,
    conteudoJson: string
  ): Promise<TabelaPostagemDto> => {
    try {
      const response = await api.put<TabelaPostagemDto>(
        `/api/postagens/tabelas/${id}`,
        conteudoJson,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar tabela ${id}:`, error);
      throw error;
    }
  },

  /**
   * Exclui uma tabela
   */
  deleteTabela: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/postagens/tabelas/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir tabela ${id}:`, error);
      throw error;
    }
  },

  /**
   * Associa uma imagem temporária a uma postagem
   */
  associateImage: async (
    postagemId: string,
    imagemId: string
  ): Promise<ImagemDto> => {
    try {
      const response = await api.post<ImagemDto>(
        `/postagens/${postagemId}/associar-imagem/${imagemId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao associar imagem à postagem:`, error);
      throw error;
    }
  },

  /**
   * Associa um anexo temporário a uma postagem
   */
  associateAttachment: async (
    postagemId: string,
    anexoId: string
  ): Promise<AnexoDto> => {
    try {
      const response = await api.post<AnexoDto>(
        `/postagens/${postagemId}/associar-anexo/${anexoId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao associar anexo à postagem:`, error);
      throw error;
    }
  },
};

export default postagemService;
