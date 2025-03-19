// src/utils/imageUtils.ts

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

  // Se começar com barra, é um caminho relativo à raiz do domínio
  if (imageIdentifier.startsWith("/")) {
    return `${apiBaseUrl}${imageIdentifier}`;
  }

  // Tentativa principal - caminho que deve funcionar com a configuração padrão
  return `${apiBaseUrl}/api/uploads/images/${imageIdentifier}`;
};

/**
 * Constrói a URL com tentativas alternativas se a principal falhar.
 * Útil para depuração ou quando a configuração do servidor não é bem conhecida.
 * @param imageIdentifier Nome ou caminho da imagem
 * @param baseUrl URL base da API (opcional, usa valor padrão se não fornecido)
 * @returns Um array de possíveis URLs para a imagem
 */
export const getAlternativeImageUrls = (
  imageIdentifier: string | null | undefined,
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

  // Array com várias alternativas de caminho para testar
  const possiblePaths = [
    `/api/uploads/images/${imageIdentifier}`,
    `/uploads/images/${imageIdentifier}`,
    `/images/${imageIdentifier}`,
    `/public/images/${imageIdentifier}`,
    `/api/public/images/${imageIdentifier}`,
  ];

  // Se o imageIdentifier já começar com '/', não adicione ao caminho
  if (imageIdentifier.startsWith("/")) {
    return [
      `${apiBaseUrl}${imageIdentifier}`,
      // Algumas alternativas adicionais
      `${apiBaseUrl}/api${imageIdentifier}`,
    ];
  }

  // Construir URLs completas para todas as alternativas
  return possiblePaths.map((path) => `${apiBaseUrl}${path}`);
};

/**
 * Verifica se uma URL de imagem é acessível
 * @param url URL para verificar
 * @returns Promessa que resolve para true se a URL for acessível, false caso contrário
 */
export const checkImageUrl = async (url: string): Promise<boolean> => {
  if (!url) return false;

  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-cache" });
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
  for (const url of urls) {
    const isAccessible = await checkImageUrl(url);
    if (isAccessible) {
      return url;
    }
  }
  return ""; // Retorna string vazia se nenhuma URL funcionar
};

/**
 * Encontra a URL de imagem de perfil que funciona, tentando vários caminhos alternativos
 * @param imageIdentifier Nome ou caminho da imagem
 * @param baseUrl URL base da API (opcional)
 * @returns Promessa que resolve para a URL que funciona, ou string vazia
 */
export const findWorkingProfileImageUrl = async (
  imageIdentifier: string | null | undefined,
  baseUrl?: string
): Promise<string> => {
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

  // Obtém alternativas de URLs para testar
  const alternativeUrls = getAlternativeImageUrls(imageIdentifier, baseUrl);

  // Encontra a primeira URL que funciona
  return await findWorkingImageUrl(alternativeUrls);
};
