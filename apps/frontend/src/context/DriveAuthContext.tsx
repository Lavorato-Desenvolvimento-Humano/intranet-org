"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { userDto, AuthContextType } from "@/types/auth";
import driveAuthService from "@/services/auth-drive";
import { getCurrentUser } from "@/services/auth";

// Contexto de autenticação específico para o Drive
const DriveAuthContext = createContext<AuthContextType | undefined>(undefined);

interface DriveAuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticação para o Drive
 * Implementa RF01.1 - Integração com Sistema Existente
 */
export function DriveAuthProvider({ children }: DriveAuthProviderProps) {
  const [user, setUser] = useState<userDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estado derivado
  const isAuthenticated = !!user && !!token;

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const checkPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;

      // Administradores têm todas as permissões
      if (driveAuthService.isAdmin(user)) return true;

      // Verificar permissões específicas do drive baseadas nas roles
      switch (permission) {
        case "drive:read":
          return driveAuthService.canAccessDrive(user);
        case "drive:write":
        case "drive:upload":
          return driveAuthService.canAccessDrive(user);
        case "drive:delete":
          return (
            driveAuthService.isSupervisorOrManager(user) ||
            driveAuthService.isAdmin(user)
          );
        case "drive:admin":
        case "drive:manage_permissions":
          return driveAuthService.isAdmin(user);
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
      return driveAuthService.hasRole(user, role);
    },
    [user]
  );

  /**
   * Verifica se o usuário tem alguma das roles especificadas
   */
  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return driveAuthService.hasAnyRole(user, roles);
    },
    [user]
  );

  /**
   * Valida o token atual
   */
  const validateToken = useCallback(async (): Promise<boolean> => {
    const currentToken = token || driveAuthService.getStoredToken();

    if (!currentToken) {
      return false;
    }

    try {
      const result = await driveAuthService.validateTokenWithCore(currentToken);

      if (result.valid && result.user) {
        setUser(result.user);
        setToken(currentToken);
        return true;
      } else {
        setUser(null);
        setToken(null);
        driveAuthService.removeStoredToken();
        return false;
      }
    } catch (error) {
      console.error("Erro na validação do token:", error);
      setUser(null);
      setToken(null);
      driveAuthService.removeStoredToken();
      return false;
    }
  }, [token]);

  /**
   * Faz login com um token fornecido
   */
  const login = useCallback(async (newToken: string): Promise<void> => {
    try {
      setIsLoading(true);

      const result = await driveAuthService.validateTokenWithCore(newToken);

      if (result.valid && result.user) {
        // Verificar se o usuário pode acessar o Drive
        if (!driveAuthService.canAccessDrive(result.user)) {
          throw new Error("Usuário não tem permissão para acessar o Drive");
        }

        setUser(result.user);
        setToken(newToken);
        driveAuthService.storeToken(newToken);
      } else {
        throw new Error(result.message || "Token inválido");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      setUser(null);
      setToken(null);
      driveAuthService.removeStoredToken();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Faz logout (opção de manter login do sistema principal)
   */
  const logout = useCallback((keepSystemLogin: boolean = false) => {
    setUser(null);
    setToken(null);

    if (keepSystemLogin) {
      // Logout apenas do Drive, mantém login do sistema principal
      driveAuthService.logoutDrive();
    } else {
      // Logout completo do sistema
      driveAuthService.logoutComplete();
    }
  }, []);

  /**
   * Inicialização do contexto
   * Tenta fazer login automático com token existente do sistema principal
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        // Primeiro, tentar token armazenado específico do Drive
        const storedDriveToken = driveAuthService.getStoredToken();

        if (storedDriveToken) {
          const isValid = await validateToken();
          if (isValid) {
            console.log("Login realizado com token do Drive armazenado");
            return; // Login bem-sucedido com token do Drive
          }
        }

        // Verificar se há usuário logado no sistema principal
        const systemUser = getCurrentUser();

        if (systemUser?.token) {
          // Tentar usar o token do sistema principal
          const validation = await driveAuthService.validateTokenWithCore(
            systemUser.token
          );

          if (validation.valid && validation.user) {
            if (driveAuthService.canAccessDrive(validation.user)) {
              setUser(validation.user);
              setToken(systemUser.token);
              driveAuthService.storeToken(systemUser.token);
              console.log(
                "Login automático realizado com token do sistema principal"
              );
              return;
            } else {
              console.warn(
                "Usuário do sistema principal não tem permissão para acessar o Drive"
              );
            }
          }
        }

        // Se não há token do Drive nem do sistema principal, tentar login automático
        const autoLoginResult = await driveAuthService.loginWithExistingToken();

        if (autoLoginResult.valid && autoLoginResult.user) {
          if (driveAuthService.canAccessDrive(autoLoginResult.user)) {
            setUser(autoLoginResult.user);
            setToken(driveAuthService.getStoredToken());
            console.log("Login automático realizado com sucesso");
          } else {
            console.warn("Usuário não tem permissão para acessar o Drive");
          }
        } else {
          console.log("Login automático falhou:", autoLoginResult.message);
        }
      } catch (error) {
        console.error("Erro na inicialização da autenticação:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // Removemos validateToken das dependências para evitar loops

  // Verificar periodicamente se o token ainda é válido
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(
      async () => {
        const isValid = await validateToken();
        if (!isValid) {
          console.warn("Token expirado, fazendo logout...");
          logout(true); // Manter login do sistema principal
        }
      },
      5 * 60 * 1000
    ); // Verificar a cada 5 minutos

    return () => clearInterval(interval);
  }, [isAuthenticated, validateToken, logout]);

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkPermission,
    hasRole,
    hasAnyRole,
    validateToken,
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
export function useDriveAuth(): AuthContextType {
  const context = useContext(DriveAuthContext);

  if (context === undefined) {
    throw new Error(
      "useDriveAuth deve ser usado dentro de um DriveAuthProvider"
    );
  }

  return context;
}

export default DriveAuthContext;
