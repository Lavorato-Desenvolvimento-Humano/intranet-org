// src/services/api.ts
import axios from "axios";

// Auto-detectar ambiente
const isDevelopment =
  typeof window !== "undefined" && window.location.hostname === "localhost";
const baseURL = isDevelopment
  ? "http://localhost:8443"
  : "https://dev.lavorato.app.br";

// Criar instância axios com configurações otimizadas
const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  // Aumentar timeout para dar mais tempo ao backend
  timeout: 20000,
});

// Adicionar token JWT a todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log para depuração
    console.log(`Fazendo requisição para: ${config.baseURL}${config.url}`);

    return config;
  },
  (error) => {
    console.error("Erro no interceptor de requisição:", error);
    return Promise.reject(error);
  }
);

// Tratar erros de resposta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Melhorar o log de erro para incluir mais detalhes
    if (error.response) {
      console.error(`Erro de API (${error.config?.url}):`, {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });

      // Para erros 500, logar mais detalhes
      if (error.response.status === 500) {
        console.error("Detalhes do erro 500:", {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data,
        });
      }

      if (error.response.status === 401) {
        // Token expirado ou inválido
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Redirecionar para página de login caso não esteja lá
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/auth/login")
        ) {
          window.location.href = "/auth/login";
        }
      }
    } else if (error.request) {
      console.error("Erro de rede:", error.request);
    } else {
      console.error("Erro de configuração de requisição:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
