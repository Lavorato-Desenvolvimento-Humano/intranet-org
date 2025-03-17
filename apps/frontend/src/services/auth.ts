// src/services/auth.ts
import api from "./api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  profileImage?: string;
  roles: string[];
  token?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: string;
  fullName: string;
  email: string;
  profileImage: string | null;
  roles: string[];
}

export interface NewPasswordRequest {
  email: string;
  verificationCode: string;
  newPassword: string;
}

// Função de login usando apenas o endpoint /auth/login
export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    console.log("Tentando login com credenciais:", credentials.email);
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    return processAuthResponse(response.data);
  } catch (error) {
    console.error("Erro no login:", error);
    throw error;
  }
};

// Função auxiliar para processar resposta de autenticação
function processAuthResponse(userData: AuthResponse): User {
  // Salvar token no localStorage
  localStorage.setItem("token", userData.token);

  const user: User = {
    id: userData.id,
    fullName: userData.fullName,
    email: userData.email,
    profileImage: userData.profileImage || undefined,
    roles: userData.roles,
    token: userData.token,
  };

  // Salvar dados do usuário no localStorage
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

export const register = async (data: RegisterData): Promise<User> => {
  //Validar domínio do e-mail antes de enviar a requisição
  if (!data.email.endsWith("@lavorato.com.br")) {
    throw new Error(
      "Apenas emails com domínio @lavorato.com.br são permitidos"
    );
  }

  // Remover confirmPassword antes de enviar para o backend
  const { confirmPassword, ...registerData } = data;

  const response = await api.post<AuthResponse>("/auth/register", registerData);
  return processAuthResponse(response.data);
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await api.post("/auth/reset-password/request", null, {
      params: { email },
    });
  } catch (error) {
    console.error("Erro ao solicitar reset de senha:", error);
    throw error;
  }
};

export const verifyResetCode = async (
  email: string,
  code: string
): Promise<void> => {
  try {
    await api.post("/auth/reset-password/verify", null, {
      params: { email, code },
    });
  } catch (error) {
    console.error("Erro ao verificar código:", error);
    throw error;
  }
};

export const resetPassword = async (
  data: NewPasswordRequest
): Promise<void> => {
  try {
    await api.post("/auth/reset-password/complete", data);
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    throw error;
  }
};

export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
};

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") {
    return null; // Estamos no servidor
  }

  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const githubLogin = async (code: string): Promise<User> => {
  const response = await api.get<AuthResponse>(
    `/auth/github/callback?code=${code}`
  );
  return processAuthResponse(response.data);
};
