// src/services/postagem.ts
import api from "./api";

export interface Imagem {
  id: string;
  postId: string;
  url: string;
  description?: string;
}

export interface Anexo {
  id: string;
  postId: string;
  nameFile: string;
  typeFile?: string;
  url: string;
}

export interface TabelaPostagem {
  id: string;
  postId: string;
  conteudo: any; // Tipo genérico para o conteúdo JSONB
}

export interface Postagem {
  id: string;
  title: string;
  text: string;
  convenioId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  imagens?: Imagem[];
  anexos?: Anexo[];
  tabelas?: TabelaPostagem[];
}

/**
 * Serviço para gerenciar operações relacionadas às postagens
 */
const postagemService = {
  /**
   * Obtém todas as postagens
   */
  getAllPostagens: async (): Promise<Postagem[]> => {
    try {
      const response = await api.get<Postagem[]>("/api/postagens");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar postagens:", error);
      throw error;
    }
  },

  /**
   * Obtém uma postagem pelo ID
   */
  getPostagemById: async (id: string): Promise<Postagem> => {
    try {
      // Verificar se o ID é "new" e nesse caso retornar uma postagem vazia
      if (id === "new") {
        const emptyPostagem: Postagem = {
          id: "",
          title: "",
          text: "",
          convenioId: "",
          createdBy: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          imagens: [],
          anexos: [],
          tabelas: [],
        };
        return emptyPostagem;
      }

      const response = await api.get<Postagem>(`/api/postagens/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar postagem ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtém postagens por ID do convênio
   */
  getPostagensByConvenioId: async (convenioId: string): Promise<Postagem[]> => {
    try {
      const response = await api.get<Postagem[]>(
        `/api/postagens/convenio/${convenioId}`
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
   * Cria uma nova postagem
   */
  createPostagem: async (
    postagem: Omit<Postagem, "id" | "createdAt" | "updatedAt">
  ): Promise<Postagem> => {
    try {
      const response = await api.post<Postagem>("/api/postagens", postagem);
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
    postagem: Partial<Postagem>
  ): Promise<Postagem> => {
    try {
      const response = await api.put<Postagem>(
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
   * Adiciona uma imagem à postagem
   */
  addImagemToPostagem: async (
    postagemId: string,
    imagem: File,
    description?: string
  ): Promise<Imagem> => {
    try {
      const formData = new FormData();
      formData.append("image", imagem);
      if (description) {
        formData.append("description", description);
      }

      const response = await api.post<Imagem>(
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
   * Adiciona um anexo à postagem
   */
  addAnexoToPostagem: async (
    postagemId: string,
    anexo: File
  ): Promise<Anexo> => {
    try {
      const formData = new FormData();
      formData.append("file", anexo);

      const response = await api.post<Anexo>(
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
   * Adiciona uma tabela à postagem
   */
  addTabelaToPostagem: async (
    postagemId: string,
    conteudo: any
  ): Promise<TabelaPostagem> => {
    try {
      // Garantir que o conteúdo esteja no formato correto
      const dadosTabela = {
        conteudo:
          typeof conteudo === "string" ? conteudo : JSON.stringify(conteudo),
      };

      const response = await api.post<TabelaPostagem>(
        `/api/postagens/${postagemId}/tabelas`,
        dadosTabela
      );
      return response.data;
    } catch (error: any) {
      console.error(
        `Erro ao adicionar tabela à postagem ${postagemId}:`,
        error
      );

      // Log detalhado para ajudar no diagnóstico
      if (error.response) {
        console.error("Resposta do servidor:", error.response.data);
        console.error("Status do erro:", error.response.status);
      }

      throw error;
    }
  },
};

export default postagemService;
