// src/components/ui/data-table.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash,
  Plus,
} from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  title?: string;
  searchable?: boolean;
  searchKeys?: string[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onAdd?: () => void;
  canAdd?: boolean;
  canEdit?: (item: T) => boolean;
  canDelete?: (item: T) => boolean;
  showHeader?: boolean;
  maxHeight?: string; // Nova prop para altura máxima
  enableScrolling?: boolean; // Nova prop para habilitar rolagem
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  title,
  searchable = false,
  searchKeys = [],
  onRowClick,
  isLoading = false,
  emptyMessage = "Nenhum dado encontrado",
  showActions = false,
  onEdit,
  onDelete,
  onAdd,
  canAdd = true,
  canEdit,
  canDelete,
  showHeader = true,
  maxHeight = "600px", // Altura padrão
  enableScrolling = true, // Habilitado por padrão
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState<T[]>(data);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Atualizar dados filtrados quando os dados originais ou o termo de pesquisa mudar
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(data);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = data.filter((item: any) => {
      // Se não há searchKeys definidas, pesquisar em todas as chaves
      if (searchKeys.length === 0) {
        return Object.keys(item).some((key) =>
          String(item[key]).toLowerCase().includes(searchTermLower)
        );
      }

      // Pesquisar apenas nas chaves especificadas
      return searchKeys.some((key) => {
        const nestedKeys = key.split(".");
        let value = item;
        for (const nestedKey of nestedKeys) {
          if (value === undefined || value === null) return false;
          value = value[nestedKey];
        }
        return String(value).toLowerCase().includes(searchTermLower);
      });
    });

    setFilteredData(filtered);
  }, [data, searchTerm, searchKeys]);

  // Ordenar dados
  useEffect(() => {
    if (sortConfig === null) return;

    const sorted = [...filteredData].sort((a: any, b: any) => {
      const aValue = String(a[sortConfig.key]);
      const bValue = String(b[sortConfig.key]);

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredData(sorted);
  }, [sortConfig]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";

    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }

    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Cabeçalho da tabela com título e pesquisa */}
      {showHeader && (
        <div className="p-4 border-b flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center">
            {title && (
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            )}
            {canAdd && onAdd && (
              <button
                onClick={onAdd}
                className="ml-4 flex items-center text-sm font-medium text-primary hover:text-primary-dark">
                <Plus size={16} className="mr-1" />
                Adicionar
              </button>
            )}
          </div>

          {searchable && (
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          )}
        </div>
      )}

      {/* Container da tabela com rolagem condicional */}
      <div
        className={`overflow-x-auto ${enableScrolling ? "overflow-y-auto" : ""}`}
        style={enableScrolling ? { maxHeight } : undefined}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? "cursor-pointer select-none" : ""
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}>
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable &&
                      sortConfig &&
                      sortConfig.key === column.key && (
                        <span className="ml-1">
                          {sortConfig.direction === "asc" ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </span>
                      )}
                  </div>
                </th>
              ))}
              {showActions && (onEdit || onDelete) && (
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="px-6 py-16 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-middle"></div>
                  <p className="mt-2 text-gray-600">Carregando dados...</p>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="px-6 py-16 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr
                  key={keyExtractor(item)}
                  className={`${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
                  onClick={() => onRowClick && onRowClick(item)}>
                  {columns.map((column) => (
                    <td
                      key={`${keyExtractor(item)}-${column.key}`}
                      className="px-6 py-4 whitespace-nowrap">
                      {column.render
                        ? column.render(
                            item[column.key as keyof T],
                            item,
                            index
                          )
                        : String(item[column.key as keyof T] || "")}
                    </td>
                  ))}
                  {showActions && (onEdit || onDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {onEdit && (canEdit ? canEdit(item) : true) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(item);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar">
                            <Edit size={18} />
                          </button>
                        )}
                        {onDelete && (canDelete ? canDelete(item) : true) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir">
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
