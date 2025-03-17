//service/api.ts
import axios from "axios";

//Detecção automática do ambiente
const isDevelopment =
  typeof window !== "undefined" && window.location.hostname === "localhost";
const baseURL = isDevelopment
  ? "http://localhost:8443" // desenvolvimento
  : "https://dev.lavorato.app.br/api"; // produção

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-type": "application/json",
  },
  timeout: 15000,
});

// Interceptor para incluir o token JWT em todas as requisições
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

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        //Token expirado ou inválido
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        //Redirecionar para a página de login apenas se não estivermos na página de login
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/auth/login")
        ) {
          window.location.href = "/auth/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
