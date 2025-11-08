interface DriveUser {
  id: number;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  emailVerified: boolean;
  adminApproved: boolean;
}

interface LoginResponse {
  token: string;
  user: DriveUser;
  expiresIn: number;
}

class DriveAuthService {
  private readonly TOKEN_KEY = "drive_token";
  private readonly USER_KEY = "drive_user";
  private readonly CORE_API_URL = this.getCoreApiUrl();

  /**
   * Obter URL do Core API baseada no ambiente
   */
  private getCoreApiUrl(): string {
    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment) {
      return "http://localhost:8443/api";
    }

    // Em produção, verificar o hostname atual
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      if (hostname === "drive.lavorato.app.br") {
        // Usar proxy local do nginx
        return "https://drive.lavorato.app.br/api";
      }
    }

    // Fallback para Core direto
    return "https://dev.lavorato.app.br/api";
  }

  /**
   * Fazer login via Core System
   */
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<DriveUser> {
    try {
      console.log(
        `[DriveAuth] Fazendo login via: ${this.CORE_API_URL}/auth/login`
      );

      const response = await fetch(`${this.CORE_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        // Configurações para CORS e SSL
        mode: "cors",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Erro HTTP ${response.status}`,
        }));

        console.error("[DriveAuth] Erro na resposta:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        throw new Error(errorData.message || "Credenciais inválidas");
      }

      const loginData: LoginResponse = await response.json();

      if (!loginData.token) {
        throw new Error("Token não recebido do servidor");
      }

      // Armazenar dados de autenticação
      this.setStoredToken(loginData.token);
      this.setStoredUser(loginData.user);

      console.log("[DriveAuth] Login realizado com sucesso:", {
        user: loginData.user.email,
        roles: loginData.user.roles,
      });

      return loginData.user;
    } catch (error: any) {
      console.error("[DriveAuth] Erro no login:", error);

      // Limpar dados em caso de erro
      this.removeStoredToken();
      this.removeStoredUser();

      throw error;
    }
  }

  /**
   * Validar token atual no servidor
   */
  async validateToken(): Promise<boolean> {
    const token = this.getStoredToken();

    if (!token) {
      return false;
    }

    try {
      console.log("[DriveAuth] Validando token...");

      const response = await fetch(`${this.CORE_API_URL}/api/auth/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
        mode: "cors",
        credentials: "include",
      });

      if (response.ok) {
        const validationData = await response.json();

        if (validationData.valid && validationData.user) {
          // Atualizar dados do usuário se necessário
          this.setStoredUser(validationData.user);
          console.log("[DriveAuth] Token válido");
          return true;
        }
      }

      console.warn("[DriveAuth] Token inválido");
      this.logout();
      return false;
    } catch (error) {
      console.error("[DriveAuth] Erro na validação do token:", error);
      this.logout();
      return false;
    }
  }

  /**
   * Fazer logout
   */
  logout(): void {
    console.log("[DriveAuth] Fazendo logout...");
    this.removeStoredToken();
    this.removeStoredUser();
  }

  /**
   * Verificar se usuário está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }

  /**
   * Obter usuário atual
   */
  getCurrentUser(): DriveUser | null {
    return this.getStoredUser();
  }

  /**
   * Verificar se usuário tem permissão para Drive
   */
  canAccessDrive(): boolean {
    const user = this.getStoredUser();

    if (!user) {
      return false;
    }

    // Verificações básicas de acesso
    if (!user.isActive || !user.emailVerified) {
      return false;
    }

    // Por enquanto, todos os usuários autenticados podem acessar
    // Em implementações futuras, adicionar verificação de roles específicas
    return true;
  }

  /**
   * Armazenar token
   */
  setStoredToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.TOKEN_KEY, token);
      // Também salvar no localStorage padrão para compatibilidade
      localStorage.setItem("token", token);
    }
  }

  /**
   * Obter token armazenado
   */
  getStoredToken(): string | null {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem(this.TOKEN_KEY) || localStorage.getItem("token")
      );
    }
    return null;
  }

  /**
   * Remover token armazenado
   */
  removeStoredToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem("token");
    }
  }

  /**
   * Armazenar dados do usuário
   */
  private setStoredUser(user: DriveUser): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      // Também salvar no localStorage padrão para compatibilidade
      localStorage.setItem("user", JSON.stringify(user));
    }
  }

  /**
   * Obter dados do usuário armazenados
   */
  private getStoredUser(): DriveUser | null {
    if (typeof window !== "undefined") {
      const userData =
        localStorage.getItem(this.USER_KEY) || localStorage.getItem("user");

      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (error) {
          console.error("[DriveAuth] Erro ao parsear dados do usuário:", error);
          this.removeStoredUser();
        }
      }
    }
    return null;
  }

  /**
   * Remover dados do usuário armazenados
   */
  private removeStoredUser(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem("user");
    }
  }

  /**
   * Obter informações de debug
   */
  getDebugInfo() {
    return {
      coreApiUrl: this.CORE_API_URL,
      isAuthenticated: this.isAuthenticated(),
      canAccessDrive: this.canAccessDrive(),
      hasToken: !!this.getStoredToken(),
      hasUser: !!this.getStoredUser(),
      currentUser: this.getCurrentUser(),
      environment: process.env.NODE_ENV,
      hostname:
        typeof window !== "undefined" ? window.location.hostname : "SSR",
    };
  }
}

// Exportar instância singleton
export default new DriveAuthService();
