// src/services/profile.ts
import api from "./api";
import { User } from "./auth";
import { buildProfileImageUrl } from "@/utils/imageUtils";

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

      // Atualizar o usuário no localStorage com os novos dados
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser && currentUser.id === userId) {
        Object.assign(currentUser, response.data);
        localStorage.setItem("user", JSON.stringify(currentUser));
      }

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
      // O backend espera "password" no body para atualizar a senha
      // Também enviar a senha atual para validação
      const response = await api.put<User>(`/users/${userId}`, {
        currentPassword: data.currentPassword,
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

      // Configuração especial para upload de arquivo
      const response = await api.post<User>(
        `/users/${userId}/profile-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          // Aumentando timeout para uploads
          timeout: 60000, // 60 segundos
        }
      );

      // Construir a URL completa da imagem para garantir que seja acessível
      let profileImageUrl = response.data.profileImage;
      if (
        profileImageUrl &&
        !profileImageUrl.startsWith("http") &&
        !profileImageUrl.startsWith("data:")
      ) {
        profileImageUrl = buildProfileImageUrl(profileImageUrl);
      }

      // Criar um objeto de usuário atualizado com a URL completa
      const updatedUser = {
        ...response.data,
        profileImage: response.data.profileImage, // Manter a referência original do backend
      };

      // Atualizar o usuário no localStorage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser && currentUser.id === userId) {
        Object.assign(currentUser, updatedUser);
        localStorage.setItem("user", JSON.stringify(currentUser));

        console.log(
          "Usuário atualizado no localStorage após upload de imagem:",
          currentUser
        );
      }

      return updatedUser;
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
      // Configuração especial para operação crítica
      await api.delete(`/users/${userId}`, {
        timeout: 30000, // 30 segundos
      });

      // Limpar dados locais após exclusão bem-sucedida
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error: any) {
      console.error("Erro ao excluir conta:", error);

      if (error.response) {
        console.error("Resposta do servidor:", {
          status: error.response.status,
          data: error.response.data,
        });
      }

      throw error;
    }
  },
};

export default profileService;
