// src/components/tabelas/TabelaForm.tsx
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, Trash, X, Save, ArrowLeft } from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";
import { Convenio } from "@/services/convenio";
import { Postagem } from "@/services/postagem";
import convenioService from "@/services/convenio";
import postagemService from "@/services/postagem";
import { useAuth } from "@/context/AuthContext";
import toastUtil from "@/utils/toast";

interface TabelaFormProps {
  postagemId?: string;
  convenioId?: string;
  isEditing?: boolean;
}

// Estrutura padrão para uma nova tabela de valores
const defaultTabela = [
  ["Procedimento", "Código", "Valor (R$)", "Observações"],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
];

const TabelaForm: React.FC<TabelaFormProps> = ({
  postagemId,
  convenioId: propConvenioId,
  isEditing = false,
}) => {
  // Referência para armazenar a postagem quando estamos editando
  const [postagem, setPostagem] = useState<Postagem | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Estados
  const [titulo, setTitulo] = useState("");
  const [convenioId, setConvenioId] = useState("");
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [tabelaData, setTabelaData] = useState<string[][]>(defaultTabela);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  // Efeito para carregar convênios
  useEffect(() => {
    const fetchConvenios = async () => {
      try {
        const conveniosData = await convenioService.getAllConvenios();
        setConvenios(conveniosData);

        // Pegar o ID do convênio das props ou dos parâmetros de URL
        const urlConvenioId = searchParams.get("convenioId");
        const finalConvenioId = propConvenioId || urlConvenioId || "";

        if (finalConvenioId) {
          setConvenioId(finalConvenioId);
        }
      } catch (error) {
        console.error("Erro ao carregar convênios:", error);
        toastUtil.error("Erro ao carregar lista de convênios");
        setError(
          "Não foi possível carregar a lista de convênios. Tente novamente."
        );
      }
    };

    fetchConvenios();
  }, [propConvenioId, searchParams]);

  // Efeito para carregar dados da tabela quando estiver editando
  useEffect(() => {
    const fetchTabelaData = async () => {
      if (isEditing && postagemId) {
        setFetchingData(true);

        try {
          const postagemData =
            await postagemService.getPostagemById(postagemId);
          setPostagem(postagemData);

          // Preencher o formulário com os dados existentes
          setTitulo(postagemData.title);
          setConvenioId(postagemData.convenioId);

          // Configurar dados da tabela existente
          if (postagemData.tabelas && postagemData.tabelas.length > 0) {
            setTabelaData(postagemData.tabelas[0].conteudo);
          }
        } catch (error) {
          console.error("Erro ao carregar dados da tabela:", error);
          toastUtil.error("Erro ao carregar dados da tabela para edição");
          setError(
            "Não foi possível carregar os dados da tabela. Tente novamente."
          );
        } finally {
          setFetchingData(false);
        }
      }
    };

    fetchTabelaData();
  }, [isEditing, postagemId]);

  // Manipulador para alteração de célula
  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    setTabelaData((prev) => {
      const updated = [...prev];

      // Garantir que a linha existe
      if (!updated[rowIndex]) {
        updated[rowIndex] = [];
      }

      // Atualizar o valor da célula
      updated[rowIndex][colIndex] = value;

      return updated;
    });
  };

  // Manipulador para adicionar linha
  const handleAddRow = () => {
    setTabelaData((prev) => {
      // Criar nova linha com o mesmo número de colunas da primeira linha
      const numCols = prev[0].length;
      const newRow = Array(numCols).fill("");

      return [...prev, newRow];
    });
  };

  // Manipulador para remover linha
  const handleRemoveRow = (rowIndex: number) => {
    // Não permitir remover a primeira linha (cabeçalho)
    if (rowIndex === 0) return;

    setTabelaData((prev) => prev.filter((_, index) => index !== rowIndex));
  };

  // Validação do formulário
  const validateForm = () => {
    if (!titulo.trim()) {
      toastUtil.error("O título é obrigatório");
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
      isEditing ? "Atualizando tabela..." : "Criando tabela..."
    );

    try {
      if (isEditing && postagemId) {
        // Atualizar a postagem existente
        await postagemService.updatePostagem(postagemId, {
          title: titulo,
          convenioId,
        });

        // Criar ou atualizar tabela
        if (postagem?.tabelas && postagem.tabelas.length > 0) {
          // Aqui seria necessário um endpoint para atualizar tabela existente
          // Como não temos esse endpoint no modelo atual, podemos criar uma nova tabela
          await postagemService.addTabelaToPostagem(postagemId, tabelaData);
        } else {
          await postagemService.addTabelaToPostagem(postagemId, tabelaData);
        }

        toastUtil.dismiss(loadingToastId);
        toastUtil.success("Tabela atualizada com sucesso!");

        // Redirecionar para a página do convênio
        router.push(`/convenios/${convenioId}`);
      } else {
        // Criar nova postagem para tabela de valores
        const novaPostagem = await postagemService.createPostagem({
          title: titulo,
          text: "Tabela de valores e preços",
          convenioId,
          createdBy: user?.id || "",
        });

        // Adicionar tabela à postagem
        await postagemService.addTabelaToPostagem(novaPostagem.id, tabelaData);

        toastUtil.dismiss(loadingToastId);
        toastUtil.success("Tabela criada com sucesso!");

        // Redirecionar para a página do convênio
        router.push(`/convenios/${convenioId}`);
      }
    } catch (error) {
      console.error("Erro ao salvar tabela:", error);
      toastUtil.dismiss(loadingToastId);
      toastUtil.error(
        isEditing
          ? "Erro ao atualizar tabela. Tente novamente."
          : "Erro ao criar tabela. Tente novamente."
      );
      setLoading(false);
    }
  };

  // Voltar para a página anterior
  const handleBack = () => {
    router.back();
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={36} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Botão de voltar */}
      <button
        type="button"
        onClick={handleBack}
        className="text-primary hover:text-primary-light transition-colors flex items-center mb-4">
        <ArrowLeft className="mr-2" size={18} />
        Voltar
      </button>

      {/* Título e Convênio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label
            htmlFor="titulo"
            className="block text-sm font-medium text-gray-700 mb-1">
            Título da Tabela *
          </label>
          <input
            id="titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Tabela de Preços 2025"
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
            required
            disabled={!!propConvenioId}>
            <option value="">Selecione um convênio</option>
            {convenios.map((convenio) => (
              <option key={convenio.id} value={convenio.id}>
                {convenio.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor de Tabela */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-4">
          Dados da Tabela
        </h3>

        <div className="border rounded-lg overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody>
                {tabelaData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="px-2 py-2 border">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) =>
                            handleCellChange(rowIndex, colIndex, e.target.value)
                          }
                          className={`w-full p-1 border-gray-200 focus:ring-1 focus:ring-primary 
                            ${rowIndex === 0 ? "font-medium bg-gray-50" : ""}`}
                        />
                      </td>
                    ))}

                    <td className="px-2 py-2 border text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(rowIndex)}
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
              onClick={handleAddRow}
              icon={Plus}
              variant="secondary"
              className="border border-gray-300 text-sm py-1">
              Adicionar Linha
            </CustomButton>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <CustomButton
          type="button"
          onClick={handleBack}
          variant="secondary"
          className="border border-gray-300"
          disabled={loading}>
          Cancelar
        </CustomButton>

        <CustomButton
          type="submit"
          variant="primary"
          icon={Save}
          disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Salvando..." : "Criando..."}
            </>
          ) : isEditing ? (
            "Salvar Tabela"
          ) : (
            "Criar Tabela"
          )}
        </CustomButton>
      </div>
    </form>
  );
};

export default TabelaForm;
