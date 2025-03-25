// src/utils/imageUtils.ts
import { User } from "@/services/auth";

/**
 * Utilitários para manipulação de URLs de imagens
 * Fornece funções para construir URLs de imagens de perfil e verificar sua acessibilidade
 */

/**
 * Constrói a URL correta para imagens de perfil considerando vários formatos possíveis
 * @param imageIdentifier Nome ou caminho da imagem
 * @param baseUrl URL base da API (opcional, usa valor padrão se não fornecido)
 * @returns URL completa para a imagem
 */
export const buildProfileImageUrl = (
  imageIdentifier: string | null | undefined,
  baseUrl?: string
): string => {
  if (!imageIdentifier) {
    return ""; // Retorna string vazia se não houver imagem
  }

  // Se já for uma URL completa ou uma data URL, use como está
  if (
    imageIdentifier.startsWith("http") ||
    imageIdentifier.startsWith("data:")
  ) {
    return imageIdentifier;
  }

  // Extrair o nome do arquivo do caminho
  const filename = imageIdentifier.includes("/")
    ? imageIdentifier.substring(imageIdentifier.lastIndexOf("/") + 1)
    : imageIdentifier;

  // Em ambiente de desenvolvimento, usa a URL completa, em produção usa caminho relativo
  const isDevelopment =
    typeof window !== "undefined" && window.location.hostname === "localhost";
  const apiBaseUrl = isDevelopment
    ? baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8443"
    : "";

  // Construir URL padronizada
  return `${apiBaseUrl}/api/profile-images/${filename}`;
};

/**
 * Constrói a URL com tentativas alternativas se a principal falhar.
 * @param imageIdentifier Nome ou caminho da imagem
 * @param user O objeto usuário (opcional)
 * @param baseUrl URL base da API (opcional, usa valor padrão se não fornecido)
 * @returns Um array de possíveis URLs para a imagem
 */
export const getAlternativeImageUrls = (
  imageIdentifier: string | null | undefined,
  user?: User | null,
  baseUrl?: string
): string[] => {
  if (!imageIdentifier) {
    return []; // Retorna array vazio se não houver imagem
  }

  // Se já for uma URL completa ou uma data URL, retorna apenas ela
  if (
    imageIdentifier.startsWith("http") ||
    imageIdentifier.startsWith("data:")
  ) {
    return [imageIdentifier];
  }

  // Em ambiente de desenvolvimento, usa a URL completa, em produção usa caminho relativo
  const isDevelopment =
    typeof window !== "undefined" && window.location.hostname === "localhost";
  const apiBaseUrl = isDevelopment
    ? baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8443"
    : "";

  // Extrair o nome do arquivo do caminho
  const filename = imageIdentifier.includes("/")
    ? imageIdentifier.substring(imageIdentifier.lastIndexOf("/") + 1)
    : imageIdentifier;

  // Array com várias alternativas de caminho para testar - em ordem de prioridade
  const urls = [
    `${apiBaseUrl}/api/profile-images/${filename}`,
    `${apiBaseUrl}/api/uploads/images/${filename}`,
    `${apiBaseUrl}/api/images/${filename}`,
  ];

  // Adicionar URL baseada no ID do usuário se disponível
  if (user?.id) {
    urls.push(`${apiBaseUrl}/api/profile-images/user/${user.id}`);
  }

  // Adicionar URLs locais em desenvolvimento para evitar problemas de CORS
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (origin && isDevelopment) {
    urls.push(
      `${origin}/api/profile-images/${filename}`,
      `${origin}/api/uploads/images/${filename}`,
      `${origin}/api/images/${filename}`
    );

    // Se o ID do usuário estiver disponível, adicionar também uma URL local baseada no ID
    if (user?.id) {
      urls.push(`${origin}/api/profile-images/user/${user.id}`);
    }
  }

  return urls;
};

/**
 * Obtém uma URL de avatar placeholder baseada no nome
 * @param name Nome para gerar o avatar
 * @returns URL para o avatar gerado
 */
export const getPlaceholderImageUrl = (name: string): string => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
};

/**
 * Verifica se um arquivo existe usando o endpoint de verificação específico
 * @param filename Nome do arquivo a verificar
 * @param baseUrl URL base da API (opcional)
 * @returns Promessa que resolve para true se o arquivo existir, false caso contrário
 */
export const checkFileExists = async (
  filename: string,
  baseUrl?: string
): Promise<boolean> => {
  if (!filename) return false;

  try {
    // Remove qualquer caminho/URL e extrai apenas o nome do arquivo
    let filenameOnly = filename;

    // Se já for uma URL, extrair apenas o nome do arquivo
    if (filename.includes("/")) {
      filenameOnly = filename.substring(filename.lastIndexOf("/") + 1);
    }

    // Em ambiente de desenvolvimento, usa a URL completa, em produção usa caminho relativo
    const isDevelopment =
      typeof window !== "undefined" && window.location.hostname === "localhost";
    const apiBaseUrl = isDevelopment
      ? baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8443"
      : "";

    // Faz a requisição para o endpoint de verificação
    const response = await fetch(
      `${apiBaseUrl}/api/files/check/${filenameOnly}`
    );

    // Se retornar 200 OK, o arquivo existe
    return response.ok;
  } catch (error) {
    console.error("Erro ao verificar existência do arquivo:", error);
    return false;
  }
};

/**
 * Verifica se uma URL de imagem é acessível
 * @param url URL para verificar
 * @returns Promessa que resolve para true se a URL for acessível, false caso contrário
 */
export const checkImageUrl = async (url: string): Promise<boolean> => {
  if (!url) return false;

  try {
    // Usando a API fetch com método HEAD para verificar se a URL é acessível
    // Adicionando cache: no-cache para evitar problemas com cache
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-cache",
      // Adicionar um timeout para evitar esperar muito tempo
      signal: AbortSignal.timeout(3000),
    });

    return response.ok;
  } catch (error) {
    console.error("Erro ao verificar URL da imagem:", error);
    return false;
  }
};

/**
 * Encontra a primeira URL acessível de um array de URLs alternativas
 * @param urls Array de URLs para verificar
 * @returns Promessa que resolve para a primeira URL acessível, ou string vazia se nenhuma funcionar
 */
export const findWorkingImageUrl = async (urls: string[]): Promise<string> => {
  if (!urls || urls.length === 0) return "";

  try {
    // Tenta uma verificação rápida com HEAD request na primeira URL
    const isFirstUrlAccessible = await checkImageUrl(urls[0]);
    if (isFirstUrlAccessible) {
      return urls[0];
    }

    // Se a primeira URL falhar, tenta as URLs alternativas
    for (let i = 1; i < urls.length; i++) {
      try {
        const isAccessible = await checkImageUrl(urls[i]);
        if (isAccessible) {
          return urls[i];
        }
      } catch (error) {
        console.error(`Erro ao verificar URL alternativa ${i}:`, error);
        // Continua tentando as próximas URLs
      }
    }

    // Se todas as URLs falharem, retorna string vazia
    return "";
  } catch (error) {
    console.error("Erro ao verificar URLs de imagem:", error);
    return "";
  }
};
