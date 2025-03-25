// src/services/permission.ts
import api from "./api";
import { Permission } from "./role";

export interface PermissionCreateRequest {
  name: string;
  description?: string;
}

/**
 * Serviço para gerenciar permissões
 */
const permissionService = {
  /**
   * Obtém todas as permissões
   */
  getAllPermissions: async (): Promise<Permission[]> => {
    try {
      const response = await api.get<Permission[]>("/api/permissions");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar permissões:", error);
      return [];
    }
  },

  /**
   * Obtém uma permissão pelo ID
   */
  getPermissionById: async (id: number): Promise<Permission> => {
    try {
      const response = await api.get<Permission>(`/api/permissions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar permissão ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria uma nova permissão
   */
  createPermission: async (
    permission: PermissionCreateRequest
  ): Promise<Permission> => {
    try {
      const response = await api.post<Permission>(
        "/api/permissions",
        permission
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao criar permissão:", error);
      throw error;
    }
  },

  /**
   * Atualiza uma permissão existente
   */
  updatePermission: async (
    id: number,
    permission: PermissionCreateRequest
  ): Promise<Permission> => {
    try {
      const response = await api.put<Permission>(
        `/api/permissions/${id}`,
        permission
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar permissão ${id}:`, error);
      throw error;
    }
  },

  /**
   * Exclui uma permissão
   */
  deletePermission: async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/permissions/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir permissão ${id}:`, error);
      throw error;
    }
  },
};

export default permissionService;
