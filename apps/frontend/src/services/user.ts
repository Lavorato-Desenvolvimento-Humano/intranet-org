// src/services/user.ts
import api from "./api";
import logger from "@/utils/logger";
import { User } from "./auth";

export type UserDto = User;

/**
 * Serviço para operações com usuários
 */
const userService = {
  /**
   * Obtém todos os usuários
   */
  getAllUsers: async (): Promise<UserDto[]> => {
    try {
      const response = await api.get<UserDto[]>("/api/users");
      return response.data;
    } catch (error) {
      logger.error("Erro ao buscar usuários:", error);
      throw error;
    }
  },

  /**
   * Obtém um usuário pelo ID
   */
  getUserById: async (id: string): Promise<UserDto> => {
    try {
      const response = await api.get<UserDto>(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      logger.error(`Erro ao buscar usuário ${id}:`, error);
      throw error;
    }
  },

  /**
   * Obtém o usuário atual
   */
  getCurrentUser: async (): Promise<UserDto> => {
    try {
      const response = await api.get<UserDto>("/api/users/me");
      return response.data;
    } catch (error) {
      logger.error("Erro ao buscar usuário atual:", error);
      throw error;
    }
  },

  /**
   * Atualiza um usuário
   */
  updateUser: async (
    id: string,
    updates: Record<string, string>
  ): Promise<UserDto> => {
    try {
      const response = await api.put<UserDto>(`/api/users/${id}`, updates);
      return response.data;
    } catch (error) {
      logger.error(`Erro ao atualizar usuário ${id}:`, error);
      throw error;
    }
  },

  /**
   * Atualiza a imagem de perfil de um usuário
   */
  updateProfileImage: async (id: string, image: File): Promise<UserDto> => {
    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await api.post<UserDto>(
        `/api/users/${id}/profile-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao atualizar imagem de perfil do usuário ${id}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Exclui um usuário
   */
  deleteUser: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/users/${id}`);
    } catch (error) {
      logger.error(`Erro ao excluir usuário ${id}:`, error);
      throw error;
    }
  },

  /**
   * Adiciona um papel a um usuário
   */
  addRole: async (id: string, roleName: string): Promise<UserDto> => {
    try {
      const response = await api.post<UserDto>(
        `/api/users/${id}/roles?roleName=${roleName}`
      );
      return response.data;
    } catch (error) {
      logger.error(`Erro ao adicionar papel ao usuário ${id}:`, error);
      throw error;
    }
  },

  /**
   * Remove um papel de um usuário
   */
  removeRole: async (id: string, roleName: string): Promise<UserDto> => {
    try {
      const response = await api.delete<UserDto>(
        `/api/users/${id}/roles/${roleName}`
      );
      return response.data;
    } catch (error) {
      logger.error(`Erro ao remover papel do usuário ${id}:`, error);
      throw error;
    }
  },

  /**
   * Atualiza o status de um usuário (ativar/desativar)
   */
  updateUserStatus: async (id: string, active: boolean): Promise<UserDto> => {
    try {
      const response = await api.patch<UserDto>(
        `/api/users/${id}/status?active=${active}`
      );
      return response.data;
    } catch (error) {
      logger.error(`Erro ao atualizar status do usuário ${id}:`, error);
      throw error;
    }
  },
};

export default userService;
