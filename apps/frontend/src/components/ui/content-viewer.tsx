// src/components/ui/content-viewer.tsx
import { cn } from "@/utils/cn";
import React from "react";

interface ContentViewerProps {
  content: string;
  className?: string;
}

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
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default ContentViewer;
