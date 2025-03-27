// src/components/ui/content-viewer.tsx
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
      className={`prose max-w-none text-gray-800 whitespace-pre-wrap break-words ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default ContentViewer;
