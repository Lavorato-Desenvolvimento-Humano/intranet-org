// services/auth.ts
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
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_CORE_API_URL || "http://localhost:8443",
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
          // Redirecionar para login se necessário
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
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
    try {
      const tokenToValidate = token || this.getStoredToken();

      if (!tokenToValidate) {
        return { valid: false, message: "Token não encontrado" };
      }

      // Validação local básica antes de chamar o servidor
      if (!this.isTokenValidFormat(tokenToValidate)) {
        return { valid: false, message: "Formato de token inválido" };
      }

      // Validar com o Core Service
      const response = await this.api.post<userDto>(
        "/api/auth/validate",
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenToValidate}`,
          },
        }
      );

      if (response.status === 200 && response.data) {
        return {
          valid: true,
          user: response.data,
        };
      }

      return { valid: false, message: "Token inválido" };
    } catch (error: any) {
      console.error("Erro na validação do token:", error);

      if (error.response?.status === 401) {
        return { valid: false, message: "Token expirado ou inválido" };
      }

      // Em caso de erro de comunicação, tentar validação local
      const localValidation = this.validateTokenLocally(token);
      if (localValidation.valid) {
        console.warn(
          "Usando validação local devido à falha na comunicação com o Core Service"
        );
        return localValidation;
      }

      return { valid: false, message: "Erro na validação do token" };
    }
  }

  /**
   * Validação local do token JWT (fallback)
   */
  private validateTokenLocally(token?: string): DriveAuthResponse {
    try {
      const tokenToValidate = token || this.getStoredToken();

      if (!tokenToValidate) {
        return { valid: false, message: "Token não encontrado" };
      }

      const tokenInfo = this.decodeToken(tokenToValidate);

      if (!tokenInfo) {
        return { valid: false, message: "Token inválido" };
      }

      // Verificar expiração
      const now = Math.floor(Date.now() / 1000);
      if (tokenInfo.exp < now) {
        return { valid: false, message: "Token expirado" };
      }

      const user: userDto = {
        id: tokenInfo.sub,
        username: tokenInfo.sub,
        email: tokenInfo.sub,
        fullName: tokenInfo.sub,
        roles: tokenInfo.roles || ["ROLE_USER"],
        isActive: true,
        emailVerified: true,
        adminApproved: true,
      };

      return { valid: true, user };
    } catch (error) {
      console.error("Erro na validação local do token:", error);
      return { valid: false, message: "Erro na validação local" };
    }
  }

  /**
   * Decodifica o token JWT
   */
  private decodeToken(token: string): JwtTokenInfo | null {
    try {
      const payload = token.split(".")[1];
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
    return parts.length === 3;
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
      roleVariants.includes(userRole.toUpperCase())
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

    // Usuários autenticados e aprovados podem acessar o drive
    return user.isActive && user.emailVerified && user.adminApproved;
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
   * Armazena token no localStorage
   */
  storeToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("drive_auth_token", token);
    }
  }

  /**
   * Recupera token do localStorage
   */
  getStoredToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("drive_auth_token");
    }
    return null;
  }

  /**
   * Remove token do localStorage
   */
  removeStoredToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("drive_auth_token");
    }
  }

  /**
   * Faz logout completo
   */
  logout(): void {
    this.removeStoredToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  logoutDrive(): void {
    this.removeStoredToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login-drive";
    }
  }

  logoutComplete(): void {
    this.removeStoredToken();
    if (typeof window !== "undefined") {
      window.location.href = "/logout";
    }
  }

  /**
   * Login usando token existente do sistema principal
   * (para quando o usuário já está logado na intranet)
   */
  async loginWithExistingToken(): Promise<DriveAuthResponse> {
    // Tentar recuperar token do localStorage do sistema principal
    const mainSystemToken = this.getMainSystemToken();

    if (mainSystemToken) {
      const validation = await this.validateTokenWithCore(mainSystemToken);
      if (validation.valid) {
        this.storeToken(mainSystemToken);
        return validation;
      }
    }

    return {
      valid: false,
      message: "Token do sistema principal não encontrado",
    };
  }

  /**
   * Recupera token do sistema principal (se existir)
   */
  private getMainSystemToken(): string | null {
    if (typeof window !== "undefined") {
      // Tentar diferentes chaves que o sistema principal pode usar
      const possibleKeys = ["auth_token", "jwt_token", "access_token", "token"];

      for (const key of possibleKeys) {
        const token = localStorage.getItem(key);
        if (token) return token;
      }
    }
    return null;
  }
}

export default new DriveAuthService();
