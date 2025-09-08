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
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
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
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          console.log("[Auth] Usuário logado encontrado:", currentUser.email);
        } else {
          console.log("[Auth] Nenhum usuário logado encontrado");
        }
      } catch (error) {
        console.error("[Auth] Erro ao verificar usuário atual:", error);
        // Limpar dados corrompidos
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
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

      // Verificar se é erro de email não verificado
      if (
        err.response &&
        err.response.status === 403 &&
        err.response.data &&
        (err.response.data.error === "Email não verificado" ||
          err.response.data.message ===
            "Por favor, verifique seu email antes de fazer login.")
      ) {
        toastUtil.error(
          "Email não verificado. Por favor, verifique seu email antes de fazer login."
        );
        // Redirecionar para página de verificação
        window.location.href = `/auth/verify-email?email=${encodeURIComponent(credentials.email)}`;
        return;
      }

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

    // if (!data.email.endsWith("@lavorato.com.br")) {
    //   toastUtil.error(
    //     "Apenas emails com domínio @lavorato.com.br são permitidos"
    //   );
    //   return;
    // }

    const loadingToastId = toastUtil.loading("Criando sua conta...");

    try {
      setLoading(true);
      await authService.register(data);

      toastUtil.dismiss(loadingToastId);
      toastUtil.success(
        "Conta criada com sucesso! Por favor, verifique seu email para ativar sua conta."
      );

      // Redirecionar para a página de verificação de email
      window.location.href = `/auth/verify-email?email=${encodeURIComponent(data.email)}`;
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
    //Validação básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toastUtil.error(
        "Email inválido. Por favor, verifique e tente novamente."
      );
      return;
    }

    // if (!email.endsWith("@lavorato.com.br")) {
    //   toastUtil.error(
    //     "Apenas emails com domínio @lavorato.com.br são permitidos"
    //   );
    //   return;
    // }

    const loadingToastId = toastUtil.loading("Enviando solicitação...");

    try {
      setLoading(true);
      const message = await authService.requestPasswordReset(email);
      toastUtil.dismiss(loadingToastId);

      toastUtil.info(
        message ||
          "Se o e-mail existir em nosso sistema, um código de redefinição será enviado."
      );

      window.location.href = `/auth/reset-password/code?email=${encodeURIComponent(email)}&status=requested`;
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

  const verifyEmailHandler = async (email: string, code: string) => {
    const loadingToastId = toastUtil.loading("Verificando email...");

    try {
      setLoading(true);
      await authService.verifyEmail(email, code);

      // Atualizar o status de verificação do usuário se estiver logado
      if (user && user.email === email) {
        const updatedUser = { ...user, emailVerified: true };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Email verificado com sucesso!");
      window.location.href = "/auth/login?verified=true";
    } catch (err: any) {
      toastUtil.dismiss(loadingToastId);

      if (err.response && err.response.data && err.response.data.error) {
        toastUtil.error(err.response.data.error);
      } else {
        toastUtil.error("Erro ao verificar email. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para reenviar email de verificação
  const resendVerificationEmailHandler = async (email: string) => {
    const loadingToastId = toastUtil.loading(
      "Enviando email de verificação..."
    );

    try {
      setLoading(true);
      const message = await authService.resendVerificationEmail(email);
      toastUtil.dismiss(loadingToastId);
      toastUtil.info(
        message ||
          "Se o e-mail existir em nosso sistema, um código de verificação será enviado."
      );
    } catch (err: any) {
      toastUtil.dismiss(loadingToastId);
      toastUtil.error(
        "Erro ao reenviar email de verificação. Tente novamente."
      );
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
    verifyEmail: verifyEmailHandler,
    resendVerificationEmail: resendVerificationEmailHandler,
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
