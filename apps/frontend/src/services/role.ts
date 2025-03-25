// src/services/role.ts
import api from "./api";
import toastUtil from "@/utils/toast";

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
      const response = await api.get<Role[]>("/api/roles");
      return response.data;
    } catch (error: any) {
      console.error("Erro ao buscar roles:", error);

      // Mensagens específicas baseadas no tipo de erro
      if (error.response) {
        if (error.response.status === 403) {
          throw new Error("Você não tem permissão para visualizar cargos");
        } else if (error.response.status === 401) {
          throw new Error("Sessão expirada. Faça login novamente");
        } else if (error.response.data?.message) {
          throw new Error(error.response.data.message);
        }
      }

      // Se não for tratado acima, retornar array vazio e mostrar toast
      toastUtil.error(
        "Falha ao carregar cargos. Verifique o console para detalhes."
      );
      return [];
    }
  },

  /**
   * Obtém uma role pelo ID
   */
  getRoleById: async (id: number): Promise<Role> => {
    try {
      const response = await api.get<Role>(`/api/roles/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao buscar role ${id}:`, error);

      if (error.response?.status === 404) {
        throw new Error(`Cargo com ID ${id} não encontrado`);
      }

      throw error;
    }
  },

  /**
   * Cria uma nova role
   */
  createRole: async (role: RoleCreateRequest): Promise<Role> => {
    try {
      const response = await api.post<Role>("/api/roles", role);
      return response.data;
    } catch (error: any) {
      console.error("Erro ao criar role:", error);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 409) {
        throw new Error(`O cargo ${role.name} já existe`);
      } else if (error.response?.status === 400) {
        throw new Error("Dados inválidos para criação de cargo");
      }

      throw new Error("Erro ao criar cargo. Tente novamente.");
    }
  },

  /**
   * Atualiza uma role existente
   */
  updateRole: async (id: number, role: RoleUpdateRequest): Promise<Role> => {
    try {
      const response = await api.put<Role>(`/api/roles/${id}`, role);
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao atualizar role ${id}:`, error);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 404) {
        throw new Error(`Cargo com ID ${id} não encontrado`);
      } else if (error.response?.status === 400) {
        throw new Error("Dados inválidos para atualização de cargo");
      }

      throw new Error(`Erro ao atualizar cargo ${id}. Tente novamente.`);
    }
  },

  /**
   * Exclui uma role
   */
  deleteRole: async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/roles/${id}`);
    } catch (error: any) {
      console.error(`Erro ao excluir role ${id}:`, error);

      if (error.response?.status === 404) {
        throw new Error(`Cargo com ID ${id} não encontrado`);
      } else if (error.response?.status === 400) {
        if (error.response.data?.message?.includes("usuários")) {
          throw new Error(
            "Não é possível excluir cargo com usuários vinculados"
          );
        } else {
          throw new Error(
            error.response.data?.message || "Erro ao excluir cargo"
          );
        }
      }

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
        `/api/roles/${roleId}/permissions/${permissionId}`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        `Erro ao adicionar permissão ${permissionId} à role ${roleId}:`,
        error
      );

      if (error.response?.status === 404) {
        throw new Error("Cargo ou permissão não encontrada");
      } else if (error.response?.status === 409) {
        throw new Error("Esta permissão já está associada a este cargo");
      }

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
        `/api/roles/${roleId}/permissions/${permissionId}`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        `Erro ao remover permissão ${permissionId} da role ${roleId}:`,
        error
      );

      if (error.response?.status === 404) {
        throw new Error("Cargo ou permissão não encontrada");
      }

      throw error;
    }
  },
};

export default roleService;
