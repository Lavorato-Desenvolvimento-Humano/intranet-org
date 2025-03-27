// src/components/ui/simple-rich-editor.tsx
"use client";

import React, { useRef, useState } from "react";
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Para armazenar a última posição conhecida do cursor
  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
    text: "",
  });

  // Função para capturar a seleção atual
  const captureSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = value.substring(start, end);

      setSelection({
        start,
        end,
        text: selectedText,
      });
    }
  };

  // Função para aplicar formatação ao texto selecionado
  const applyFormatting = (openTag: string, closeTag: string) => {
    // Se não há texto selecionado, inserir tags com texto padrão
    if (selection.start === selection.end) {
      const defaultText = "texto selecionado";
      const newText =
        value.substring(0, selection.start) +
        openTag +
        defaultText +
        closeTag +
        value.substring(selection.end);

      onChange(newText);

      // Calcular nova posição para seleção (no texto padrão)
      const newCursorPos = selection.start + openTag.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            newCursorPos,
            newCursorPos + defaultText.length
          );
        }
      }, 0);
    } else {
      // Aplicar formatação ao texto selecionado
      const newText =
        value.substring(0, selection.start) +
        openTag +
        selection.text +
        closeTag +
        value.substring(selection.end);

      onChange(newText);

      // Colocar cursor após o texto formatado
      const newCursorPos =
        selection.start +
        openTag.length +
        selection.text.length +
        closeTag.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Handlers para botões da barra de ferramentas
  const handleBold = () => {
    applyFormatting("<strong>", "</strong>");
  };

  const handleItalic = () => {
    applyFormatting("<em>", "</em>");
  };

  const handleHeading1 = () => {
    applyFormatting("<h1>", "</h1>");
  };

  const handleHeading2 = () => {
    applyFormatting("<h2>", "</h2>");
  };

  const handleList = () => {
    // Se já temos texto selecionado, colocamos cada linha dentro de um <li>
    if (selection.text) {
      const lines = selection.text.split("\n");
      const formattedItems = lines
        .map((line) => (line.trim() ? `  <li>${line}</li>` : ""))
        .filter(Boolean)
        .join("\n");

      const formattedList = `<ul>\n${formattedItems}\n</ul>`;

      const newText =
        value.substring(0, selection.start) +
        formattedList +
        value.substring(selection.end);

      onChange(newText);
    } else {
      // Inserir uma lista vazia com 3 itens
      const defaultList =
        "<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>";

      const newText =
        value.substring(0, selection.start) +
        defaultList +
        value.substring(selection.end);

      onChange(newText);
    }
  };

  const handleOrderedList = () => {
    // Se já temos texto selecionado, colocamos cada linha dentro de um <li>
    if (selection.text) {
      const lines = selection.text.split("\n");
      const formattedItems = lines
        .map((line) => (line.trim() ? `  <li>${line}</li>` : ""))
        .filter(Boolean)
        .join("\n");

      const formattedList = `<ol>\n${formattedItems}\n</ol>`;

      const newText =
        value.substring(0, selection.start) +
        formattedList +
        value.substring(selection.end);

      onChange(newText);
    } else {
      // Inserir uma lista vazia com 3 itens
      const defaultList =
        "<ol>\n  <li>Primeiro item</li>\n  <li>Segundo item</li>\n  <li>Terceiro item</li>\n</ol>";

      const newText =
        value.substring(0, selection.start) +
        defaultList +
        value.substring(selection.end);

      onChange(newText);
    }
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

      // Inserir imagem na posição do cursor
      const imageTag = `<img src="${imageUrl}" alt="${file.name}" style="max-width: 100%;" />`;

      const newText =
        value.substring(0, selection.start) +
        imageTag +
        value.substring(selection.end);

      onChange(newText);

      // Colocar cursor após a imagem
      const newCursorPos = selection.start + imageTag.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
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

      // Inserir link na posição do cursor
      const linkTag = `<p><a href="${fileUrl}" target="_blank">${file.name}</a></p>`;

      const newText =
        value.substring(0, selection.start) +
        linkTag +
        value.substring(selection.end);

      onChange(newText);

      // Colocar cursor após o link
      const newCursorPos = selection.start + linkTag.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
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
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={captureSelection} // Capturar seleção quando mudar
          onMouseUp={captureSelection} // Capturar seleção ao soltar o mouse
          onKeyUp={captureSelection} // Capturar seleção ao soltar tecla
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
