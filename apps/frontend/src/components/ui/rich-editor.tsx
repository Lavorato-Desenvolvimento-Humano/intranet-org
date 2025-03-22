// src/components/ui/rich-editor.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
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
  Table as TableIcon,
} from "lucide-react";
import dynamic from "next/dynamic";

//Importar o CKEditor dinamicamente para evitar problemas de SSR
const CKEditor = dynamic(
  () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
  { ssr: false }
);

// Importar o ClassicEditor dinamicamente
const ClassicEditor = dynamic(
  () => import("@ckeditor/ckeditor5-build-classic"),
  { ssr: false }
);

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  label?: string;
  error?: string;
  onImageUpload?: (file: File) => Promise<string>;
  onFileUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
}

export const RichEditor: React.FC<RichEditorProps> = ({
  value,
  onChange,
  placeholder = "Digite o conteúdo aqui...",
  height = "300px",
  label,
  error,
  onImageUpload,
  onFileUpload,
  disabled = false,
}) => {
  const [editorLoaded, setEditorLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Carregar o editor apenas no cliente
  useEffect(() => {
    setEditorLoaded(true);
  }, []);

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

      // Inserir a imagem no editor
      const newValue = value + `<img src="${imageUrl}" alt="${file.name}" />`;
      onChange(newValue);
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onFileUpload) return;

    try {
      const file = files[0];
      const fileUrl = await onFileUpload(file);

      // Inserir o link para o arquivo no editor
      const newValue =
        value + `<p><a href="${fileUrl}" target="_blank">${file.name}</a></p>`;
      onChange(newValue);
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
      alert("Erro ao fazer upload do arquivo. Tente novamente.");
    } finally {
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!editorLoaded) {
    return (
      <div className="animate-pulse">
        {label && (
          <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
        )}
        <div className="h-[300px] bg-gray-100 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div
        className={`border rounded-md ${error ? "border-red-500" : "border-gray-300"}`}>
        {/* Barra de ferramentas customizada */}
        <div className="flex items-center p-2 border-b bg-gray-50 flex-wrap gap-1">
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Negrito">
            <Bold size={16} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Itálico">
            <Italic size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Título 1">
            <Heading1 size={16} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Título 2">
            <Heading2 size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Lista não ordenada">
            <List size={16} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Lista ordenada">
            <ListOrdered size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Alinhar à esquerda">
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Centralizar">
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Alinhar à direita">
            <AlignRight size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Inserir Link">
            <LinkIcon size={16} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Inserir Imagem"
            onClick={handleImageClick}
            disabled={!onImageUpload || disabled}>
            <ImageIcon size={16} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Inserir Anexo"
            onClick={handleFileClick}
            disabled={!onFileUpload || disabled}>
            <Paperclip size={16} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-gray-200"
            title="Inserir Tabela">
            <TableIcon size={16} />
          </button>
        </div>

        {/* Editor CKEditor */}
        <div style={{ height }}>
          {/* <CKEditor
            editor={ClassicEditor}
            data={value}
            onChange={(event: any, editor: any) => {
              const data = editor.getData();
              onChange(data);
            }}
            config={{
              placeholder,
              toolbar: [
                "heading",
                "|",
                "bold",
                "italic",
                "link",
                "bulletedList",
                "numberedList",
                "|",
                "outdent",
                "indent",
                "|",
                "blockQuote",
                "insertTable",
                "undo",
                "redo",
              ],
              table: {
                contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
              },
            }}
            disabled={disabled}
          /> */}
        </div>
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

export default RichEditor;
