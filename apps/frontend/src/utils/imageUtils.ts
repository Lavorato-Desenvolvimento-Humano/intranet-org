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

  // Define a URL base (usa o valor do ambiente ou o padrão)
  const apiBaseUrl =
    baseUrl || process.env.NEXT_PUBLIC_API_URL || "https://dev.lavorato.app.br";

  // Se já for uma URL completa ou uma data URL, use como está
  if (
    imageIdentifier.startsWith("http") ||
    imageIdentifier.startsWith("data:")
  ) {
    return imageIdentifier;
  }

  // Se o imageIdentifier começar com uma barra, remova-a
  const normalizedIdentifier = imageIdentifier.startsWith("/")
    ? imageIdentifier.substring(1)
    : imageIdentifier;

  // Construir URL completa usando o novo endpoint dedicado
  return `${apiBaseUrl}/api/profile-images/${normalizedIdentifier}`;
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

  // Define a URL base (usa o valor do ambiente ou o padrão)
  const apiBaseUrl =
    baseUrl || process.env.NEXT_PUBLIC_API_URL || "https://dev.lavorato.app.br";

  // Se o imageIdentifier começar com uma barra, remova-a
  const normalizedIdentifier = imageIdentifier.startsWith("/")
    ? imageIdentifier.substring(1)
    : imageIdentifier;

  // Array com várias alternativas de caminho para testar - em ordem de prioridade,
  // começando com o novo endpoint dedicado
  const urls = [
    `${apiBaseUrl}/api/profile-images/${normalizedIdentifier}`,
    `${apiBaseUrl}/uploads/images/${normalizedIdentifier}`,
    `${apiBaseUrl}/api/uploads/images/${normalizedIdentifier}`,
    `${apiBaseUrl}/images/${normalizedIdentifier}`,
  ];

  // Adicionar URL baseada no ID do usuário se disponível
  if (user?.id) {
    urls.push(`${apiBaseUrl}/api/profile-images/user/${user.id}`);
  }

  // Adicionar URLs locais em desenvolvimento para evitar problemas de CORS
  urls.push(
    window.location.origin + `/api/profile-images/${normalizedIdentifier}`,
    window.location.origin + `/uploads/images/${normalizedIdentifier}`,
    window.location.origin + `/api/uploads/images/${normalizedIdentifier}`,
    window.location.origin + `/images/${normalizedIdentifier}`
  );

  // Se o ID do usuário estiver disponível, adicionar também uma URL local baseada no ID
  if (user?.id) {
    urls.push(window.location.origin + `/api/profile-images/user/${user.id}`);
  }

  return urls;
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

    // Define a URL base
    const apiBaseUrl =
      baseUrl ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://dev.lavorato.app.br";

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
  const checkPromises = urls.map(async (url) => {
    try {
      const isAccessible = await checkImageUrl(url);
      return isAccessible ? url : null;
    } catch (error) {
      return null;
    }
  });

  // Aguarda todas as promessas e filtra resultados não nulos
  const results = await Promise.all(checkPromises);
  const workingUrl = results.find((result) => result !== null);

  return workingUrl || ""; // Retorna a primeira URL que funciona ou string vazia
};
