// src/components/ui/content-viewer.tsx
import { cn } from "@/utils/cn";
import React from "react";

interface ContentViewerProps {
  content: string;
  className?: string;
}

/**
 * Processa o HTML para corrigir URLs de imagens que precisam do prefixo /api
 */
const processContentHtml = (html: string): string => {
  if (!html) return "";

  return html.replace(
    /<img([^>]*?)src=["']([^"']+)["']/gi,
    (match, attrs, src) => {
      if (src.startsWith("http") || src.startsWith("/api")) {
        return match;
      }
      if (src.startsWith("/")) {
        return `<img${attrs}src="/api${src}"`;
      }
      return `<img${attrs}src="/api/${src}"`;
    }
  );
};

/**
 * ContentViewer component para renderizar conteúdo HTML de forma segura com estilização adequada
 * Preserva quebras de linha e espaçamento
 */
const ContentViewer: React.FC<ContentViewerProps> = ({
  content,
  className = "",
}) => {
  return (
    <div
      className={cn(
        "prose max-w-none text-gray-800 break-words",
        "prose-img:rounded-xl prose-img:shadow-sm prose-img:mx-auto prose-img:max-h-[500px]", // Estilo automático para imagens no HTML
        "prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline",
        // Preservar quebras de linha e espaços
        "[&_p]:whitespace-pre-wrap [&_br]:block",
        className
      )}
      dangerouslySetInnerHTML={{ __html: processContentHtml(content) }}
    />
  );
};

export default ContentViewer;
