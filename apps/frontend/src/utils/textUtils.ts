export const stripHtml = (html: string | undefined | null): string => {
  if (!html) return "";

  // Criando um elemento temporário para extrair apenas o texto
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || "";
};
