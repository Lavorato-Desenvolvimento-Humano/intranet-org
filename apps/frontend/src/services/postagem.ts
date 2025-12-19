// src/services/postagem.ts
import api from "./api";
import logger from "@/utils/logger";
import { isApiErrorResponse, getErrorMessage } from "@/types/errors";

export interface PostagemDto {
  id: string;
  title: string;
  text: string;
  tipoDestino: "geral" | "equipe" | "convenio";
  convenioId?: string;
  convenioName?: string;
  equipeId?: string;
  equipeName?: string;

  categoria: PostagemCategoria;
  pinned: boolean;

  viewsCount: number;
  likesCount: number;
  likedByCurrentUser: boolean;

  comentarios: ComentarioDto[];

  createdById: string;
  createdByName: string;
  createdByProfileImage?: string;
  createdAt: string;
  updatedAt: string;

  imagens: ImagemDto[];
  anexos: AnexoDto[];
  tabelas: TabelaPostagemDto[];
}

export type PostagemCategoria =
  | "AVISO"
  | "MANUAL"
  | "ANUNCIO"
  | "CONQUISTA"
  | "GERAL";

export interface ComentarioDto {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  createdAt: string;
}

export interface PostagemSummaryDto {
  id: string;
  title: string;
  previewText?: string;
  coverImageUrl?: string;
  tipoDestino: "geral" | "equipe" | "convenio";
  convenioName?: string;
  equipeName?: string;
  createdByName: string;
  createdByProfileImage?: string;
  createdAt: string;
  hasImagens: boolean;
  hasAnexos: boolean;
  hasTabelas: boolean;
  categoria: PostagemCategoria;
  pinned: boolean;
  viewsCount: number;
  likesCount: number;
  likedByCurrentUser: boolean;
  comentariosCount: number;
}

export interface PostagemCreateDto {
  title: string;
  text: string;
  tipoDestino: "geral" | "equipe" | "convenio";
  convenioId?: string;
  equipeId?: string;
  categoria: PostagemCategoria;
  pinned?: boolean; // Novo campo (apenas admin)
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
  toggleLike: async (id: string): Promise<void> => {
    try {
      await api.post(`/api/postagens/${id}/like`);
    } catch (error) {
      console.error(`Erro ao curtir postagem ${id}:`, error);
      throw error;
    }
  },

  addComment: async (id: string, text: string): Promise<ComentarioDto> => {
    try {
      const response = await api.post<ComentarioDto>(
        `/api/postagens/${id}/comentarios`,
        { text }
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao comentar na postagem ${id}:`, error);
      throw error;
    }
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    try {
      await api.delete(`/api/postagens/${postId}/comentarios/${commentId}`);
    } catch (error) {
      console.error(`Erro ao excluir comentário ${commentId}:`, error);
      throw error;
    }
  },

  incrementViewCount: async (id: string): Promise<void> => {
    try {
      await api.post(`/api/postagens/${id}/view`);
    } catch (error) {
      // Falhas aqui não devem bloquear o usuário
      console.warn(`Erro ao incrementar views da postagem ${id}`, error);
    }
  },

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
      const response = await api.get<{
        content: PostagemSummaryDto[];
        totalPages: number;
        totalElements: number;
      }>(`/api/postagens?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      logger.error("Erro ao buscar postagens:", error);
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

      console.log("Enviando imagem para o servidor...");

      const response = await api.post<ImagemDto>(
        "/api/temp/imagens",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // 30 segundos
        }
      );

      let url = response.data.url;
      if (!url.startsWith("http") && !url.startsWith("/")) {
        url = "/" + url;
      }

      // Verificar se estamos em desenvolvimento ou produção
      const isDevelopment = process.env.NODE_ENV === "development";
      const baseUrl = isDevelopment
        ? process.env.NEXT_PUBLIC_API_URL || ""
        : "";

      response.data.url = baseUrl + url;

      logger.info("Imagem enviada com sucesso:", response.data);
      return response.data;
    } catch (error) {
      // Tratamento de erro existente
      logger.error("Erro detalhado ao adicionar imagem temporária:", error);

      // Mensagem amigável baseada no tipo de erro
      let errorMessage = "Erro desconhecido ao fazer upload da imagem";

      if (isApiErrorResponse(error) && error.response) {
        // Melhorar log para depuração
        logger.error("Status do erro:", error.response.status);
        logger.error("Dados do erro:", error.response.data);

        // Personalizar mensagem baseada no status
        if (error.response.status === 413) {
          errorMessage =
            "A imagem é muito grande. Por favor, use uma imagem menor.";
        } else if (error.response.status === 415) {
          errorMessage = "Formato de imagem não suportado.";
        } else if (error.response.status === 500) {
          errorMessage =
            "Erro no servidor. Por favor, tente novamente mais tarde.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (isApiErrorResponse(error) && error.request) {
        errorMessage = "Servidor não respondeu. Verifique sua conexão.";
      } else {
        errorMessage = `Erro na requisição: ${getErrorMessage(error)}`;
      }

      // Re-lançar o erro com mensagem personalizada
      throw new Error(errorMessage);
    }
  },

  /**
   * Adiciona um anexo temporário (sem postagem vinculada)
   */
  addTempAnexo: async (file: File): Promise<AnexoDto> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<AnexoDto>("/api/temp/anexos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000, // 30 segundos
      });
      return response.data;
    } catch (error) {
      logger.error(`Erro ao adicionar anexo temporário:`, error);

      // Tratamento de erro específico para o problema de tamanho do campo
      let message = "Erro ao fazer upload do arquivo";
      if (isApiErrorResponse(error) && error.response?.data?.message) {
        message = error.response.data.message;

        // Se for o erro específico de tamanho de campo, dar uma mensagem mais amigável
        if (message.includes("character varying(50)")) {
          message =
            "O tipo do arquivo é muito longo para o sistema. Por favor, escolha outro formato de arquivo.";
        }
      }

      throw new Error(message);
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
          timeout: 30000, // 30 segundos
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
          timeout: 30000, // 30 segundos
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
   * Associa um anexo temporário a uma postagem
   */
  associarAnexo: async (
    postagemId: string,
    anexoId: string
  ): Promise<AnexoDto> => {
    try {
      const response = await api.post<AnexoDto>(
        `/api/postagens/${postagemId}/associar-anexo/${anexoId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao associar anexo ${anexoId} à postagem ${postagemId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Associa uma imagem temporária a uma postagem
   */
  associarImagem: async (
    postagemId: string,
    imagemId: string
  ): Promise<ImagemDto> => {
    try {
      const response = await api.post<ImagemDto>(
        `/api/postagens/${postagemId}/associar-imagem/${imagemId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao associar imagem ${imagemId} à postagem ${postagemId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Obtém postagens de uma equipe específica
   */
  getPostagensByEquipeId: async (
    equipeId: string
  ): Promise<PostagemSummaryDto[]> => {
    try {
      const response = await api.get<PostagemSummaryDto[]>(
        `/api/postagens/equipe/${equipeId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar postagens da equipe ${equipeId}:`, error);
      throw error;
    }
  },

  /**
   * Obtém postagens por tipo de destino
   */
  getPostagensByTipoDestino: async (
    tipoDestino: string
  ): Promise<PostagemSummaryDto[]> => {
    try {
      const response = await api.get<PostagemSummaryDto[]>(
        `/api/postagens/tipo/${tipoDestino}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar postagens do tipo ${tipoDestino}:`, error);
      throw error;
    }
  },

  /**
   * Obtém postagens visíveis para o usuário atual
   */
  getPostagensVisiveis: async (): Promise<PostagemSummaryDto[]> => {
    try {
      const response = await api.get<PostagemSummaryDto[]>(
        "/api/postagens/visiveis"
      );
      console.log("Postagens visíveis retornadas:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar postagens visíveis:", error);
      throw error;
    }
  },

  /**
   * Obtém TODAS as postagens para administradores (sem restrições)
   */
  getAllPostagensForAdmin: async (): Promise<PostagemSummaryDto[]> => {
    try {
      const response = await api.get<PostagemSummaryDto[]>(
        "/api/postagens/admin/todas"
      );
      console.log("Todas as postagens (admin) retornadas:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar todas as postagens para admin:", error);
      throw error;
    }
  },
};

export default postagemService;
