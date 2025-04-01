// src/services/equipe.ts
import api from "./api";

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  profileImage?: string;
  roles: string[];
  emailVerified: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EquipeDto {
  id: string;
  nome: string;
  descricao: string;
  createdAt: string;
  updatedAt: string;
  membroCount: number;
}

export interface EquipeCreateDto {
  nome: string;
  descricao: string;
}

export interface UserEquipeDto {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRoles: string[];
  emailVerified: boolean;
  equipeId: string;
  equipeName: string;
}

/**
 * Serviço para operações com equipes
 */
const equipeService = {
  /**
   * Obtém todas as equipes
   */
  getAllEquipes: async (): Promise<EquipeDto[]> => {
    try {
      const response = await api.get<EquipeDto[]>("/api/equipes");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar equipes:", error);
      throw error;
    }
  },

  /**
   * Obtém uma equipe pelo ID
   */
  getEquipeById: async (id: string): Promise<EquipeDto> => {
    try {
      const response = await api.get<EquipeDto>(`/api/equipes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar equipe ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtém os membros de uma equipe
   */
  getMembrosEquipe: async (id: string): Promise<UserDto[]> => {
    try {
      const response = await api.get<UserDto[]>(`/api/equipes/${id}/membros`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar membros da equipe ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtém as equipes do usuário atual
   */
  getMinhasEquipes: async (): Promise<EquipeDto[]> => {
    try {
      const response = await api.get<EquipeDto[]>("/api/equipes/minhas");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar minhas equipes:", error);
      throw error;
    }
  },

  /**
   * Cria uma nova equipe
   */
  createEquipe: async (equipe: EquipeCreateDto): Promise<EquipeDto> => {
    try {
      const response = await api.post<EquipeDto>("/api/equipes", equipe);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar equipe:", error);
      throw error;
    }
  },

  /**
   * Atualiza uma equipe existente
   */
  updateEquipe: async (
    id: string,
    equipe: EquipeCreateDto
  ): Promise<EquipeDto> => {
    try {
      const response = await api.put<EquipeDto>(`/api/equipes/${id}`, equipe);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar equipe ${id}:`, error);
      throw error;
    }
  },

  /**
   * Exclui uma equipe
   */
  deleteEquipe: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/equipes/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir equipe ${id}:`, error);
      throw error;
    }
  },

  /**
   * Adiciona um membro à equipe
   */
  addMembro: async (equipeId: string, userId: string): Promise<EquipeDto> => {
    try {
      const response = await api.post<EquipeDto>(
        `/api/equipes/${equipeId}/membros/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao adicionar membro à equipe:`, error);
      throw error;
    }
  },

  /**
   * Remove um membro da equipe
   */
  removeMembro: async (
    equipeId: string,
    userId: string
  ): Promise<EquipeDto> => {
    try {
      const response = await api.delete<EquipeDto>(
        `/api/equipes/${equipeId}/membros/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao remover membro da equipe:`, error);
      throw error;
    }
  },
};

export default equipeService;
