// src/services/role.ts
import api from "./api";

export interface Permission {
  id: number;
  name: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
}

export interface RoleCreateRequest {
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface RoleUpdateRequest {
  description?: string;
  permissionIds?: number[];
}

/**
 * Serviço para gerenciar roles
 */
const roleService = {
  /**
   * Obtém todas as roles
   */
  getAllRoles: async (): Promise<Role[]> => {
    try {
      const response = await api.get<Role[]>("/roles");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar roles:", error);
      return [];
    }
  },

  /**
   * Obtém uma role pelo ID
   */
  getRoleById: async (id: number): Promise<Role> => {
    try {
      const response = await api.get<Role>(`/roles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar role ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria uma nova role
   */
  createRole: async (role: RoleCreateRequest): Promise<Role> => {
    try {
      const response = await api.post<Role>("/roles", role);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar role:", error);
      throw error;
    }
  },

  /**
   * Atualiza uma role existente
   */
  updateRole: async (id: number, role: RoleUpdateRequest): Promise<Role> => {
    try {
      const response = await api.put<Role>(`/roles/${id}`, role);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar role ${id}:`, error);
      throw error;
    }
  },

  /**
   * Exclui uma role
   */
  deleteRole: async (id: number): Promise<void> => {
    try {
      await api.delete(`/roles/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir role ${id}:`, error);
      throw error;
    }
  },

  /**
   * Adiciona uma permissão a uma role
   */
  addPermissionToRole: async (
    roleId: number,
    permissionId: number
  ): Promise<Role> => {
    try {
      const response = await api.post<Role>(
        `/roles/${roleId}/permissions/${permissionId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao adicionar permissão ${permissionId} à role ${roleId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Remove uma permissão de uma role
   */
  removePermissionFromRole: async (
    roleId: number,
    permissionId: number
  ): Promise<Role> => {
    try {
      const response = await api.delete<Role>(
        `/roles/${roleId}/permissions/${permissionId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao remover permissão ${permissionId} da role ${roleId}:`,
        error
      );
      throw error;
    }
  },
};

export default roleService;
