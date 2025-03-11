// contexts/AuthContext.tsx - VERSÃO CORRIGIDA
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import toastUtil from "@/utils/toast";
import api from "@/services/api";

// Interfaces
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

// Interface para o contexto de autenticação
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  verifyResetCode: (email: string, code: string) => Promise<void>;
  resetPassword: (data: NewPasswordRequest) => Promise<void>;
}

// Criação do contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para o provedor de autenticação
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const checkUser = () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  // Função de login aprimorada que tenta múltiplos endpoints
  const login = async (credentials: LoginCredentials) => {
    const loadingToastId = toastUtil.loading("Fazendo login...");

    try {
      setLoading(true);

      // Usar apenas o endpoint padrão
      console.log("Tentando login com endpoint padrão");
      const response = await api.post<AuthResponse>("/auth/login", credentials);
      const userData = processAuthResponse(response.data);
      setUser(userData);
      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Login realizado com sucesso!");
      window.location.href = "/";
    } catch (err: any) {
      toastUtil.dismiss(loadingToastId);
      console.error("Erro no login:", err);

      if (err.response && err.response.data) {
        const errorMessage =
          typeof err.response.data.message === "string"
            ? err.response.data.message
            : "Email ou senha incorretos";

        toastUtil.error(errorMessage);
      } else {
        toastUtil.error("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para processar a resposta de autenticação
  function processAuthResponse(userData: AuthResponse): User {
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
  }

  // Função para registrar um novo usuário
  const register = async (data: RegisterData) => {
    // Verificar se as senhas coincidem
    if (data.password !== data.confirmPassword) {
      toastUtil.error("As senhas não coincidem.");
      return;
    }

    const loadingToastId = toastUtil.loading("Criando sua conta...");

    try {
      setLoading(true);
      // Remover confirmPassword antes de enviar para o backend
      const { confirmPassword, ...registerData } = data;

      const response = await api.post<AuthResponse>(
        "/auth/register",
        registerData
      );
      const userData = processAuthResponse(response.data);
      setUser(userData);

      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Conta criada com sucesso!");
      window.location.href = "/";
    } catch (err: any) {
      toastUtil.dismiss(loadingToastId);

      if (err.response && err.response.data) {
        // O backend pode retornar múltiplos erros de validação
        if (
          typeof err.response.data === "object" &&
          !Array.isArray(err.response.data)
        ) {
          const errorMessages = Object.values(err.response.data).join(", ");
          toastUtil.error(errorMessages);
        } else {
          toastUtil.error(
            err.response.data.message ||
              "Erro ao registrar. Verifique seus dados."
          );
        }
      } else {
        toastUtil.error("Erro ao registrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toastUtil.info("Você saiu da sua conta");
    window.location.href = "/auth/login";
  };

  // Função para solicitar reset de senha
  const requestPasswordReset = async (email: string) => {
    const loadingToastId = toastUtil.loading("Enviando solicitação...");

    try {
      setLoading(true);
      await api.post("/auth/reset-password/request", null, {
        params: { email },
      });
      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Código de redefinição enviado para seu email");
      window.location.href = `/auth/reset-password/code?email=${encodeURIComponent(email)}`;
    } catch (err: any) {
      toastUtil.dismiss(loadingToastId);
      toastUtil.error(
        "Erro ao solicitar redefinição de senha. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar código de recuperação
  const verifyResetCode = async (email: string, code: string) => {
    const loadingToastId = toastUtil.loading("Verificando código...");

    try {
      setLoading(true);
      await api.post("/auth/reset-password/verify", null, {
        params: { email, code },
      });
      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Código verificado com sucesso");
      window.location.href = `/auth/reset-password/new-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;
    } catch (err: any) {
      toastUtil.dismiss(loadingToastId);
      toastUtil.error(
        "Código inválido. Por favor, verifique e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Função para redefinir a senha
  const resetPassword = async (data: NewPasswordRequest) => {
    const loadingToastId = toastUtil.loading("Redefinindo sua senha...");

    try {
      setLoading(true);
      await api.post("/auth/reset-password/complete", data);
      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Senha redefinida com sucesso!");
      window.location.href = "/auth/login?reset=success";
    } catch (err: any) {
      toastUtil.dismiss(loadingToastId);
      toastUtil.error("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Função para obter usuário atual do localStorage
  function getCurrentUser(): User | null {
    if (typeof window === "undefined") {
      return null; // Estamos no servidor
    }

    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Valores expostos pelo contexto
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    requestPasswordReset,
    verifyResetCode,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook para usar o contexto de autenticação
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
