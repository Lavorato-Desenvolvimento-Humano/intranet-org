// apps/frontend/src/context/DriveAuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import driveAuthService from "@/services/auth-drive";
import { getCurrentUser } from "@/services/auth";
import toastUtil from "@/utils/toast";

// Interfaces específicas do Drive
interface DriveUser {
  id: number;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  emailVerified: boolean;
  adminApproved: boolean;
}

interface DriveAuthContextType {
  user: DriveUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  canAccessDrive: boolean;

  // Métodos principais
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: (keepSystemLogin?: boolean) => void;
  validateToken: () => Promise<boolean>;

  // Verificações de permissão
  checkPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;

  // Métodos utilitários
  refreshUser: () => Promise<void>;
  getDebugInfo: () => any;
}

// Contexto de autenticação específico para o Drive
const DriveAuthContext = createContext<DriveAuthContextType | undefined>(
  undefined
);

interface DriveAuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticação para o Drive
 * Implementa RF01.1 - Integração com Sistema Existente
 */
export function DriveAuthProvider({ children }: DriveAuthProviderProps) {
  const [user, setUser] = useState<DriveUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados derivados
  const isAuthenticated = !!(user && token);
  const canAccessDrive = user ? driveAuthService.canAccessDrive() : false;

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const checkPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;

      // Usar o método do DriveAuthService
      const currentUser = driveAuthService.getCurrentUser();
      if (!currentUser) return false;

      // Administradores têm todas as permissões
      if (currentUser.roles?.includes("ADMIN")) return true;

      // Verificar permissões específicas do drive baseadas nas roles
      switch (permission) {
        case "drive:read":
        case "drive:view":
          return driveAuthService.canAccessDrive();
        case "drive:write":
        case "drive:upload":
        case "drive:create":
          return driveAuthService.canAccessDrive();
        case "drive:delete":
        case "drive:manage":
          return (
            currentUser.roles?.some((role) =>
              ["ADMIN", "SUPERVISOR", "MANAGER"].includes(role)
            ) || false
          );
        case "drive:admin":
        case "drive:manage_permissions":
          return currentUser.roles?.includes("ADMIN") || false;
        default:
          return false;
      }
    },
    [user]
  );

  /**
   * Verifica se o usuário tem uma role específica
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user) return false;
      return user.roles?.includes(role) || false;
    },
    [user]
  );

  /**
   * Verifica se o usuário tem alguma das roles especificadas
   */
  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      if (!user) return false;
      return roles.some((role) => user.roles?.includes(role)) || false;
    },
    [user]
  );

  /**
   * Valida o token atual
   */
  const validateToken = useCallback(async (): Promise<boolean> => {
    try {
      const isValid = await driveAuthService.validateToken();

      if (isValid) {
        const currentUser = driveAuthService.getCurrentUser();
        const currentToken = driveAuthService.getStoredToken();

        if (currentUser && currentToken) {
          setUser(currentUser);
          setToken(currentToken);
          return true;
        }
      }

      // Token inválido, limpar estado
      setUser(null);
      setToken(null);
      return false;
    } catch (error) {
      console.error("[DriveAuthContext] Erro na validação do token:", error);
      setUser(null);
      setToken(null);
      return false;
    }
  }, []);

  /**
   * Atualizar dados do usuário
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const isValid = await validateToken();
      if (!isValid) {
        console.warn("[DriveAuthContext] Token inválido durante refresh");
      }
    } catch (error) {
      console.error("[DriveAuthContext] Erro ao atualizar usuário:", error);
    }
  }, [validateToken]);

  /**
   * Fazer login com credenciais
   */
  const login = useCallback(
    async (credentials: { email: string; password: string }): Promise<void> => {
      try {
        setIsLoading(true);

        console.log("[DriveAuthContext] Iniciando login...");

        const loggedUser = await driveAuthService.login(credentials);
        const storedToken = driveAuthService.getStoredToken();

        if (loggedUser && storedToken) {
          setUser(loggedUser);
          setToken(storedToken);
          console.log("[DriveAuthContext] Login realizado com sucesso");
        } else {
          throw new Error("Falha ao obter dados do usuário após login");
        }
      } catch (error: any) {
        console.error("[DriveAuthContext] Erro no login:", error);

        // Limpar estado em caso de erro
        setUser(null);
        setToken(null);

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Fazer login com token fornecido
   */
  const loginWithToken = useCallback(
    async (newToken: string): Promise<void> => {
      try {
        setIsLoading(true);

        console.log("[DriveAuthContext] Fazendo login com token fornecido...");

        // Armazenar token temporariamente para validação
        driveAuthService.setStoredToken(newToken);

        const isValid = await driveAuthService.validateToken();

        if (isValid) {
          const currentUser = driveAuthService.getCurrentUser();

          if (currentUser) {
            setUser(currentUser);
            setToken(newToken);
            console.log(
              "[DriveAuthContext] Login com token realizado com sucesso"
            );
          } else {
            throw new Error("Usuário não encontrado após validação do token");
          }
        } else {
          throw new Error("Token inválido");
        }
      } catch (error: any) {
        console.error("[DriveAuthContext] Erro no login com token:", error);

        // Limpar estado e token em caso de erro
        setUser(null);
        setToken(null);
        driveAuthService.removeStoredToken();

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Fazer logout
   */
  const logout = useCallback((keepSystemLogin: boolean = false) => {
    console.log(
      `[DriveAuthContext] Fazendo logout ${keepSystemLogin ? "(mantendo sistema)" : "(completo)"}...`
    );

    setUser(null);
    setToken(null);

    // Usar método do DriveAuthService
    driveAuthService.logout();

    if (!keepSystemLogin) {
      // Se não for para manter login do sistema, limpar também do auth principal
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    console.log("[DriveAuthContext] Logout realizado");
  }, []);

  /**
   * Obter informações de debug
   */
  const getDebugInfo = useCallback(() => {
    return {
      ...driveAuthService.getDebugInfo(),
      contextState: {
        user: user?.email || null,
        hasToken: !!token,
        isAuthenticated,
        canAccessDrive,
        isLoading,
      },
    };
  }, [user, token, isAuthenticated, canAccessDrive, isLoading]);

  /**
   * Inicialização do contexto
   * Tenta fazer login automático com token existente
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        console.log("[DriveAuthContext] Inicializando autenticação...");

        // 1. Primeiro, tentar token armazenado específico do Drive
        const storedDriveToken = driveAuthService.getStoredToken();

        if (storedDriveToken) {
          console.log(
            "[DriveAuthContext] Token do Drive encontrado, validando..."
          );

          const isValid = await driveAuthService.validateToken();
          if (isValid) {
            const currentUser = driveAuthService.getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
              setToken(storedDriveToken);
              console.log(
                "[DriveAuthContext] Login realizado com token do Drive armazenado"
              );
              return;
            }
          }
        }

        // 2. Verificar se há usuário logado no sistema principal
        const systemUser = getCurrentUser();

        if (systemUser?.token) {
          console.log(
            "[DriveAuthContext] Token do sistema principal encontrado, tentando usar..."
          );

          try {
            // Tentar usar o token do sistema principal para acessar o Drive
            await loginWithToken(systemUser.token);
            console.log(
              "[DriveAuthContext] Login realizado com token do sistema principal"
            );
            return;
          } catch (error) {
            console.warn(
              "[DriveAuthContext] Token do sistema principal não válido para Drive:",
              error
            );
          }
        }

        // 3. Nenhum login automático possível
        console.log("[DriveAuthContext] Nenhum token válido encontrado");
      } catch (error) {
        console.error(
          "[DriveAuthContext] Erro na inicialização da autenticação:",
          error
        );
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // Executar apenas uma vez na inicialização

  /**
   * Verificar periodicamente se o token ainda é válido
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log(
      "[DriveAuthContext] Configurando verificação periódica de token..."
    );

    const interval = setInterval(
      async () => {
        try {
          const isValid = await validateToken();
          if (!isValid) {
            console.warn(
              "[DriveAuthContext] Token expirado durante verificação periódica"
            );
            toastUtil.warning("Sua sessão expirou. Faça login novamente.");
            logout(true); // Manter login do sistema principal
          }
        } catch (error) {
          console.error(
            "[DriveAuthContext] Erro na verificação periódica:",
            error
          );
        }
      },
      5 * 60 * 1000 // Verificar a cada 5 minutos
    );

    return () => {
      console.log("[DriveAuthContext] Limpando verificação periódica de token");
      clearInterval(interval);
    };
  }, [isAuthenticated, validateToken, logout]);

  const contextValue: DriveAuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    canAccessDrive,
    login,
    loginWithToken,
    logout,
    validateToken,
    checkPermission,
    hasRole,
    hasAnyRole,
    refreshUser,
    getDebugInfo,
  };

  return (
    <DriveAuthContext.Provider value={contextValue}>
      {children}
    </DriveAuthContext.Provider>
  );
}

/**
 * Hook para usar o contexto de autenticação do Drive
 * Implementa RF01.1 - Integração com Sistema Existente
 */
export function useDriveAuth(): DriveAuthContextType {
  const context = useContext(DriveAuthContext);

  if (context === undefined) {
    throw new Error(
      "useDriveAuth deve ser usado dentro de um DriveAuthProvider"
    );
  }

  return context;
}
