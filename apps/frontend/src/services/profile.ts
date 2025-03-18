// src/services/profile.ts
import api from "./api";
import { User } from "./auth";

export interface ProfileUpdateData {
  fullName?: string;
  email?: string;
}

export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * Serviço para gerenciar operações relacionadas ao perfil do usuário
 */
const profileService = {
  /**
   * Obtém os detalhes do perfil do usuário atual
   */
  getCurrentProfile: async (): Promise<User> => {
    try {
      const response = await api.get<User>("/users/me");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar perfil do usuário:", error);
      throw error;
    }
  },

  /**
   * Atualiza os dados do perfil do usuário
   */
  updateProfile: async (
    userId: string,
    data: ProfileUpdateData
  ): Promise<User> => {
    try {
      const response = await api.put<User>(`/users/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      throw error;
    }
  },

  /**
   * Atualiza a senha do usuário
   */
  updatePassword: async (
    userId: string,
    data: PasswordUpdateData
  ): Promise<User> => {
    try {
      // O backend espera apenas "password" no body para atualizar a senha
      const response = await api.put<User>(`/users/${userId}`, {
        password: data.newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
      throw error;
    }
  },

  /**
   * Atualiza a imagem de perfil do usuário
   */
  updateProfileImage: async (
    userId: string,
    imageFile: File
  ): Promise<User> => {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await api.post<User>(
        `/users/${userId}/profile-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao atualizar imagem de perfil:", error);
      throw error;
    }
  },

  /**
   * Exclui a conta do usuário
   */
  deleteAccount: async (userId: string): Promise<void> => {
    try {
      await api.delete(`/users/${userId}`);
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      throw error;
    }
  },
};

export default profileService;
