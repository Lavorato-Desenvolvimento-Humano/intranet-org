// src/components/ui/simple-rich-editor.tsx
import React, { useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Paperclip,
  Undo,
  Redo,
  Quote,
} from "lucide-react";
import { cn } from "@/utils/cn";

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
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-md max-w-full h-auto my-4 border border-gray-200",
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "is-editor-empty before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:pointer-events-none before:h-0",
      }),
    ],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[150px] px-3 py-2",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sincronizar valor externo se mudar drasticamente (ex: reset de form)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Apenas atualiza se o conteúdo for realmente diferente para evitar loops e perda de cursor
      if (editor.getText() === "" && value === "") return;
      // Comparação simples, idealmente seria um deep compare ou controle de versão
      if (Math.abs(value.length - editor.getHTML().length) > 10) {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  // Atualizar estado de disabled
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const addImage = useCallback(async () => {
    if (!onImageUpload) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const url = await onImageUpload(file);
          if (url) {
            editor?.chain().focus().setImage({ src: url }).run();
          }
        } catch (error) {
          console.error("Erro ao fazer upload da imagem", error);
        }
      }
    };
    input.click();
  }, [editor, onImageUpload]);

  const addFile = useCallback(async () => {
    if (!onFileUpload) return;

    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const url = await onFileUpload(file);
          if (url) {
            editor
              ?.chain()
              .focus()
              .insertContent(
                `<a href="${url}" target="_blank" class="text-blue-600 hover:underline flex items-center gap-1">📎 ${file.name}</a>`
              )
              .run();
          }
        } catch (error) {
          console.error("Erro ao fazer upload do arquivo", error);
        }
      }
    };
    input.click();
  }, [editor, onFileUpload]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL:", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        isActive
          ? "bg-gray-200 text-gray-900"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
      {children}
    </button>
  );

  return (
    <div className="w-full flex flex-col gap-1">
      <div
        className={cn(
          "border rounded-md overflow-hidden bg-white transition-colors",
          error
            ? "border-red-500"
            : "border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500",
          disabled && "bg-gray-50 opacity-80"
        )}>
        {/* Toolbar */}
        <div className="flex items-center p-2 border-b bg-gray-50 flex-wrap gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            disabled={disabled}
            title="Negrito">
            <Bold size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            disabled={disabled}
            title="Itálico">
            <Italic size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            disabled={disabled}
            title="Citação">
            <Quote size={16} />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            disabled={disabled}
            title="Título 1">
            <Heading1 size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            disabled={disabled}
            title="Título 2">
            <Heading2 size={16} />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            disabled={disabled}
            title="Lista">
            <List size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            disabled={disabled}
            title="Lista Numerada">
            <ListOrdered size={16} />
          </ToolbarButton>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive("link")}
            disabled={disabled}
            title="Link">
            <LinkIcon size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={addImage}
            disabled={disabled || !onImageUpload}
            title="Imagem">
            <ImageIcon size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={addFile}
            disabled={disabled || !onFileUpload}
            title="Anexo">
            <Paperclip size={16} />
          </ToolbarButton>

          <div className="flex-1"></div>

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="Desfazer">
            <Undo size={16} />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="Refazer">
            <Redo size={16} />
          </ToolbarButton>
        </div>

        {/* Editor Content */}
        <div
          className="relative cursor-text"
          onClick={() => editor.chain().focus().run()}
          style={{ height }}>
          <EditorContent editor={editor} className="h-full overflow-y-auto" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default SimpleRichEditor;
