// src/components/postagens/PostagemForm.tsx
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  Image as ImageIcon,
  Paperclip,
  Table,
  Plus,
  X,
  Edit,
  Trash,
} from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";
import { Convenio } from "@/services/convenio";
import { Postagem, Imagem, Anexo, TabelaPostagem } from "@/services/postagem";
import convenioService from "@/services/convenio";
import postagemService from "@/services/postagem";
import { useAuth } from "@/context/AuthContext";
import toastUtil from "@/utils/toast";

interface TabelaEditor {
  id?: string;
  conteudo: any[][];
  isNew?: boolean;
}

interface PostagemFormProps {
  postagemId?: string;
  isEditing?: boolean;
}

const defaultTabelaValue = [
  ["Procedimento", "Valor (R$)", "Observações"],
  ["", "", ""],
  ["", "", ""],
  ["", "", ""],
];

const PostagemForm: React.FC<PostagemFormProps> = ({
  postagemId,
  isEditing = false,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Estados do formulário
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [convenioId, setConvenioId] = useState("");
  const [convenios, setConvenios] = useState<Convenio[]>([]);

  // Estados para uploads e edições
  const [imagens, setImagens] = useState<
    (Imagem & { file?: File; isNew?: boolean })[]
  >([]);
  const [anexos, setAnexos] = useState<
    (Anexo & { file?: File; isNew?: boolean })[]
  >([]);
  const [tabelas, setTabelas] = useState<TabelaEditor[]>([]);

  // Refs para input de arquivo
  const imagemInputRef = useRef<HTMLInputElement>(null);
  const anexoInputRef = useRef<HTMLInputElement>(null);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [currentImagemDescricao, setCurrentImagemDescricao] = useState("");
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(
    null
  );

  // Efeito para carregar convênios
  useEffect(() => {
    const fetchConvenios = async () => {
      try {
        const conveniosData = await convenioService.getAllConvenios();
        setConvenios(conveniosData);

        // Se estamos na criação e o ID do convênio foi passado por parâmetro
        const convenioIdParam = searchParams.get("convenioId");
        if (!isEditing && convenioIdParam) {
          setConvenioId(convenioIdParam);
        }
      } catch (error) {
        console.error("Erro ao carregar convênios:", error);
        toastUtil.error("Erro ao carregar lista de convênios");
      }
    };

    fetchConvenios();
  }, [isEditing, searchParams]);

  // Efeito para carregar dados da postagem quando estiver editando
  useEffect(() => {
    const fetchPostagemData = async () => {
      if (isEditing && postagemId) {
        setFetchingData(true);

        try {
          const postagem = await postagemService.getPostagemById(postagemId);

          // Preencher o formulário com os dados existentes
          setTitulo(postagem.title);
          setTexto(postagem.text);
          setConvenioId(postagem.convenioId);

          // Configurar imagens existentes
          if (postagem.imagens && postagem.imagens.length > 0) {
            setImagens(
              postagem.imagens.map((img) => ({ ...img, isNew: false }))
            );
          }

          // Configurar anexos existentes
          if (postagem.anexos && postagem.anexos.length > 0) {
            setAnexos(
              postagem.anexos.map((anexo) => ({ ...anexo, isNew: false }))
            );
          }

          // Configurar tabelas existentes
          if (postagem.tabelas && postagem.tabelas.length > 0) {
            setTabelas(
              postagem.tabelas.map((tabela) => ({
                id: tabela.id,
                conteudo: tabela.conteudo,
                isNew: false,
              }))
            );
          }
        } catch (error) {
          console.error("Erro ao carregar dados da postagem:", error);
          toastUtil.error("Erro ao carregar dados da postagem para edição");
          setError(
            "Não foi possível carregar os dados da postagem. Tente novamente."
          );
        } finally {
          setFetchingData(false);
        }
      }
    };

    fetchPostagemData();
  }, [isEditing, postagemId]);

  // Manipuladores para uploads de arquivos
  const handleImagemUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Converter FileList para array e processar cada arquivo
    Array.from(files).forEach((file) => {
      // Verificar tipo de arquivo (aceitar apenas imagens)
      if (!file.type.startsWith("image/")) {
        toastUtil.error(`${file.name} não é uma imagem válida`);
        return;
      }

      // Criar URL temporária para preview
      const url = URL.createObjectURL(file);

      // Adicionar à lista de imagens
      setImagens((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          postId: postagemId || "",
          url,
          description: currentImagemDescricao,
          file,
          isNew: true,
        },
      ]);

      // Limpar descrição após adicionar
      setCurrentImagemDescricao("");
    });

    // Limpar input de arquivo
    if (imagemInputRef.current) {
      imagemInputRef.current.value = "";
    }
  };

  const handleAnexoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Converter FileList para array e processar cada arquivo
    Array.from(files).forEach((file) => {
      // Criar URL temporária para preview
      const url = URL.createObjectURL(file);

      // Adicionar à lista de anexos
      setAnexos((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          postId: postagemId || "",
          nameFile: file.name,
          typeFile: file.type,
          url,
          file,
          isNew: true,
        },
      ]);
    });

    // Limpar input de arquivo
    if (anexoInputRef.current) {
      anexoInputRef.current.value = "";
    }
  };

  // Manipuladores para edição de imagem
  const handleEditImagemDescricao = (index: number) => {
    const imagem = imagens[index];
    setCurrentImagemDescricao(imagem.description || "");
    setEditingImageIndex(index);
  };

  const handleSaveImagemDescricao = () => {
    if (editingImageIndex !== null) {
      setImagens((prev) => {
        const updated = [...prev];
        updated[editingImageIndex] = {
          ...updated[editingImageIndex],
          description: currentImagemDescricao,
        };
        return updated;
      });

      setEditingImageIndex(null);
      setCurrentImagemDescricao("");
    }
  };

  // Manipuladores para remoção de itens
  const handleRemoveImagem = (index: number) => {
    setImagens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAnexo = (index: number) => {
    setAnexos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveTabela = (index: number) => {
    setTabelas((prev) => prev.filter((_, i) => i !== index));
  };

  // Manipulador para adicionar nova tabela
  const handleAddTabela = () => {
    setTabelas((prev) => [
      ...prev,
      {
        conteudo: JSON.parse(JSON.stringify(defaultTabelaValue)), // Deep clone
        isNew: true,
      },
    ]);
  };

  // Manipulador para edição de célula da tabela
  const handleTabelaCellChange = (
    tabelaIndex: number,
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    setTabelas((prev) => {
      const updatedTabelas = [...prev];
      const updatedConteudo = [...updatedTabelas[tabelaIndex].conteudo];

      // Garantir que a linha existe
      if (!updatedConteudo[rowIndex]) {
        updatedConteudo[rowIndex] = [];
      }

      // Atualizar o valor da célula
      updatedConteudo[rowIndex][colIndex] = value;

      // Atualizar a tabela
      updatedTabelas[tabelaIndex] = {
        ...updatedTabelas[tabelaIndex],
        conteudo: updatedConteudo,
      };

      return updatedTabelas;
    });
  };

  // Adicionar linha à tabela
  const handleAddRow = (tabelaIndex: number) => {
    setTabelas((prev) => {
      const updatedTabelas = [...prev];
      const tabela = updatedTabelas[tabelaIndex];

      // Criar nova linha com o mesmo número de colunas da primeira linha
      const numCols = tabela.conteudo[0].length;
      const newRow = Array(numCols).fill("");

      // Adicionar a nova linha à tabela
      updatedTabelas[tabelaIndex] = {
        ...tabela,
        conteudo: [...tabela.conteudo, newRow],
      };

      return updatedTabelas;
    });
  };

  // Remover linha da tabela
  const handleRemoveRow = (tabelaIndex: number, rowIndex: number) => {
    // Não permitir remover a primeira linha (cabeçalho)
    if (rowIndex === 0) return;

    setTabelas((prev) => {
      const updatedTabelas = [...prev];
      const tabela = updatedTabelas[tabelaIndex];

      // Remover a linha especificada
      const updatedConteudo = tabela.conteudo.filter(
        (_, index) => index !== rowIndex
      );

      updatedTabelas[tabelaIndex] = {
        ...tabela,
        conteudo: updatedConteudo,
      };

      return updatedTabelas;
    });
  };

  // Validação do formulário
  const validateForm = () => {
    if (!titulo.trim()) {
      toastUtil.error("O título é obrigatório");
      return false;
    }

    if (!texto.trim()) {
      toastUtil.error("O texto da postagem é obrigatório");
      return false;
    }

    if (!convenioId) {
      toastUtil.error("É necessário selecionar um convênio");
      return false;
    }

    return true;
  };

  // Manipulador para submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const loadingToastId = toastUtil.loading(
      isEditing ? "Atualizando postagem..." : "Criando postagem..."
    );

    try {
      if (isEditing && postagemId) {
        // Atualizar a postagem existente
        const postagemAtualizada = await postagemService.updatePostagem(
          postagemId,
          {
            title: titulo,
            text: texto,
            convenioId,
          }
        );

        // Processar uploads de novas imagens
        for (const imagem of imagens.filter((img) => img.isNew && img.file)) {
          await postagemService.addImagemToPostagem(
            postagemId,
            imagem.file!,
            imagem.description
          );
        }

        // Processar uploads de novos anexos
        for (const anexo of anexos.filter((anx) => anx.isNew && anx.file)) {
          await postagemService.addAnexoToPostagem(postagemId, anexo.file!);
        }

        // Processar novas tabelas
        for (const tabela of tabelas.filter((tab) => tab.isNew)) {
          await postagemService.addTabelaToPostagem(
            postagemId,
            tabela.conteudo
          );
        }

        toastUtil.dismiss(loadingToastId);
        toastUtil.success("Postagem atualizada com sucesso!");

        // Redirecionar para a página de detalhes da postagem
        router.push(`/postagens/${postagemId}`);
      } else {
        // Criar nova postagem
        const novaPostagem = await postagemService.createPostagem({
          title: titulo,
          text: texto,
          convenioId,
          createdBy: user?.id || "",
        });

        // Processar uploads de imagens
        for (const imagem of imagens.filter((img) => img.file)) {
          await postagemService.addImagemToPostagem(
            novaPostagem.id,
            imagem.file!,
            imagem.description
          );
        }

        // Processar uploads de anexos
        for (const anexo of anexos.filter((anx) => anx.file)) {
          await postagemService.addAnexoToPostagem(
            novaPostagem.id,
            anexo.file!
          );
        }

        // Processar tabelas
        for (const tabela of tabelas) {
          await postagemService.addTabelaToPostagem(
            novaPostagem.id,
            tabela.conteudo
          );
        }

        toastUtil.dismiss(loadingToastId);
        toastUtil.success("Postagem criada com sucesso!");

        // Redirecionar para a página de detalhes da nova postagem
        router.push(`/postagens/${novaPostagem.id}`);
      }
    } catch (error) {
      console.error("Erro ao salvar postagem:", error);
      toastUtil.dismiss(loadingToastId);
      toastUtil.error(
        isEditing
          ? "Erro ao atualizar postagem. Tente novamente."
          : "Erro ao criar postagem. Tente novamente."
      );
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={36} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Título e Convênio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label
            htmlFor="titulo"
            className="block text-sm font-medium text-gray-700 mb-1">
            Título *
          </label>
          <input
            id="titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        <div>
          <label
            htmlFor="convenio"
            className="block text-sm font-medium text-gray-700 mb-1">
            Convênio *
          </label>
          <select
            id="convenio"
            value={convenioId}
            onChange={(e) => setConvenioId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            required>
            <option value="">Selecione um convênio</option>
            {convenios.map((convenio) => (
              <option key={convenio.id} value={convenio.id}>
                {convenio.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Texto da postagem */}
      <div>
        <label
          htmlFor="texto"
          className="block text-sm font-medium text-gray-700 mb-1">
          Texto *
        </label>
        <textarea
          id="texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={8}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
      </div>

      {/* Imagens */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Imagens</h3>

        <div className="mb-4">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <label
                htmlFor="descricao"
                className="block text-sm font-medium text-gray-700 mb-1">
                Descrição da imagem
              </label>
              <input
                id="descricao"
                type="text"
                value={currentImagemDescricao}
                onChange={(e) => setCurrentImagemDescricao(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Opcional"
              />
            </div>

            <input
              ref={imagemInputRef}
              type="file"
              accept="image/*"
              onChange={handleImagemUpload}
              className="hidden"
              multiple
            />

            {editingImageIndex !== null ? (
              <CustomButton
                type="button"
                onClick={handleSaveImagemDescricao}
                variant="secondary"
                className="border border-gray-300">
                Salvar Descrição
              </CustomButton>
            ) : (
              <CustomButton
                type="button"
                onClick={() => imagemInputRef.current?.click()}
                icon={ImageIcon}
                variant="secondary"
                className="border border-gray-300">
                Adicionar Imagem
              </CustomButton>
            )}
          </div>
        </div>

        {/* Preview de imagens */}
        {imagens.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {imagens.map((imagem, index) => (
              <div
                key={imagem.id}
                className="relative border rounded-lg overflow-hidden">
                <div className="h-40 bg-gray-100 relative">
                  <Image
                    src={imagem.url}
                    alt={imagem.description || `Imagem ${index + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>

                <div className="p-2">
                  <p className="text-sm text-gray-700 truncate">
                    {imagem.description || "Sem descrição"}
                  </p>

                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => handleEditImagemDescricao(index)}
                      className="text-blue-600 hover:text-blue-800 mr-2">
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImagem(index)}
                      className="text-red-600 hover:text-red-800">
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anexos */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Anexos</h3>

        <div className="mb-4">
          <CustomButton
            type="button"
            onClick={() => anexoInputRef.current?.click()}
            icon={Paperclip}
            variant="secondary"
            className="border border-gray-300">
            Adicionar Anexo
          </CustomButton>

          <input
            ref={anexoInputRef}
            type="file"
            onChange={handleAnexoUpload}
            className="hidden"
            multiple
          />
        </div>

        {/* Lista de anexos */}
        {anexos.length > 0 && (
          <div className="space-y-2 mb-6">
            {anexos.map((anexo, index) => (
              <div
                key={anexo.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  <Paperclip className="mr-3 text-gray-400" size={20} />
                  <div>
                    <p className="font-medium">{anexo.nameFile}</p>
                    {anexo.typeFile && (
                      <p className="text-xs text-gray-500">{anexo.typeFile}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAnexo(index)}
                  className="text-red-600 hover:text-red-800">
                  <Trash size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabelas */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-700">Tabelas</h3>

          <CustomButton
            type="button"
            onClick={handleAddTabela}
            icon={Table}
            variant="secondary"
            className="border border-gray-300">
            Adicionar Tabela
          </CustomButton>
        </div>

        {/* Editores de tabela */}
        {tabelas.length > 0 && (
          <div className="space-y-8 mb-6">
            {tabelas.map((tabela, tabelaIndex) => (
              <div
                key={tabela.id || tabelaIndex}
                className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 flex justify-between items-center">
                  <h4 className="font-medium">Tabela {tabelaIndex + 1}</h4>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveTabela(tabelaIndex)}
                      className="text-red-600 hover:text-red-800">
                      <Trash size={18} />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody>
                      {tabela.conteudo.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={
                            rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }>
                          {row.map((cell, colIndex) => (
                            <td key={colIndex} className="px-2 py-2 border">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) =>
                                  handleTabelaCellChange(
                                    tabelaIndex,
                                    rowIndex,
                                    colIndex,
                                    e.target.value
                                  )
                                }
                                className="w-full p-1 border-gray-200 focus:ring-1 focus:ring-primary"
                              />
                            </td>
                          ))}

                          <td className="px-2 py-2 border text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveRow(tabelaIndex, rowIndex)
                              }
                              className={`text-red-600 hover:text-red-800 ${rowIndex === 0 ? "invisible" : ""}`}
                              disabled={rowIndex === 0}>
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-50 p-3 flex justify-center">
                  <CustomButton
                    type="button"
                    onClick={() => handleAddRow(tabelaIndex)}
                    icon={Plus}
                    variant="secondary"
                    className="border border-gray-300 text-sm py-1">
                    Adicionar Linha
                  </CustomButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <CustomButton
          type="button"
          onClick={() => router.back()}
          variant="secondary"
          className="border border-gray-300"
          disabled={loading}>
          Cancelar
        </CustomButton>

        <CustomButton type="submit" variant="primary" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Salvando..." : "Criando..."}
            </>
          ) : isEditing ? (
            "Salvar Alterações"
          ) : (
            "Criar Postagem"
          )}
        </CustomButton>
      </div>
    </form>
  );
};

export default PostagemForm;
