// src/context/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import toastUtil from "@/utils/toast";
import * as authService from "@/services/auth";
import {
  User,
  LoginCredentials,
  RegisterData,
  NewPasswordRequest,
} from "@/services/auth";

// Interface do contexto de autenticação
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

// Criar contexto
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
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  // Função de login aprimorada com melhor tratamento de erros
  const login = async (credentials: LoginCredentials) => {
    const loadingToastId = toastUtil.loading("Fazendo login...");

    try {
      setLoading(true);
      const userData = await authService.login(credentials);
      setUser(userData);

      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Login realizado com sucesso!");

      // Redirecionar para página inicial
      window.location.href = "/";
    } catch (err: any) {
      toastUtil.dismiss(loadingToastId);

      // Mostrar mensagem de erro detalhada quando disponível
      if (err.response && err.response.data) {
        // Verificar diferentes formatos de resposta de erro
        if (typeof err.response.data === "string") {
          toastUtil.error(err.response.data);
        } else if (err.response.data.message) {
          toastUtil.error(err.response.data.message);
        } else if (err.response.data.error) {
          toastUtil.error(err.response.data.error);
        } else {
          toastUtil.error("Email ou senha incorretos");
        }
      } else if (err.message && err.message.includes("timeout")) {
        toastUtil.error(
          "Tempo limite excedido. Verifique sua conexão e tente novamente."
        );
      } else {
        toastUtil.error("Falha no login. Por favor, tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    // Verificar se as senhas coincidem
    if (data.password !== data.confirmPassword) {
      toastUtil.error("As senhas não coincidem.");
      return;
    }

    if (!data.email.endsWith("@lavorato.com.br")) {
      toastUtil.error(
        "Apenas email com domínio @lavorato.com.br são permitidos"
      );
      return;
    }

    const loadingToastId = toastUtil.loading("Criando sua conta...");

    try {
      setLoading(true);
      const userData = await authService.register(data);
      setUser(userData);

      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Conta criada com sucesso!");
      window.location.href = "/";
    } catch (err: any) {
      toastUtil.dismiss(loadingToastId);

      // Tratamento detalhado de erros
      if (err.response && err.response.data) {
        if (
          typeof err.response.data === "object" &&
          !Array.isArray(err.response.data)
        ) {
          const errorMessages = Object.values(err.response.data).join(", ");
          toastUtil.error(errorMessages);
        } else if (err.response.data.message) {
          toastUtil.error(err.response.data.message);
        } else {
          toastUtil.error("Erro ao registrar. Verifique seus dados.");
        }
      } else {
        toastUtil.error("Erro ao registrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Função de logout simplificada
  const logout = () => {
    authService.logout();
    setUser(null);
    toastUtil.info("Você saiu da sua conta");
  };

  // Função para solicitar redefinição de senha
  const requestPasswordReset = async (email: string) => {
    const loadingToastId = toastUtil.loading("Enviando solicitação...");

    try {
      setLoading(true);
      await authService.requestPasswordReset(email);
      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Código de redefinição enviado para seu email");
      window.location.href = `/auth/reset-password/code?email=${encodeURIComponent(email)}`;
    } catch (err: any) {
      toastUtil.dismiss(loadingToastId);

      if (err.response && err.response.data && err.response.data.message) {
        toastUtil.error(err.response.data.message);
      } else {
        toastUtil.error(
          "Erro ao solicitar redefinição de senha. Tente novamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar código de redefinição
  const verifyResetCode = async (email: string, code: string) => {
    const loadingToastId = toastUtil.loading("Verificando código...");

    try {
      setLoading(true);
      await authService.verifyResetCode(email, code);
      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Código verificado com sucesso");
      window.location.href = `/auth/reset-password/new-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;
    } catch (err: any) {
      toastUtil.dismiss(loadingToastId);

      if (err.response && err.response.data && err.response.data.message) {
        toastUtil.error(err.response.data.message);
      } else {
        toastUtil.error(
          "Código inválido. Por favor, verifique e tente novamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para redefinir senha
  const resetPassword = async (data: NewPasswordRequest) => {
    const loadingToastId = toastUtil.loading("Redefinindo sua senha...");

    try {
      setLoading(true);
      await authService.resetPassword(data);
      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Senha redefinida com sucesso!");
      window.location.href = "/auth/login?reset=success";
    } catch (err: any) {
      toastUtil.dismiss(loadingToastId);

      if (err.response && err.response.data && err.response.data.message) {
        toastUtil.error(err.response.data.message);
      } else {
        toastUtil.error("Erro ao redefinir senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

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
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
