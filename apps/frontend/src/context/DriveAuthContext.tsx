// context/DriveAuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { UserDto } from "@/services/user";
import { userDto, AuthContextType, DrivePermission } from "@/types/auth";
import driveAuthService from "@/services/auth-drive";

const DriveAuthContext = createContext<AuthContextType | undefined>(undefined);

interface DriveAuthProviderProps {
  children: React.ReactNode;
}

const getCurrentUser = (): UserDto | null => {
  if (typeof window !== "undefined") {
    const userJson = localStorage.getItem("currentUser");
    return userJson ? JSON.parse(userJson) : null;
  }
  return null;
};

export function DriveAuthProvider({ children }: DriveAuthProviderProps) {
  const [user, setUser] = useState<userDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Computed values
  const isAuthenticated = !!user && !!token;

  /**
   * Verifica se o usuário tem uma permissão específica
   * Implementa RF01.1 - Integação com roles existentes
   */
  const checkPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;

      // Admins têm todas as permissões
      if (driveAuthService.isAdmin(user)) return true;

      // Mapeamento de roles para permissões do Drive
      const rolePermissions: Record<string, string[]> = {
        SUPERVISOR: [
          DrivePermission.READ,
          DrivePermission.WRITE,
          DrivePermission.UPLOAD,
          DrivePermission.DOWNLOAD,
          DrivePermission.CREATE_FOLDER,
          DrivePermission.SHARE,
          DrivePermission.VIEW_AUDIT,
        ],
        GERENTE: [
          DrivePermission.READ,
          DrivePermission.WRITE,
          DrivePermission.UPLOAD,
          DrivePermission.DOWNLOAD,
          DrivePermission.CREATE_FOLDER,
          DrivePermission.SHARE,
          DrivePermission.MANAGE_PERMISSIONS,
          DrivePermission.VIEW_AUDIT,
        ],
        USER: [
          DrivePermission.READ,
          DrivePermission.WRITE,
          DrivePermission.UPLOAD,
          DrivePermission.DOWNLOAD,
          DrivePermission.CREATE_FOLDER,
        ],
      };

      // Verificar permissões baseadas nas roles do usuário
      for (const userRole of user.roles) {
        const roleKey = userRole.replace("ROLE_", "").toUpperCase();
        const permissions = rolePermissions[roleKey];

        if (permissions && permissions.includes(permission)) {
          return true;
        }
      }

      return false;
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

        // Verificar se há usuário logado no sistema principal
        const systemUser = getCurrentUser();

        if (!systemUser) {
          console.log("Nenhum usuário logado no sistema principal");
          return;
        }

        // Primeiro, tentar token armazenado específico do Drive
        const storedDriveToken = driveAuthService.getStoredToken();

        if (storedDriveToken && systemUser.token === storedDriveToken) {
          const isValid = await validateToken();
          if (isValid) {
            return; // Login bem-sucedido com token do Drive
          }
        }

        // Se não há token do Drive ou é diferente, tentar login automático
        const autoLoginResult = await driveAuthService.loginWithExistingToken();

        if (autoLoginResult.valid && autoLoginResult.user) {
          if (driveAuthService.canAccessDrive(autoLoginResult.user)) {
            setUser(autoLoginResult.user);
            setToken(systemUser.token || null);
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
  }, [validateToken]);

  // Verificar periodicamente se o token ainda é válido
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(
      async () => {
        const isValid = await validateToken();
        if (!isValid) {
          console.warn("Token expirado, fazendo logout...");
          logout();
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
