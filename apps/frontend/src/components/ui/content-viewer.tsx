// src/components/ui/content-viewer.tsx
import React from "react";

interface ContentViewerProps {
  content: string;
  className?: string;
}

/**
 * ContentViewer component for rendering HTML content safely with proper styling using Tailwind
 */
const ContentViewer: React.FC<ContentViewerProps> = ({
  content,
  className = "",
}) => {
  return (
    <div
      className={`prose max-w-none text-gray-800 ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default ContentViewer;
