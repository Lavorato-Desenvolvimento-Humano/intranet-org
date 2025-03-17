// src/services/api.ts
import axios from "axios";

// Auto-detectar ambiente
const isDevelopment =
  typeof window !== "undefined" && window.location.hostname === "localhost";
const baseURL = isDevelopment
  ? "http://localhost:8443/api" // URL local
  : "https://dev.lavorato.app.br/api"; // URL de produção

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
    if (error.response) {
      console.error(`Erro de API (${error.config?.url}):`, {
        status: error.response.status,
        data: error.response.data,
      });

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
