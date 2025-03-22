// src/components/ui/simple-rich-editor.tsx
"use client";

import React from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  FileText,
  Paperclip,
  Table,
} from "lucide-react";

interface SimpleRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  error?: string;
  disabled?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
  onFileUpload?: (file: File) => Promise<string>;
}

const SimpleRichEditor: React.FC<SimpleRichEditorProps> = ({
  value,
  onChange,
  placeholder = "Digite o conteúdo aqui...",
  height = "300px",
  error,
  disabled = false,
  onImageUpload,
  onFileUpload,
}) => {
  // Referências para inputs file ocultos
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handlers para botões da barra de ferramentas
  const handleBold = () => {
    onChange(value + "<strong>texto em negrito</strong>");
  };

  const handleItalic = () => {
    onChange(value + "<em>texto em itálico</em>");
  };

  const handleList = () => {
    onChange(
      value +
        "\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>"
    );
  };

  const handleOrderedList = () => {
    onChange(
      value +
        "\n<ol>\n  <li>Primeiro item</li>\n  <li>Segundo item</li>\n  <li>Terceiro item</li>\n</ol>"
    );
  };

  const handleHeading1 = () => {
    onChange(value + "\n<h1>Título Principal</h1>");
  };

  const handleHeading2 = () => {
    onChange(value + "\n<h2>Subtítulo</h2>");
  };

  const handleImageClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onImageUpload) return;

    try {
      const file = files[0];
      const imageUrl = await onImageUpload(file);
      onChange(
        value +
          `<img src="${imageUrl}" alt="${file.name}" style="max-width: 100%;" />`
      );
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      // Limpar o input
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onFileUpload) return;

    try {
      const file = files[0];
      const fileUrl = await onFileUpload(file);
      onChange(
        value + `<p><a href="${fileUrl}" target="_blank">${file.name}</a></p>`
      );
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
      alert("Erro ao fazer upload do arquivo. Tente novamente.");
    } finally {
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full">
      <div className="border rounded-md overflow-hidden">
        {/* Barra de ferramentas */}
        <div className="flex items-center p-2 border-b bg-gray-50 flex-wrap gap-1">
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Negrito"
            onClick={handleBold}
            disabled={disabled}>
            <Bold size={16} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Itálico"
            onClick={handleItalic}
            disabled={disabled}>
            <Italic size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Título 1"
            onClick={handleHeading1}
            disabled={disabled}>
            <Heading1 size={16} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Título 2"
            onClick={handleHeading2}
            disabled={disabled}>
            <Heading2 size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Lista não ordenada"
            onClick={handleList}
            disabled={disabled}>
            <List size={16} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Lista ordenada"
            onClick={handleOrderedList}
            disabled={disabled}>
            <ListOrdered size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Inserir Imagem"
            onClick={handleImageClick}
            disabled={disabled || !onImageUpload}>
            <ImageIcon size={16} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Inserir Anexo"
            onClick={handleFileClick}
            disabled={disabled || !onFileUpload}>
            <Paperclip size={16} />
          </button>
        </div>

        {/* Área de texto */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 focus:outline-none"
          style={{
            height,
            resize: "vertical",
            minHeight: "200px",
          }}
          disabled={disabled}
        />
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {/* Input oculto para upload de imagem */}
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        className="hidden"
        onChange={handleImageUpload}
        disabled={disabled}
      />

      {/* Input oculto para upload de arquivo */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
        disabled={disabled}
      />
    </div>
  );
};

export default SimpleRichEditor;
