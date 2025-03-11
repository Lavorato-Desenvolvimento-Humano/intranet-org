// services/auth.ts
import api from "./api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string; // Apenas no frontend, não enviado ao backend
}

export interface ResetPasswordRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface NewPasswordRequest {
  email: string;
  verificationCode: string;
  newPassword: string;
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

// Função para fazer login
export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    console.log(
      "Tentando fazer login com:",
      JSON.stringify(credentials, null, 2)
    );
    const endpoint = "/auth/login";
    console.log("Endpoint de login:", endpoint);

    const response = await api.post<AuthResponse>(endpoint, credentials);
    console.log("Resposta de login:", response.data);

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
    return user;
  } catch (error: any) {
    console.error("Erro ao fazer login:", error);
    if (error.response) {
      console.error("Detalhes do erro:", {
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
};

// Função para registrar um novo usuário
export const register = async (data: RegisterData): Promise<User> => {
  // Remover confirmPassword, pois o backend não espera esse campo
  const { confirmPassword, ...registerData } = data;

  try {
    console.log(
      "Tentando registrar usuário com:",
      JSON.stringify(registerData, null, 2)
    );
    // Verificar qual é o endpoint completo
    const endpoint = "/auth/register";
    console.log("Endpoint de registro:", endpoint);
    console.log("URL completa:", api.defaults.baseURL + endpoint);

    const response = await api.post<AuthResponse>(endpoint, registerData);
    console.log("Resposta de registro:", response.data);

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
    return user;
  } catch (error: any) {
    console.error("Erro ao registrar usuário:", error);
    // Adicionar mais informações detalhadas do erro
    if (error.response) {
      console.error("Detalhes do erro:", {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error("Nenhuma resposta recebida:", error.request);
    } else {
      console.error("Erro de configuração:", error.message);
    }
    throw error;
  }
};

// Função para solicitar reset de senha
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await api.post("/auth/reset-password/request", null, {
      params: { email },
    });
  } catch (error) {
    console.error("Erro ao solicitar redefinição de senha:", error);
    throw error;
  }
};

// Função para verificar código de recuperação
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

// Função para redefinir a senha
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

// Função para fazer logout
export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Redirecionar para a página de login (opcional)
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
};

// Função para obter usuário atual
export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") {
    return null; // Estamos no servidor
  }

  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

// Login com GitHub
export const githubLogin = (code: string): Promise<User> => {
  return api
    .get<AuthResponse>(`/auth/github/callback?code=${code}`)
    .then((response) => {
      const userData = response.data;

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
      return user;
    });
};
