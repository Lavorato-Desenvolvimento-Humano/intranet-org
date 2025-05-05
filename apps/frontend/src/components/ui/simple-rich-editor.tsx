// src/components/ui/simple-rich-editor.tsx
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
  preserveWhitespace?: boolean;
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
  preserveWhitespace = true,
  onImageUpload,
  onFileUpload,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const checkIfEmpty = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML.trim();
      setIsEmpty(!content || content === "<br>" || content === "<p></p>");
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      if (!isInitialized) {
        editorRef.current.innerHTML = value || "";
        setIsInitialized(true);
        checkIfEmpty();
      } else if (value !== editorRef.current.innerHTML) {
        const selection = window.getSelection();
        const isEditorFocused = document.activeElement === editorRef.current;
        const activeElement = document.activeElement;

        const savedSelection = {
          anchorNode: selection?.anchorNode,
          anchorOffset: selection?.anchorOffset || 0,
          focusNode: selection?.focusNode,
          focusOffset: selection?.focusOffset || 0,
          rangeCount: selection?.rangeCount || 0,
        };

        editorRef.current.innerHTML = value || "";
        checkIfEmpty();

        if (isEditorFocused && savedSelection.rangeCount > 0 && selection) {
          try {
            setTimeout(() => {
              if (activeElement instanceof HTMLElement) {
                activeElement.focus();
              }

              if (
                savedSelection.anchorNode &&
                savedSelection.anchorNode.parentNode &&
                document.contains(savedSelection.anchorNode)
              ) {
                const range = document.createRange();
                range.setStart(
                  savedSelection.anchorNode,
                  savedSelection.anchorOffset
                );
                if (
                  savedSelection.focusNode &&
                  document.contains(savedSelection.focusNode)
                ) {
                  range.setEnd(
                    savedSelection.focusNode,
                    savedSelection.focusOffset
                  );
                }
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }, 0);
          } catch (e) {
            console.error("Error restoring selection:", e);
          }
        }
      }
    }
  }, [value, isInitialized]);

  const handleEditorChange = () => {
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      checkIfEmpty();
      if (newValue !== value) {
        onChange(newValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
  };

  const execCommand = (command: string, showUI = false, value?: string) => {
    if (disabled) return;

    if (editorRef.current) {
      editorRef.current.focus();
    }

    document.execCommand(command, showUI, value);
    handleEditorChange();
  };

  const getSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }
    return selection.getRangeAt(0);
  };

  const hasSelection = () => {
    const selection = window.getSelection();
    return selection && !selection.isCollapsed;
  };

  const findParentElement = (
    node: Node | null,
    tagName: string
  ): HTMLElement | null => {
    if (!node) return null;

    let currentNode: Node | null = node;
    while (currentNode && currentNode !== editorRef.current) {
      if (
        currentNode.nodeType === Node.ELEMENT_NODE &&
        (currentNode as HTMLElement).tagName.toLowerCase() ===
          tagName.toLowerCase()
      ) {
        return currentNode as HTMLElement;
      }
      currentNode = currentNode.parentNode;
    }
    return null;
  };

  const handleBold = () => {
    if (hasSelection()) {
      execCommand("bold");

      if (editorRef.current) {
        const boldElements =
          editorRef.current.querySelectorAll("b:not([class])");
        boldElements.forEach((element) => {
          element.className = "font-bold";
        });
      }
    } else {
      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        const boldParent = findParentElement(selection.anchorNode, "b");

        if (boldParent) {
          const textNode = document.createTextNode(
            boldParent.textContent || ""
          );
          boldParent.parentNode?.replaceChild(textNode, boldParent);
        } else {
          execCommand("bold");

          if (editorRef.current) {
            const boldElements =
              editorRef.current.querySelectorAll("b:not([class])");
            boldElements.forEach((element) => {
              element.className = "font-bold";
            });
          }
        }
      }
    }

    handleEditorChange();
  };

  const handleItalic = () => {
    if (hasSelection()) {
      execCommand("italic");

      if (editorRef.current) {
        const italicElements =
          editorRef.current.querySelectorAll("i:not([class])");
        italicElements.forEach((element) => {
          element.className = "italic";
        });
      }
    } else {
      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        const italicParent = findParentElement(selection.anchorNode, "i");

        if (italicParent) {
          const textNode = document.createTextNode(
            italicParent.textContent || ""
          );
          italicParent.parentNode?.replaceChild(textNode, italicParent);
        } else {
          execCommand("italic");

          if (editorRef.current) {
            const italicElements =
              editorRef.current.querySelectorAll("i:not([class])");
            italicElements.forEach((element) => {
              element.className = "italic";
            });
          }
        }
      }
    }

    handleEditorChange();
  };

  const getCurrentLineNode = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    let node = selection.anchorNode;

    if (node?.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    while (
      node &&
      node.nodeType === Node.ELEMENT_NODE &&
      window.getComputedStyle(node as Element).display !== "block" &&
      node !== editorRef.current
    ) {
      node = node.parentNode;
    }

    if (node === editorRef.current) {
      const p = document.createElement("p");
      if (selection.anchorNode && selection.anchorNode !== editorRef.current) {
        const range = selection.getRangeAt(0);
        range.selectNode(selection.anchorNode);
        range.surroundContents(p);
        node = p;
      } else {
        p.innerHTML = "<br>";
        editorRef.current?.appendChild(p);
        node = p;
      }
    }

    return node;
  };

  const handleHeading1 = () => {
    if (disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

    const hasSelectedText = !selection.isCollapsed;

    if (hasSelectedText) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();

      const h1Parent = findParentElement(selection.anchorNode, "h1");

      if (h1Parent) {
        const textNode = document.createTextNode(selectedText);
        const p = document.createElement("p");
        p.appendChild(textNode);

        range.deleteContents();
        range.insertNode(p);
      } else {
        const h1 = document.createElement("h1");
        h1.className = "text-2xl font-bold my-3";
        h1.textContent = selectedText;

        range.deleteContents();
        range.insertNode(h1);
      }

      if (!h1Parent) {
        const h1 = document.createElement("h1");
        h1.className = "text-2xl font-bold my-3";
        h1.textContent = selectedText;

        range.deleteContents();
        range.insertNode(h1);

        range.setStartAfter(h1);
        range.setEndAfter(h1);
      } else {
        range.setStartAfter(h1Parent);
        range.setEndAfter(h1Parent);
      }
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      const currentLineNode = getCurrentLineNode();

      if (currentLineNode) {
        const isH1 = currentLineNode.nodeName.toLowerCase() === "h1";

        if (isH1) {
          const p = document.createElement("p");
          p.innerHTML = (currentLineNode as HTMLElement).innerHTML;
          currentLineNode.parentNode?.replaceChild(p, currentLineNode);

          const range = document.createRange();
          range.selectNodeContents(p);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          const h1 = document.createElement("h1");
          h1.className = "text-2xl font-bold my-3";
          h1.innerHTML = (currentLineNode as HTMLElement).innerHTML;

          currentLineNode.parentNode?.replaceChild(h1, currentLineNode);

          const range = document.createRange();
          range.selectNodeContents(h1);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }

    handleEditorChange();
  };

  const handleHeading2 = () => {
    if (disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

    const hasSelectedText = !selection.isCollapsed;

    if (hasSelectedText) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();

      const h2Parent = findParentElement(selection.anchorNode, "h2");

      if (h2Parent) {
        const textNode = document.createTextNode(selectedText);
        const p = document.createElement("p");
        p.appendChild(textNode);

        range.deleteContents();
        range.insertNode(p);
      } else {
        const h2 = document.createElement("h2");
        h2.className = "text-xl font-bold my-2";
        h2.textContent = selectedText;

        range.deleteContents();
        range.insertNode(h2);
      }

      if (!h2Parent) {
        const h2 = document.createElement("h2");
        h2.className = "text-xl font-bold my-2";
        h2.textContent = selectedText;

        range.deleteContents();
        range.insertNode(h2);

        range.setStartAfter(h2);
        range.setEndAfter(h2);
      } else {
        range.setStartAfter(h2Parent);
        range.setEndAfter(h2Parent);
      }
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      const currentLineNode = getCurrentLineNode();

      if (currentLineNode) {
        const isH2 = currentLineNode.nodeName.toLowerCase() === "h2";

        if (isH2) {
          const p = document.createElement("p");
          p.innerHTML = (currentLineNode as HTMLElement).innerHTML;
          currentLineNode.parentNode?.replaceChild(p, currentLineNode);

          const range = document.createRange();
          range.selectNodeContents(p);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          const h2 = document.createElement("h2");
          h2.className = "text-xl font-bold my-2";
          h2.innerHTML = (currentLineNode as HTMLElement).innerHTML;

          currentLineNode.parentNode?.replaceChild(h2, currentLineNode);

          const range = document.createRange();
          range.selectNodeContents(h2);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }

    handleEditorChange();
  };

  const fixListClasses = () => {
    if (editorRef.current) {
      const unorderedLists = editorRef.current.querySelectorAll("ul");
      unorderedLists.forEach((list) => {
        if (!list.className) {
          list.className = "list-disc pl-5 my-3";
        }
        const items = list.querySelectorAll("li");
        items.forEach((item) => {
          if (!item.className) {
            item.className = "my-1";
          }
        });
      });

      const orderedLists = editorRef.current.querySelectorAll("ol");
      orderedLists.forEach((list) => {
        if (!list.className) {
          list.className = "list-decimal pl-5 my-3";
        }
        const items = list.querySelectorAll("li");
        items.forEach((item) => {
          if (!item.className) {
            item.className = "my-1";
          }
        });
      });
    }
  };

  const handleList = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const listItemNode = findParentElement(selection.anchorNode, "li");
    const listNode = findParentElement(selection.anchorNode, "ul");

    if (listItemNode && listNode) {
      const fragment = document.createDocumentFragment();
      const items = listNode.querySelectorAll("li");

      items.forEach((item) => {
        const p = document.createElement("p");
        p.innerHTML = item.innerHTML;
        fragment.appendChild(p);
      });

      listNode.parentNode?.replaceChild(fragment, listNode);
    } else {
      execCommand("insertUnorderedList");

      setTimeout(() => {
        fixListClasses();
        handleEditorChange();
      }, 0);
    }
  };

  const handleOrderedList = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const listItemNode = findParentElement(selection.anchorNode, "li");
    const listNode = findParentElement(selection.anchorNode, "ol");

    if (listItemNode && listNode) {
      const fragment = document.createDocumentFragment();
      const items = listNode.querySelectorAll("li");

      items.forEach((item) => {
        const p = document.createElement("p");
        p.innerHTML = item.innerHTML;
        fragment.appendChild(p);
      });

      listNode.parentNode?.replaceChild(fragment, listNode);
    } else {
      execCommand("insertOrderedList");

      setTimeout(() => {
        fixListClasses();
        handleEditorChange();
      }, 0);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    const text =
      e.clipboardData.getData("text/html") || e.clipboardData.getData("text");

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;

    const lists = tempDiv.querySelectorAll("ul, ol");
    lists.forEach((list) => {
      const isOrdered = list.tagName.toLowerCase() === "ol";
      list.className = isOrdered
        ? "list-decimal pl-5 my-3"
        : "list-disc pl-5 my-3";

      const items = list.querySelectorAll("li");
      items.forEach((item) => {
        item.className = "my-1";
      });
    });

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const fragment = range.createContextualFragment(tempDiv.innerHTML);
      range.insertNode(fragment);

      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    handleEditorChange();
  };

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

      execCommand(
        "insertHTML",
        false,
        `<img src="${imageUrl}" alt="${file.name}" class="max-w-full h-auto my-2 rounded" />`
      );
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
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
      execCommand(
        "insertHTML",
        false,
        `<p class="my-2"><a href="${fileUrl}" target="_blank" class="text-primary hover:text-primary-dark underline">${file.name}</a></p>`
      );
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
      alert("Erro ao fazer upload do arquivo. Tente novamente.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const editorClasses = `w-full h-full px-3 py-2 focus:outline-none overflow-auto leading-normal ${
    preserveWhitespace ? "whitespace-pre-wrap break-words" : ""
  }`;

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

        <div className="relative" style={{ height }}>
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleEditorChange}
            onBlur={handleEditorChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className={editorClasses}
            style={{ minHeight: "200px" }}
            suppressContentEditableWarning={true}
          />

          {isEmpty && (
            <div className="absolute top-2 left-3 pointer-events-none text-gray-400">
              {placeholder}
            </div>
          )}
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

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
