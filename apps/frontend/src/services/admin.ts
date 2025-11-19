// src/services/admin.ts
import api from "./api";
import logger from "@/utils/logger";
import { User } from "./auth";

/**
 * Serviço para operações administrativas
 */
const adminService = {
  /**
   * Obtém todos os usuários do sistema
   */
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get<User[]>("/api/users");
      return response.data;
    } catch (error) {
      logger.error("Erro ao buscar todos os usuários:", error);
      throw error;
    }
  },

  /**
   * Adiciona um papel a um usuário
   */
  addRoleToUser: async (userId: string, roleName: string): Promise<User> => {
    try {
      const response = await api.post<User>(
        `/api/users/${userId}/roles?roleName=${roleName}`
      );
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao adicionar role ${roleName} ao usuário ${userId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Remove um papel de um usuário
   */
  removeRoleFromUser: async (
    userId: string,
    roleName: string
  ): Promise<User> => {
    try {
      const response = await api.delete<User>(
        `/api/users/${userId}/roles/${roleName}`
      );
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao remover role ${roleName} do usuário ${userId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Atualiza o status (ativo/inativo) de um usuário
   */
  updateUserStatus: async (userId: string, active: boolean): Promise<User> => {
    try {
      const response = await api.patch<User>(
        `/api/users/${userId}/status?active=${active}`
      );
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao ${active ? "ativar" : "desativar"} usuário ${userId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Atualiza o stauts de aprovação de um usuário
   */
  updateUserApproval: async (
    userId: string,
    approved: boolean
  ): Promise<User> => {
    try {
      const response = await api.patch<User>(
        `/api/users/${userId}/approve?approved=${approved}`
      );
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao ${approved ? "aprovar" : "reprovar"} usuário ${userId}:`,
        error
      );
      throw error;
    }
  },
};

export default adminService;
