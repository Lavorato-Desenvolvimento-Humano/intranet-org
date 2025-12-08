"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  AlertCircle,
  Search,
  Info,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { DataTable } from "@/components/clinical/ui/DataTable";
import { Pagination } from "@/components/ui/pagination"; // Opcional se usar a do DataTable
import { especialidadeService } from "@/services/clinical";
import { EspecialidadeDto } from "@/types/clinical";
import toastUtil from "@/utils/toast";

export default function AdminEspecialidadesTab() {
  const router = useRouter();

  // Estados principais
  const [items, setItems] = useState<EspecialidadeDto[]>([]);
  const [filteredItems, setFilteredItems] = useState<EspecialidadeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtro
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  // Filtrar dados
  useEffect(() => {
    applyFilters();
  }, [items, showActiveOnly, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await especialidadeService.getAll();
      setItems(data);
    } catch (err: any) {
      console.error("Erro ao carregar especialidades:", err);
      setError("Erro ao carregar lista de especialidades");
      toastUtil.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    if (showActiveOnly) {
      filtered = filtered.filter((item) => item.ativo);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.nome.toLowerCase().includes(term) ||
          item.descricao?.toLowerCase().includes(term)
      );
    }

    // Ordenar alfabeticamente
    filtered.sort((a, b) => a.nome.localeCompare(b.nome));

    setFilteredItems(filtered);
    setCurrentPage(1); // Resetar para a primeira página ao filtrar
  };

  const handleToggleAtivo = async (id: string) => {
    try {
      await especialidadeService.toggleAtivo(id);
      toastUtil.success("Status alterado com sucesso!");
      loadData();
    } catch (err: any) {
      toastUtil.error("Erro ao alterar status da especialidade");
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Deseja excluir a especialidade "${nome}"?`)) {
      try {
        await especialidadeService.delete(id);
        toastUtil.success("Especialidade excluída!");
        loadData();
      } catch (err) {
        toastUtil.error("Erro ao excluir. Verifique se não há vínculos.");
      }
    }
  };

  // Correção do onPageChange: O DataTable emite o índice (0, 1, 2...), mas seu estado é 1-based (1, 2, 3...)
  const handlePageChange = (pageIndex: number) => {
    setCurrentPage(pageIndex + 1);
  };

  // Cálculo de Paginação no Cliente
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const columns = [
    {
      header: "Nome",
      accessor: "nome" as keyof EspecialidadeDto,
      className: "font-medium text-gray-900",
    },
    {
      header: "Descrição",
      accessor: "descricao" as keyof EspecialidadeDto,
      className: "max-w-xs truncate text-gray-500",
    },
    {
      header: "Ativo",
      accessor: ((item: EspecialidadeDto) => (
        <button
          onClick={() => handleToggleAtivo(item.id)}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
          title={item.ativo ? "Desativar" : "Ativar"}>
          {item.ativo ? (
            <ToggleRight className="h-5 w-5 text-green-500" />
          ) : (
            <ToggleLeft className="h-5 w-5 text-gray-400" />
          )}
        </button>
      )) as any,
      className: "text-center",
    },
    {
      header: "Ações",
      accessor: ((item: EspecialidadeDto) => (
        <div className="flex space-x-2">
          {/* Note: Você precisará criar estas páginas de edição depois */}
          <CustomButton
            variant="primary"
            size="small"
            onClick={() =>
              router.push(`/admin/especialidades/${item.id}/editar`)
            }
            title="Editar">
            <Edit className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => handleDelete(item.id, item.nome)}
            title="Excluir">
            <Trash2 className="h-4 w-4" />
          </CustomButton>
        </div>
      )) as any,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Stethoscope className="mr-2 h-5 w-5" />
            Gerenciamento de Especialidades
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Cadastre as especialidades médicas disponíveis no sistema
          </p>
        </div>
        <CustomButton
          variant="primary"
          onClick={() => router.push("/admin/especialidades/nova")}
          size="small">
          <Plus className="h-4 w-4 mr-2" />
          Nova Especialidade
        </CustomButton>
      </div>

      {/* Filtros */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar especialidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-gray-700">Apenas ativas</span>
            </label>
            <CustomButton variant="primary" onClick={loadData} size="small">
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </CustomButton>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando {currentItems.length} de {totalItems} registros
          </p>
        </div>
        <div className="p-4">
          {loading ? (
            <Loading message="Carregando especialidades..." />
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                data={{
                  content: currentItems,
                  totalElements: totalItems,
                  totalPages: totalPages,
                  size: itemsPerPage,
                  number: currentPage - 1, // API/DataTable espera base 0
                  numberOfElements: currentItems.length,
                  first: currentPage === 1,
                  last: currentPage === totalPages,
                }}
                columns={columns}
                onPageChange={handlePageChange} // Função implementada acima
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
