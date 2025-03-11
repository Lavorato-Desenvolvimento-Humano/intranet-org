// auth-simple.ts - Coloque este arquivo ao lado de auth.ts
import api from "./api";
import { LoginCredentials, User } from "./auth";
import toastUtil from "@/utils/toast";

// Função para fazer login usando o endpoint simples
export const loginSimple = async (
  credentials: LoginCredentials
): Promise<User> => {
  try {
    console.log("Tentando fazer login simples com:", credentials.email);
    const response = await api.post("/auth/simple/login", credentials);
    console.log("Resposta de login simples:", response.data);

    const userData = response.data;

    // Salva o token e informações do usuário no localStorage
    localStorage.setItem("token", userData.token);

    const user: User = {
      id: userData.id,
      fullName: userData.fullName,
      email: userData.email,
      profileImage: userData.profileImage || undefined,
      roles: userData.roles,
      token: userData.token,
    };

    localStorage.setItem("user", JSON.stringify(user));
    toastUtil.success("Login realizado com sucesso!");

    return user;
  } catch (error: any) {
    console.error("Erro ao fazer login simples:", error);
    if (error.response?.data?.message) {
      toastUtil.error(error.response.data.message);
    } else {
      toastUtil.error("Erro ao fazer login. Tente novamente.");
    }
    throw error;
  }
};
