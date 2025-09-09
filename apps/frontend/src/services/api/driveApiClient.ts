// apps/frontend/src/services/api/driveApiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import driveAuthService from "@/services/auth-drive";

class DriveApiClient {
  private instances: Record<string, AxiosInstance> = {};

  constructor() {
    this.setupApiInstances();
  }

  /**
   * Obter configuração de URL baseada no ambiente e domínio atual
   */
  private getServiceUrl(serviceName: string, defaultPort: number): string {
    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment) {
      return `http://localhost:${defaultPort}`;
    }

    // Em produção, usar o domínio drive.lavorato.app.br com proxy
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      if (hostname === "drive.lavorato.app.br") {
        // Para drive.lavorato.app.br, usar proxy direto para serviços do drive
        if (serviceName === "auth" || serviceName === "users") {
          // Auth e Users vão para o Core via proxy
          return "https://drive.lavorato.app.br/api";
        } else {
          // Serviços do Drive vão para o próprio drive
          return "https://drive.lavorato.app.br/api/drive";
        }
      }
    }

    // Fallback para outros casos
    return `http://localhost:${defaultPort}`;
  }

  /**
   * Obter URL do Core System para autenticação
   */
  private getCoreApiUrl(): string {
    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment) {
      return "http://localhost:8443/api";
    }

    // Em produção, usar dev.lavorato.app.br (Core System) ou proxy local
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      if (hostname === "drive.lavorato.app.br") {
        // Usar proxy local do nginx para auth
        return "https://drive.lavorato.app.br/api";
      }
    }

    return "https://dev.lavorato.app.br/api";
  }

  /**
   * Configura instâncias do Axios para cada microserviço do Drive
   */
  private setupApiInstances() {
    const baseConfig = {
      timeout: 30000, // 30 segundos para operações de arquivo
      headers: {
        "Content-Type": "application/json",
      },
    };

    // Instância especial para Core Services (Auth/Users)
    this.instances.core = this.createInstance({
      ...baseConfig,
      baseURL: this.getCoreApiUrl(),
    });

    // Microserviços do Drive com URLs corrigidas
    this.instances = {
      ...this.instances,
      files: this.createInstance({
        ...baseConfig,
        baseURL: this.getServiceUrl("files", 8444),
      }),
      folders: this.createInstance({
        ...baseConfig,
        baseURL: this.getServiceUrl("folders", 8445),
      }),
      permissions: this.createInstance({
        ...baseConfig,
        baseURL: this.getServiceUrl("permissions", 8446),
      }),
      quotas: this.createInstance({
        ...baseConfig,
        baseURL: this.getServiceUrl("quotas", 8447),
      }),
      search: this.createInstance({
        ...baseConfig,
        baseURL: this.getServiceUrl("search", 8448),
      }),
      audit: this.createInstance({
        ...baseConfig,
        baseURL: this.getServiceUrl("audit", 8449),
      }),
      // Instâncias para serviços core via proxy
      auth: this.createInstance({
        ...baseConfig,
        baseURL: this.getServiceUrl("auth", 8443),
      }),
      users: this.createInstance({
        ...baseConfig,
        baseURL: this.getServiceUrl("users", 8443),
      }),
    };

    console.log("[DriveApiClient] Instâncias configuradas:", {
      isDevelopment: process.env.NODE_ENV === "development",
      hostname:
        typeof window !== "undefined" ? window.location.hostname : "SSR",
      coreApiUrl: this.getCoreApiUrl(),
      services: Object.keys(this.instances).reduce(
        (acc, key) => {
          acc[key] = this.instances[key].defaults.baseURL || "";
          return acc;
        },
        {} as Record<string, string>
      ),
    });
  }

  /**
   * Cria uma instância do Axios com interceptors configurados
   */
  private createInstance(config: AxiosRequestConfig): AxiosInstance {
    const instance = axios.create(config);

    // Interceptor de requisição - adiciona token JWT
    instance.interceptors.request.use(
      (config) => {
        const token = driveAuthService.getStoredToken();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log de requests (apenas em desenvolvimento)
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[DriveAPI] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
          );
        }

        return config;
      },
      (error) => {
        console.error("[DriveAPI] Erro na requisição:", error);
        return Promise.reject(error);
      }
    );

    // Interceptor de resposta - trata erros de autenticação
    instance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[DriveAPI] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`
          );
        }
        return response;
      },
      async (error) => {
        if (error.response) {
          const { status, config } = error.response;

          console.error(`[DriveAPI] Erro ${status} em ${config?.url}:`, {
            status,
            data: error.response.data,
            service: config?.baseURL,
          });

          // Token expirado ou inválido
          if (status === 401) {
            console.warn(
              "[DriveAPI] Token inválido, removendo autenticação..."
            );
            driveAuthService.removeStoredToken();

            // Não redirecionar automaticamente, deixar componente decidir
            return Promise.reject({
              ...error,
              isAuthError: true,
              message: "Token inválido ou expirado",
            });
          }

          // Erro de servidor interno
          if (status >= 500) {
            console.error("[DriveAPI] Erro interno do servidor:", {
              url: config?.url,
              method: config?.method,
              status,
              data: error.response.data,
            });

            return Promise.reject({
              ...error,
              isServerError: true,
              message: "Erro interno do servidor. Tente novamente.",
            });
          }
        } else if (error.request) {
          console.error("[DriveAPI] Erro de rede:", error.request);
          return Promise.reject({
            ...error,
            isNetworkError: true,
            message: "Erro de conexão. Verifique sua internet.",
          });
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }

  /**
   * Obter instância do Axios para um serviço específico
   */
  public getInstance(service: string): AxiosInstance {
    if (!this.instances[service]) {
      throw new Error(`Serviço ${service} não encontrado`);
    }
    return this.instances[service];
  }

  /**
   * Fazer login usando o Core System
   */
  public async login(credentials: { email: string; password: string }) {
    try {
      console.log("[DriveApiClient] Fazendo login via Core System");

      const response = await this.instances.core.post(
        "/auth/login",
        credentials
      );

      if (response.data.token) {
        // Armazenar token para uso nos próximos requests
        driveAuthService.setStoredToken(response.data.token);
        console.log("[DriveApiClient] Login realizado com sucesso");
      }

      return response.data;
    } catch (error: any) {
      console.error("[DriveApiClient] Erro no login:", error);
      throw error;
    }
  }

  /**
   * Verificar saúde dos serviços
   */
  public async checkHealth(): Promise<Record<string, boolean>> {
    const services = Object.keys(this.instances);
    const healthStatus: Record<string, boolean> = {};

    const checkPromises = services.map(async (service) => {
      try {
        const response = await this.instances[service].get("/health", {
          timeout: 5000,
        });
        healthStatus[service] = response.status === 200;
      } catch (error) {
        console.warn(
          `[DriveApiClient] Serviço ${service} indisponível:`,
          error
        );
        healthStatus[service] = false;
      }
    });

    await Promise.allSettled(checkPromises);
    return healthStatus;
  }

  /**
   * Reconfigurar instâncias (útil para mudanças de ambiente)
   */
  public reconfigure(): void {
    this.setupApiInstances();
  }
}

// Exportar instância singleton
export default new DriveApiClient();
