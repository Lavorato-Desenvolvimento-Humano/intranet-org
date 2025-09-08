// services/api/driveApiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import driveAuthService from "@/services/auth-drive";

class DriveApiClient {
  private instances: Record<string, AxiosInstance> = {};

  constructor() {
    this.setupApiInstances();
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

    // Microserviços do Drive
    this.instances = {
      files: this.createInstance({
        ...baseConfig,
        baseURL:
          process.env.NEXT_PUBLIC_DRIVE_FILE_SERVICE_URL ||
          "http://localhost:8444",
      }),
      folders: this.createInstance({
        ...baseConfig,
        baseURL:
          process.env.NEXT_PUBLIC_DRIVE_FOLDER_SERVICE_URL ||
          "http://localhost:8445",
      }),
      permissions: this.createInstance({
        ...baseConfig,
        baseURL:
          process.env.NEXT_PUBLIC_DRIVE_PERMISSION_SERVICE_URL ||
          "http://localhost:8446",
      }),
      quotas: this.createInstance({
        ...baseConfig,
        baseURL:
          process.env.NEXT_PUBLIC_DRIVE_QUOTA_SERVICE_URL ||
          "http://localhost:8447",
      }),
      search: this.createInstance({
        ...baseConfig,
        baseURL:
          process.env.NEXT_PUBLIC_DRIVE_SEARCH_SERVICE_URL ||
          "http://localhost:8448",
      }),
      audit: this.createInstance({
        ...baseConfig,
        baseURL:
          process.env.NEXT_PUBLIC_DRIVE_AUDIT_SERVICE_URL ||
          "http://localhost:8449",
      }),
    };
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
            `[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
          );
        }

        return config;
      },
      (error) => {
        console.error("[API] Erro na requisição:", error);
        return Promise.reject(error);
      }
    );

    // Interceptor de resposta - trata erros de autenticação
    instance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`
          );
        }
        return response;
      },
      async (error) => {
        if (error.response) {
          const { status, config } = error.response;

          // Token expirado ou inválido
          if (status === 401) {
            console.warn("[API] Token inválido, fazendo logout...");
            driveAuthService.logout();
            return Promise.reject(error);
          }

          // Forbidden - sem permissão
          if (status === 403) {
            console.warn("[API] Acesso negado:", config.url);
          }

          // Rate limiting
          if (status === 429) {
            console.warn("[API] Rate limit atingido:", config.url);
          }

          // Server error
          if (status >= 500) {
            console.error(
              "[API] Erro no servidor:",
              config.url,
              error.response.data
            );
          }
        } else if (error.request) {
          // Erro de rede
          console.error("[API] Erro de rede:", error.message);
        } else {
          console.error("[API] Erro desconhecido:", error.message);
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }

  /**
   * Getter para o serviço de arquivos
   */
  get files(): AxiosInstance {
    return this.instances.files;
  }

  /**
   * Getter para o serviço de pastas
   */
  get folders(): AxiosInstance {
    return this.instances.folders;
  }

  /**
   * Getter para o serviço de permissões
   */
  get permissions(): AxiosInstance {
    return this.instances.permissions;
  }

  /**
   * Getter para o serviço de cotas
   */
  get quotas(): AxiosInstance {
    return this.instances.quotas;
  }

  /**
   * Getter para o serviço de auditoria
   */
  get audit(): AxiosInstance {
    return this.instances.audit;
  }

  /**
   * Método utilitário para upload de arquivos
   */
  async uploadFile(
    file: File,
    folderId?: string,
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append("file", file);

    if (folderId) {
      formData.append("folderId", folderId);
    }

    return this.files.post("/api/drive/files/upload", formData, {
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
    });
  }

  /**
   * Método utilitário para download de arquivos
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
   * Método utilitário para verificar permissões
   */
  async checkPermission(
    resourceId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const response = await this.permissions.post(
        "/api/drive/permissions/check",
        {
          resourceId,
          permission,
        }
      );
      return response.data.hasPermission || false;
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      return false;
    }
  }

  /**
   * Método utilitário para obter informações de cota
   */
  async getUserQuota(userId?: string): Promise<any> {
    const endpoint = userId
      ? `/api/drive/quotas/user/${userId}`
      : "/api/drive/quotas/user/current";

    const response = await this.quotas.get(endpoint);
    return response.data;
  }

  /**
   * Método utilitário para busca
   */
  //   async search(query: string, filters?: any): Promise<any> {
  //     const response = await this.search.post("/api/drive/search", {
  //       query,
  //       filters,
  //     });
  //     return response.data;
  //   }

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
