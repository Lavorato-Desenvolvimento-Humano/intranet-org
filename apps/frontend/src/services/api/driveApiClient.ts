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
  private getServiceUrl(defaultPort: number): string {
    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment) {
      return `http://localhost:${defaultPort}`;
    }

    // Em produção, usar o domínio drive.lavorato.app.br com proxy
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      if (hostname === "drive.lavorato.app.br") {
        // Para drive.lavorato.app.br, usar proxy direto
        return "https://drive.lavorato.app.br";
      }
    }

    // Fallback para outros casos
    return `http://localhost:${defaultPort}`;
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

    // Microserviços do Drive com URLs corrigidas
    this.instances = {
      files: this.createInstance({
        ...baseConfig,
        baseURL:
          process.env.NEXT_PUBLIC_DRIVE_FILE_SERVICE_URL ||
          this.getServiceUrl(8444),
      }),
      folders: this.createInstance({
        ...baseConfig,
        baseURL:
          process.env.NEXT_PUBLIC_DRIVE_FOLDER_SERVICE_URL ||
          this.getServiceUrl(8445),
      }),
      permissions: this.createInstance({
        ...baseConfig,
        baseURL:
          process.env.NEXT_PUBLIC_DRIVE_PERMISSION_SERVICE_URL ||
          this.getServiceUrl(8446),
      }),
      quotas: this.createInstance({
        ...baseConfig,
        baseURL:
          process.env.NEXT_PUBLIC_DRIVE_QUOTA_SERVICE_URL ||
          this.getServiceUrl(8447),
      }),
      search: this.createInstance({
        ...baseConfig,
        baseURL:
          process.env.NEXT_PUBLIC_DRIVE_SEARCH_SERVICE_URL ||
          this.getServiceUrl(8448),
      }),
      audit: this.createInstance({
        ...baseConfig,
        baseURL:
          process.env.NEXT_PUBLIC_DRIVE_AUDIT_SERVICE_URL ||
          this.getServiceUrl(8449),
      }),
    };

    console.log("[DriveApiClient] Instâncias configuradas:", {
      isDevelopment: process.env.NODE_ENV === "development",
      hostname:
        typeof window !== "undefined" ? window.location.hostname : "SSR",
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

            // Não redirecionar automaticamente para evitar loops
            // O componente pai deve lidar com isso
          }

          // Erro de conectividade com serviço
          if (status >= 500) {
            console.warn(`[DriveAPI] Serviço indisponível: ${config?.baseURL}`);
          }
        } else if (error.request) {
          console.error("[DriveAPI] Erro de rede:", {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            message: error.message,
          });
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }

  // Métodos da API permanecem os mesmos...
  get files() {
    return this.instances.files;
  }
  get folders() {
    return this.instances.folders;
  }
  get permissions() {
    return this.instances.permissions;
  }
  get quotas() {
    return this.instances.quotas;
  }
  get search() {
    return this.instances.search;
  }
  get audit() {
    return this.instances.audit;
  }

  /**
   * Upload de arquivo
   */
  async uploadFile(
    file: File,
    folderId?: string,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    if (folderId) {
      formData.append("folderId", folderId);
    }

    const response = await this.files.post(
      "/api/drive/files/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      }
    );

    return response.data;
  }

  /**
   * Download de arquivo
   */
  async downloadFile(fileId: string, filename?: string): Promise<Blob> {
    const response = await this.files.get(
      `/api/drive/files/${fileId}/download`,
      {
        responseType: "blob",
      }
    );

    // Se um nome de arquivo foi fornecido, criar um link de download
    if (filename && typeof window !== "undefined") {
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }

    return response.data;
  }

  /**
   * Método para verificar saúde dos serviços
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const services = Object.keys(this.instances);
    const healthStatus: Record<string, boolean> = {};

    const healthChecks = services.map(async (service) => {
      try {
        await this.instances[service].get("/actuator/health", {
          timeout: 5000,
        });
        healthStatus[service] = true;
      } catch (error) {
        console.warn(`[HealthCheck] Serviço ${service} não disponível`);
        healthStatus[service] = false;
      }
    });

    await Promise.allSettled(healthChecks);
    return healthStatus;
  }

  /**
   * Reconecta todas as instâncias (útil após mudança de configuração)
   */
  reconnect(): void {
    this.setupApiInstances();
  }
}

export default new DriveApiClient();
