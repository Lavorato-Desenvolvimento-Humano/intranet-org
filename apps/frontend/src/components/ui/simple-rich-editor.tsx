// src/components/ui/simple-rich-editor.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
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
  height = "400px",
  error,
  disabled = false,
  onImageUpload,
  onFileUpload,
}) => {
  // Reference to the editor element
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State to track if editor content has been initialized
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Check if editor is empty
  const checkIfEmpty = () => {
    if (editorRef.current) {
      // Check if content is empty or just contains empty tags, whitespace, etc.
      const content = editorRef.current.innerHTML.trim();
      setIsEmpty(!content || content === "<br>" || content === "<p></p>");
    }
  };

  // Initialize editor content from value
  useEffect(() => {
    if (editorRef.current) {
      if (!isInitialized) {
        editorRef.current.innerHTML = value || "";
        setIsInitialized(true);
        checkIfEmpty();
      } else if (value !== editorRef.current.innerHTML) {
        // Only update if content has changed from external source
        const selection = window.getSelection();
        const isEditorFocused = document.activeElement === editorRef.current;

        // Update content
        editorRef.current.innerHTML = value || "";
        checkIfEmpty();
      }
    }
  }, [value, isInitialized]);

  // Handle editor content changes
  const handleEditorChange = () => {
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      checkIfEmpty();
      // Prevent unnecessary updates
      if (newValue !== value) {
        onChange(newValue);
      }
    }
  };

  // Additional event handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle tab key to create indent instead of losing focus
    if (e.key === "Tab") {
      e.preventDefault();
      execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
  };

  // Execute a document command for formatting
  const execCommand = (command: string, showUI = false, value?: string) => {
    if (disabled) return;

    // Focus the editor first
    if (editorRef.current) {
      editorRef.current.focus();
    }

    document.execCommand(command, showUI, value);
    handleEditorChange();
  };

  // Handlers for toolbar buttons
  const handleBold = () => execCommand("bold");
  const handleItalic = () => execCommand("italic");
  const handleHeading1 = () => {
    if (disabled) return;

    // Save selection position
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (selection && range && editorRef.current) {
      const selectedText = selection.toString();

      // Create h1 element with selected text
      const h1 = document.createElement("h1");
      h1.className = "text-2xl font-bold my-3";
      h1.textContent = selectedText || "Título de nível 1";

      // Replace selected text with h1 element
      range.deleteContents();
      range.insertNode(h1);

      // Move cursor to end of inserted content
      range.setStartAfter(h1);
      range.setEndAfter(h1);
      selection.removeAllRanges();
      selection.addRange(range);

      handleEditorChange();
    }
  };

  const handleHeading2 = () => {
    if (disabled) return;

    // Save selection position
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (selection && range && editorRef.current) {
      const selectedText = selection.toString();

      // Create h2 element with selected text
      const h2 = document.createElement("h2");
      h2.className = "text-xl font-bold my-2";
      h2.textContent = selectedText || "Título de nível 2";

      // Replace selected text with h2 element
      range.deleteContents();
      range.insertNode(h2);

      // Move cursor to end of inserted content
      range.setStartAfter(h2);
      range.setEndAfter(h2);
      selection.removeAllRanges();
      selection.addRange(range);

      handleEditorChange();
    }
  };

  const handleList = () => execCommand("insertUnorderedList");
  const handleOrderedList = () => execCommand("insertOrderedList");

  const handleImageClick = () => {
    if (imageInputRef.current && !disabled) {
      imageInputRef.current.click();
    }
  };

  const handleFileClick = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onImageUpload || disabled) return;

    try {
      const file = files[0];
      const imageUrl = await onImageUpload(file);

      // Insert image at cursor position with Tailwind classes
      execCommand(
        "insertHTML",
        false,
        `<img src="${imageUrl}" alt="${file.name}" class="max-w-full h-auto my-2 rounded" />`
      );
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      // Clear the input
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onFileUpload || disabled) return;

    try {
      const file = files[0];
      const fileUrl = await onFileUpload(file);

      // Insert link at cursor position with Tailwind classes
      execCommand(
        "insertHTML",
        false,
        `<p class="my-2"><a href="${fileUrl}" target="_blank" class="text-primary hover:text-primary-dark underline">${file.name}</a></p>`
      );
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
      alert("Erro ao fazer upload do arquivo. Tente novamente.");
    } finally {
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full">
      <div className="border rounded-md overflow-hidden">
        {/* Toolbar */}
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

        {/* Content editable div with placeholder handling via Tailwind */}
        <div className="relative" style={{ height }}>
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleEditorChange}
            onBlur={handleEditorChange}
            onKeyDown={handleKeyDown}
            className="w-full h-full px-3 py-2 focus:outline-none overflow-auto leading-normal"
            style={{ minHeight: "200px" }}
            suppressContentEditableWarning={true}
          />

          {/* Placeholder element using Tailwind positioning */}
          {isEmpty && (
            <div className="absolute top-2 left-3 pointer-events-none text-gray-400">
              {placeholder}
            </div>
          )}
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {/* Hidden inputs for file uploads */}
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        className="hidden"
        onChange={handleImageUpload}
        disabled={disabled}
      />
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
