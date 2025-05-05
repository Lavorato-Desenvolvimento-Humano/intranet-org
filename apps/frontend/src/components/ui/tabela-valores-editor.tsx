// apps/frontend/src/components/ui/tabela-valores-editor.tsx
import React, { useState, useEffect } from "react";
import { Plus, Trash } from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";

// Estrutura para cada linha da tabela
interface ValorRow {
  id: string; // ID único para manipulação
  especialidade: string;
  codigoProcedimento: string; // Novo campo
  valor: string;
  observacao: string;
}

interface TabelaValoresEditorProps {
  value: string; // JSON string dos valores
  onChange: (value: string) => void; // Função para atualizar o JSON
  disabled?: boolean;
  error?: string;
}

const TabelaValoresEditor: React.FC<TabelaValoresEditorProps> = ({
  value,
  onChange,
  disabled = false,
  error,
}) => {
  // Estado interno das linhas da tabela
  const [rows, setRows] = useState<ValorRow[]>([]);

  // Inicializa as linhas ao carregar o JSON
  useEffect(() => {
    try {
      // Se houver um valor JSON, tenta convertê-lo para as linhas
      if (value) {
        const parsedData = JSON.parse(value);

        // Verifica se é um array
        if (Array.isArray(parsedData)) {
          // Se as linhas já têm os campos esperados, use-as
          if (
            parsedData.length > 0 &&
            ("especialidade" in parsedData[0] ||
              "valor" in parsedData[0] ||
              "observacao" in parsedData[0])
          ) {
            setRows(
              parsedData.map((item, index) => ({
                id: `row-${index}-${Date.now()}`,
                especialidade: item.especialidade || "",
                codigoProcedimento: item.codigoProcedimento || "", // Novo campo
                valor: item.valor || "",
                observacao: item.observacao || "",
              }))
            );
          } else {
            // Se não tem o formato esperado, tente adaptar
            setRows(
              parsedData.map((item, index) => {
                // Tente extrair os valores de alguma maneira
                const entries = Object.entries(item);
                return {
                  id: `row-${index}-${Date.now()}`,
                  especialidade: entries[0]?.[1]?.toString() || "",
                  codigoProcedimento: "", // Valor padrão para o novo campo
                  valor: entries[1]?.[1]?.toString() || "",
                  observacao: entries[2]?.[1]?.toString() || "",
                };
              })
            );
          }
        } else {
          // Se não for um array, inicializa com uma linha vazia
          addNewRow();
        }
      } else {
        // Se não houver valor, inicializa com uma linha vazia
        addNewRow();
      }
    } catch (e) {
      console.error("Erro ao processar JSON da tabela:", e);
      // Se houver erro, inicializa com uma linha vazia
      addNewRow();
    }
  }, []);

  // Atualiza o JSON quando as linhas forem alteradas
  useEffect(() => {
    // Se não há linhas ainda, não faça nada
    if (rows.length === 0) return;

    // Converte as linhas para o formato JSON esperado
    const jsonData = rows.map(
      ({ especialidade, codigoProcedimento, valor, observacao }) => ({
        especialidade,
        codigoProcedimento,
        valor,
        observacao,
      })
    );

    // Notifica a mudança através da função onChange
    onChange(JSON.stringify(jsonData));
  }, [rows, onChange]);

  // Adiciona uma nova linha
  const addNewRow = () => {
    setRows((prevRows) => [
      ...prevRows,
      {
        id: `row-${prevRows.length}-${Date.now()}`,
        especialidade: "",
        codigoProcedimento: "",
        valor: "",
        observacao: "",
      },
    ]);
  };

  // Remove uma linha
  const removeRow = (id: string) => {
    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
  };

  // Atualiza uma célula específica
  const updateCell = (id: string, field: keyof ValorRow, value: string) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Previne que a última linha seja removida
  const canRemove = rows.length > 1;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Especialidade
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Código Procedimento
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Observação
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="text"
                  value={row.especialidade}
                  onChange={(e) =>
                    updateCell(row.id, "especialidade", e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Especialidade"
                  disabled={disabled}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="text"
                  value={row.codigoProcedimento}
                  onChange={(e) =>
                    updateCell(row.id, "codigoProcedimento", e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Código Procedimento"
                  disabled={disabled}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="text"
                  value={row.valor}
                  onChange={(e) => updateCell(row.id, "valor", e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="R$ 0,00"
                  disabled={disabled}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="text"
                  value={row.observacao}
                  onChange={(e) =>
                    updateCell(row.id, "observacao", e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Observação"
                  disabled={disabled}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Remover linha"
                    disabled={disabled}>
                    <Trash size={18} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4">
        <CustomButton
          type="button"
          variant="primary"
          icon={Plus}
          onClick={addNewRow}
          disabled={disabled}>
          Adicionar Linha
        </CustomButton>
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default TabelaValoresEditor;
