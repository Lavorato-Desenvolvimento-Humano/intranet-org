// src/components/postagens/TabelaVisualizacao.tsx
import React from "react";
import { TabelaPostagem } from "@/services/postagem";

interface TabelaVisualizacaoProps {
  tabela: TabelaPostagem;
}

const TabelaVisualizacao: React.FC<TabelaVisualizacaoProps> = ({ tabela }) => {
  // Verifica se o conteúdo da tabela é um array de arrays (formato padrão para tabelas)
  const isValidTable = (content: any): boolean => {
    return (
      Array.isArray(content) &&
      content.every((row) => Array.isArray(row)) &&
      content.length > 0
    );
  };

  // Renderiza uma tabela padrão a partir dos dados
  const renderTabela = () => {
    if (!tabela.conteudo || !isValidTable(tabela.conteudo)) {
      return (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="text-red-500">Formato de tabela inválido</p>
        </div>
      );
    }

    const rows = tabela.conteudo;
    const hasHeader = rows.length > 0;

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          {hasHeader && (
            <thead className="bg-gray-50">
              <tr>
                {rows[0].map((cell: any, index: number) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {cell?.toString() || ""}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.slice(1).map((row: any[], rowIndex: number) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {row.map((cell: any, cellIndex: number) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cell?.toString() || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return <div className="my-4">{renderTabela()}</div>;
};

export default TabelaVisualizacao;
