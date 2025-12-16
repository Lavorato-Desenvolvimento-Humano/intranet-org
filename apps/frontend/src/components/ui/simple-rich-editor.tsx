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
  Type,
  AlignLeft,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface SimpleRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string; // Alterei de height fixo para minHeight para crescer com o conteúdo
  error?: string;
  disabled?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
  onFileUpload?: (file: File) => Promise<string>;
}

const SimpleRichEditor: React.FC<SimpleRichEditorProps> = ({
  value,
  onChange,
  placeholder = "Comece a escrever...",
  minHeight = "250px",
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
          class:
            "rounded-lg max-w-full h-auto my-6 border border-gray-100 shadow-sm",
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-800 cursor-pointer transition-colors",
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
        class: cn(
          "prose prose-zinc prose-sm sm:prose max-w-none focus:outline-none px-6 py-4",
          "prose-headings:font-semibold prose-headings:text-zinc-800",
          "prose-p:text-zinc-600 prose-p:leading-relaxed",
          "prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline",
          "prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-sm",
          "prose-li:text-zinc-600"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sincronizar valor externo
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      if (editor.getText() === "" && value === "") return;
      if (Math.abs(value.length - editor.getHTML().length) > 10) {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  // Atualizar estado disabled
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
          console.error("Erro no upload", error);
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
                `<a href="${url}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors no-underline text-sm font-medium border border-gray-200"><span class="text-lg">📎</span> ${file.name}</a>`
              )
              .run();
          }
        } catch (error) {
          console.error("Erro no upload", error);
        }
      }
    };
    input.click();
  }, [editor, onFileUpload]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL do link:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

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
        "p-2 rounded-md transition-all duration-200 flex items-center justify-center",
        isActive
          ? "bg-blue-100 text-blue-700 shadow-sm"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
        disabled && "opacity-40 cursor-not-allowed"
      )}>
      {children}
    </button>
  );

  const Divider = () => <div className="w-[1px] h-5 bg-zinc-200 mx-1" />;

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div
        className={cn(
          "group border rounded-xl overflow-hidden bg-white transition-all duration-200 shadow-sm",
          error
            ? "border-red-500 ring-1 ring-red-100"
            : "border-zinc-200 hover:border-zinc-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100",
          disabled && "bg-gray-50 opacity-80"
        )}>
        {/* Sticky Toolbar */}
        <div className="sticky top-0 z-10 flex items-center p-2 border-b border-zinc-100 bg-white/95 backdrop-blur-sm flex-wrap gap-1">
          {/* Histórico */}
          <div className="flex items-center gap-0.5">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={disabled || !editor.can().undo()}
              title="Desfazer">
              <Undo size={15} strokeWidth={2.5} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={disabled || !editor.can().redo()}
              title="Refazer">
              <Redo size={15} strokeWidth={2.5} />
            </ToolbarButton>
          </div>

          <Divider />

          {/* Formatação Básica */}
          <div className="flex items-center gap-0.5">
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
          </div>

          <Divider />

          {/* Títulos */}
          <div className="flex items-center gap-0.5">
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive("heading", { level: 1 })}
              disabled={disabled}
              title="Título Principal">
              <Heading1 size={17} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive("heading", { level: 2 })}
              disabled={disabled}
              title="Subtítulo">
              <Heading2 size={17} />
            </ToolbarButton>
          </div>

          <Divider />

          {/* Listas */}
          <div className="flex items-center gap-0.5">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              disabled={disabled}
              title="Lista">
              <List size={17} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              disabled={disabled}
              title="Lista Numerada">
              <ListOrdered size={17} />
            </ToolbarButton>
          </div>

          <Divider />

          {/* Inserções */}
          <div className="flex items-center gap-0.5">
            <ToolbarButton
              onClick={setLink}
              isActive={editor.isActive("link")}
              disabled={disabled}
              title="Inserir Link">
              <LinkIcon size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={addImage}
              disabled={disabled || !onImageUpload}
              title="Inserir Imagem">
              <ImageIcon size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={addFile}
              disabled={disabled || !onFileUpload}
              title="Anexar Arquivo">
              <Paperclip size={16} />
            </ToolbarButton>
          </div>
        </div>

        {/* Editor Content Area */}
        <div
          className="relative cursor-text bg-white"
          onClick={() => editor.chain().focus().run()}>
          <EditorContent
            editor={editor}
            className="w-full"
            style={{ minHeight }}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 font-medium ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default SimpleRichEditor;
