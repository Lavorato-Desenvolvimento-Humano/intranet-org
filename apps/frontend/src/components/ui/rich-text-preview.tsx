// src/components/ui/rich-text-preview.tsx
"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface RichTextPreviewProps {
  content: string;
  className?: string;
}

const RichTextPreview: React.FC<RichTextPreviewProps> = ({
  content,
  className = "",
}) => {
  const [showPreview, setShowPreview] = useState(false);

  // Process content to handle any special cases if needed
  const processedContent = content || "";

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">
          {showPreview ? "Pré-visualização" : "Mostrar pré-visualização"}
        </h3>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center text-sm text-primary hover:text-primary-dark transition-colors">
          {showPreview ? (
            <>
              <EyeOff size={16} className="mr-1" />
              Ocultar
            </>
          ) : (
            <>
              <Eye size={16} className="mr-1" />
              Visualizar
            </>
          )}
        </button>
      </div>

      {showPreview && (
        <div
          className={`border rounded-md p-4 bg-white overflow-auto max-h-96 ${className}`}>
          <div
            className="prose max-w-none whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </div>
      )}
    </div>
  );
};

export default RichTextPreview;
