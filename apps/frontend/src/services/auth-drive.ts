import axios, { AxiosInstance } from "axios";
import {
  userDto,
  DriveAuthResponse,
  JwtTokenInfo,
  USER_ROLES,
} from "@/types/auth";
import { getCurrentUser } from "./auth";

class DriveAuthService {
  private api: AxiosInstance;

  constructor() {
    // URL base do Core Service para validação de auth
    const baseURL =
      process.env.NEXT_PUBLIC_CORE_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8443";

    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Interceptor para incluir token automaticamente
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para tratar respostas de erro
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeStoredToken();
          // Não redirecionar automaticamente aqui para evitar loops
          console.warn("Token inválido detectado");
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Valida token JWT com o Core Service
   * Implementa RF01.1 - Integração com Sistema Existente
   */
  async validateTokenWithCore(token?: string): Promise<DriveAuthResponse> {
    const tokenToValidate = token || this.getStoredToken();

    if (!tokenToValidate) {
      return {
        valid: false,
        message: "Token não fornecido",
      };
    }

    try {
      // Validação local básica primeiro
      if (!this.isTokenValidFormat(tokenToValidate)) {
        return {
          valid: false,
          message: "Formato de token inválido",
        };
      }

      // Decodificar token para verificar expiração
      const tokenInfo = this.decodeToken(tokenToValidate);
      if (tokenInfo && tokenInfo.exp < Date.now() / 1000) {
        return {
          valid: false,
          message: "Token expirado",
        };
      }

      // Validar com o Core Service
      const response = await this.api.post("/api/auth/validate", {
        token: tokenToValidate,
      });

      const { valid, user, message } = response.data;

      if (valid && user) {
        // Verificar se o usuário pode acessar o Drive
        if (!this.canAccessDrive(user)) {
          return {
            valid: false,
            message: "Usuário não tem permissão para acessar o Drive",
          };
        }

        return {
          valid: true,
          user: user,
        };
      }

      return {
        valid: false,
        message: message || "Token inválido",
      };
    } catch (error: any) {
      console.error("Erro na validação do token:", error);

      // Se for erro de rede ou servidor, tentar validação local como fallback
      if (error.code === "NETWORK_ERROR" || error.response?.status >= 500) {
        const localValidation = this.validateTokenLocally(tokenToValidate);
        if (localValidation.valid) {
          console.warn("Usando validação local como fallback");
          return localValidation;
        }
      }

      return {
        valid: false,
        message: error.response?.data?.message || "Erro na validação do token",
      };
    }
  }

  /**
   * Validação local como fallback
   */
  private validateTokenLocally(token: string): DriveAuthResponse {
    try {
      const tokenInfo = this.decodeToken(token);

      if (!tokenInfo) {
        return { valid: false, message: "Token não pode ser decodificado" };
      }

      // Verificar expiração
      if (tokenInfo.exp < Date.now() / 1000) {
        return { valid: false, message: "Token expirado" };
      }

      // Criar usuário básico a partir do token
      const user: userDto = {
        id: tokenInfo.sub,
        username: tokenInfo.sub,
        email: tokenInfo.sub,
        fullName: tokenInfo.sub,
        roles: tokenInfo.roles || [],
        isActive: true,
        emailVerified: true,
        adminApproved: true,
      };

      if (!this.canAccessDrive(user)) {
        return {
          valid: false,
          message: "Usuário não tem permissão para acessar o Drive",
        };
      }

      return {
        valid: true,
        user: user,
      };
    } catch (error) {
      return { valid: false, message: "Erro na validação local" };
    }
  }

  /**
   * Login usando token existente do sistema principal
   * (para quando o usuário já está logado na intranet)
   */
  async loginWithExistingToken(): Promise<DriveAuthResponse> {
    try {
      // Tentar recuperar token do localStorage do sistema principal
      const mainSystemToken = this.getMainSystemToken();

      if (mainSystemToken) {
        const validation = await this.validateTokenWithCore(mainSystemToken);
        if (validation.valid) {
          this.storeToken(mainSystemToken);
          return validation;
        }
      }

      // Tentar obter usuário logado do sistema principal
      const systemUser = getCurrentUser();
      if (systemUser?.token) {
        const validation = await this.validateTokenWithCore(systemUser.token);
        if (validation.valid) {
          this.storeToken(systemUser.token);
          return validation;
        }
      }

      return {
        valid: false,
        message: "Token do sistema principal não encontrado ou inválido",
      };
    } catch (error: any) {
      console.error("Erro no login automático:", error);
      return {
        valid: false,
        message: error.message || "Erro no login automático",
      };
    }
  }

  /**
   * Recupera token do sistema principal (se existir)
   * Versão segura para SSR
   */
  private getMainSystemToken(): string | null {
    if (typeof window !== "undefined") {
      try {
        // Tentar diferentes chaves que o sistema principal pode usar
        const possibleKeys = [
          "auth_token",
          "jwt_token",
          "access_token",
          "token",
          "intranet_token",
        ];

        for (const key of possibleKeys) {
          const token = localStorage.getItem(key);
          if (token && token.length > 10) {
            // Validação básica
            return token;
          }
        }
      } catch (error) {
        console.warn("Erro ao acessar localStorage:", error);
      }
    }
    return null;
  }

  /**
   * Decodifica token JWT (sem verificar assinatura)
   */
  private decodeToken(token: string): JwtTokenInfo | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      return null;
    }
  }

  /**
   * Verifica se o token tem formato válido
   */
  private isTokenValidFormat(token: string): boolean {
    const parts = token.split(".");
    return parts.length === 3 && parts.every((part) => part.length > 0);
  }

  /**
   * Verifica se o usuário tem uma role específica
   */
  hasRole(user: userDto | null, role: string): boolean {
    if (!user || !user.roles) return false;

    // Verificar tanto com quanto sem prefixo ROLE_
    const roleVariants = [
      role,
      role.startsWith("ROLE_") ? role.substring(5) : `ROLE_${role}`,
    ];

    return user.roles.some((userRole) =>
      roleVariants.some(
        (variant) => userRole.toUpperCase() === variant.toUpperCase()
      )
    );
  }

  /**
   * Verifica se o usuário tem alguma das roles especificadas
   */
  hasAnyRole(user: userDto | null, roles: string[]): boolean {
    if (!user || !roles || roles.length === 0) return false;
    return roles.some((role) => this.hasRole(user, role));
  }

  /**
   * Verifica se o usuário tem permissão para acessar o Drive
   */
  canAccessDrive(user: userDto | null): boolean {
    if (!user) return false;

    // Usuários ativos, verificados e aprovados podem acessar o drive
    const hasBasicAccess =
      user.isActive && user.emailVerified && user.adminApproved;

    // Verificar se tem pelo menos uma role válida
    const hasValidRole = this.hasAnyRole(user, [
      USER_ROLES.USER,
      USER_ROLES.ROLE_USER,
      USER_ROLES.ADMIN,
      USER_ROLES.ROLE_ADMIN,
      USER_ROLES.SUPERVISOR,
      USER_ROLES.ROLE_SUPERVISOR,
      USER_ROLES.GERENTE,
      USER_ROLES.ROLE_GERENTE,
    ]);

    return hasBasicAccess && hasValidRole;
  }

  /**
   * Verifica se o usuário é administrador
   */
  isAdmin(user: userDto | null): boolean {
    return this.hasAnyRole(user, [USER_ROLES.ADMIN, USER_ROLES.ROLE_ADMIN]);
  }

  /**
   * Verifica se o usuário é supervisor ou gerente
   */
  isSupervisorOrManager(user: userDto | null): boolean {
    return this.hasAnyRole(user, [
      USER_ROLES.SUPERVISOR,
      USER_ROLES.ROLE_SUPERVISOR,
      USER_ROLES.GERENTE,
      USER_ROLES.ROLE_GERENTE,
    ]);
  }

  /**
   * Armazena token no localStorage - Versão segura para SSR
   */
  storeToken(token: string): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("drive_auth_token", token);
      } catch (error) {
        console.warn("Erro ao armazenar token:", error);
      }
    }
  }

  /**
   * Recupera token do localStorage - Versão segura para SSR
   */
  getStoredToken(): string | null {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("drive_auth_token");
      } catch (error) {
        console.warn("Erro ao recuperar token:", error);
      }
    }
    return null;
  }

  /**
   * Remove token do localStorage - Versão segura para SSR
   */
  removeStoredToken(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("drive_auth_token");
      } catch (error) {
        console.warn("Erro ao remover token:", error);
      }
    }
  }

  /**
   * Faz logout completo - Versão segura para SSR
   */
  logout(): void {
    this.removeStoredToken();
    if (typeof window !== "undefined") {
      try {
        window.location.href = "/login";
      } catch (error) {
        console.warn("Erro ao redirecionar:", error);
      }
    }
  }

  /**
   * Logout apenas do Drive - Versão segura para SSR
   */
  logoutDrive(): void {
    this.removeStoredToken();
    if (typeof window !== "undefined") {
      try {
        window.location.href = "/drive/login";
      } catch (error) {
        console.warn("Erro ao redirecionar:", error);
      }
    }
  }

  /**
   * Logout completo do sistema - Versão segura para SSR
   */
  logoutComplete(): void {
    this.removeStoredToken();
    if (typeof window !== "undefined") {
      try {
        // Limpar também tokens do sistema principal
        localStorage.removeItem("auth_token");
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        window.location.href = "/logout";
      } catch (error) {
        console.warn("Erro ao fazer logout completo:", error);
      }
    }
  }
}

export default new DriveAuthService();
