//service/api.ts
import axios from "axios";

// Detecção automática do ambiente
const isDevelopment =
  typeof window !== "undefined" && window.location.hostname === "localhost";
const baseURL = isDevelopment
  ? "http://localhost:8443/api" // URL local
  : "https://dev.lavorato.app.br/api"; // URL de produção

console.log(`Usando API baseURL: ${baseURL}`);

//Cria uma instância do axios com configurações padrão
const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  // Adiciona timeout para evitar esperas muito longas
  timeout: 10000,
});

// Interceptor para incluir o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    // Log para debug
    console.log(`Enviando requisição para: ${config.url}`, config);

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
    console.log(`Resposta recebida de: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error("Erro na resposta da API:", error);

    // Melhorar log para depuração
    if (error.response) {
      console.error("URL da requisição:", error.config.url);
      console.error("Dados da resposta:", error.response.data);
      console.error("Status:", error.response.status);

      if (error.response.status === 401) {
        // Token expirado ou inválido
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Redirecionar para a página de login
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
    } else if (error.request) {
      // A requisição foi feita mas nenhuma resposta foi recebida
      console.error("Requisição sem resposta:", error.request);
    } else {
      // Algo aconteceu na configuração da requisição que gerou um erro
      console.error("Erro na configuração:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
