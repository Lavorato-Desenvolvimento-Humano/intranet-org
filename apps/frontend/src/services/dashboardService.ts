// src/services/dashboardService.ts
import api from "./api";

export interface PostagemSimple {
  id: string;
  title: string;
  createdByName: string;
  createdAt: string;
  hasImagens: boolean;
  hasTabelas: boolean;
  hasAnexos: boolean;
}

export interface Convenio {
  id: string;
  name: string;
  description: string;
  postagemCount: number;
}

export interface ConvenioWithPostagens extends Convenio {
  postagens: PostagemSimple[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  recentPostagens: PostagemSimple[];
  conveniosWithPostagens: ConvenioWithPostagens[];
  allConvenios: Convenio[];
  totalConvenios: number;
}

export interface ConvenioDashboardData {
  convenio: ConvenioWithPostagens;
  postagens: PostagemSimple[];
  allConvenios: Convenio[];
  totalPostagens: number;
}

export interface Imagem {
  id: string;
  url: string;
  description: string;
}

export interface Anexo {
  id: string;
  nameFile: string;
  typeFile: string;
  url: string;
}

export interface TabelaPostagem {
  id: string;
  conteudo: string; // JSON string
}

export interface Postagem {
  id: string;
  title: string;
  text: string;
  convenioId: string;
  convenioName: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  imagens: Imagem[];
  anexos: Anexo[];
  tabelas: TabelaPostagem[];
}

/**
 * Serviço para operações relacionadas à dashboard
 */
const dashboardService = {
  /**
   * Obter dados da dashboard principal
   */
  getDashboardData: async (
    postLimit = 5,
    convenioLimit = 5
  ): Promise<DashboardData> => {
    try {
      const response = await api.get<DashboardData>(
        `/dashboard?postLimit=${postLimit}&convenioLimit=${convenioLimit}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar dados da dashboard:", error);
      throw error;
    }
  },

  /**
   * Obter dados da dashboard para um convênio específico
   */
  getConvenioDashboardData: async (
    convenioId: string,
    postLimit = 10
  ): Promise<ConvenioDashboardData> => {
    try {
      const response = await api.get<ConvenioDashboardData>(
        `/dashboard/convenio/${convenioId}?postLimit=${postLimit}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao buscar dados da dashboard para o convênio ${convenioId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Obter detalhes de uma postagem
   */
  getPostagemById: async (postagemId: string): Promise<Postagem> => {
    try {
      const response = await api.get<Postagem>(`/postagens/${postagemId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar postagem ${postagemId}:`, error);
      throw error;
    }
  },
};

export default dashboardService;
