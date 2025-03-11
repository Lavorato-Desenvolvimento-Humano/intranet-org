// services/api.ts
import axios from "axios";

// Cria uma instância do axios com configurações padrão
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://dev.lavorato.app.br/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Adiciona timeout para evitar esperas muito longas
  timeout: 10000,
});

// Log para debug - remova em produção
console.log(
  "API URL:",
  process.env.NEXT_PUBLIC_API_URL || "https://dev.lavorato.app.br/api"
);

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
  (response) => response,
  (error) => {
    console.error("Erro na resposta da API:", error);

    // Melhorar log para depuração
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status
      // fora do intervalo 2xx
      console.error("Dados da resposta:", error.response.data);
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);

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
