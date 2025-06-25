// src/components/admin/AdminStatusTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Filter,
  RefreshCw,
  AlertCircle,
  Search,
  Info,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { DataTable } from "@/components/clinical/ui/DataTable";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { Pagination } from "@/components/ui/pagination";
import { statusService } from "@/services/clinical";
import { StatusDto } from "@/types/clinical";
import toastUtil from "@/utils/toast";

export default function AdminStatusTab() {
  const router = useRouter();

  // Estados principais
  const [statuses, setStatuses] = useState<StatusDto[]>([]);
  const [filteredStatuses, setFilteredStatuses] = useState<StatusDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtro
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Carregar dados iniciais
  useEffect(() => {
    loadStatuses();
  }, []);

  // Aplicar filtros quando os dados ou filtros mudarem
  useEffect(() => {
    applyFilters();
  }, [statuses, showActiveOnly, searchTerm]);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      setError(null);

      const statusesData = await statusService.getAllStatuses();
      setStatuses(statusesData);
    } catch (err: any) {
      console.error("Erro ao carregar status:", err);
      setError("Erro ao carregar lista de status");
      toastUtil.error("Erro ao carregar status");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...statuses];

    // Filtrar por status ativo
    if (showActiveOnly) {
      filtered = filtered.filter((status) => status.ativo);
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (status) =>
          status.status.toLowerCase().includes(term) ||
          status.descricao?.toLowerCase().includes(term)
      );
    }

    // Ordenar por ordem de exibição e depois por nome
    filtered.sort((a, b) => {
      if (a.ordemExibicao && b.ordemExibicao) {
        return a.ordemExibicao - b.ordemExibicao;
      }
      if (a.ordemExibicao && !b.ordemExibicao) return -1;
      if (!a.ordemExibicao && b.ordemExibicao) return 1;
      return a.status.localeCompare(b.status);
    });

    setFilteredStatuses(filtered);
    setCurrentPage(1); // Reset para primeira página ao filtrar
  };

  const handleToggleAtivo = async (id: string) => {
    try {
      await statusService.toggleStatusAtivo(id);
      toastUtil.success("Status alterado com sucesso!");
      loadStatuses(); // Recarregar a lista
    } catch (err: any) {
      console.error("Erro ao alterar status:", err);
      toastUtil.error(err.response?.data?.message || "Erro ao alterar status");
    }
  };

  const handleDeleteStatus = async (id: string, statusName: string) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir o status "${statusName}"?\n\nEsta ação não pode ser desfeita e pode afetar outros registros no sistema.`
    );

    if (confirmacao) {
      try {
        await statusService.deleteStatus(id);
        toastUtil.success("Status excluído com sucesso!");
        loadStatuses(); // Recarregar a lista
      } catch (err: any) {
        console.error("Erro ao excluir status:", err);
        toastUtil.error(
          err.response?.data?.message || "Erro ao excluir status"
        );
      }
    }
  };

  const initializeDefaultStatuses = async () => {
    const confirmacao = window.confirm(
      "Deseja inicializar os status padrão do sistema?\n\nEsta ação irá criar os status básicos necessários para o funcionamento do sistema."
    );

    if (confirmacao) {
      try {
        await statusService.initializeDefaultStatuses();
        toastUtil.success("Status padrão inicializados com sucesso!");
        loadStatuses();
      } catch (err: any) {
        console.error("Erro ao inicializar status:", err);
        toastUtil.error(
          err.response?.data?.message || "Erro ao inicializar status"
        );
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setShowActiveOnly(false);
    setCurrentPage(1);
  };

  // Calcular dados para paginação
  const totalItems = filteredStatuses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredStatuses.slice(startIndex, endIndex);

  // Colunas para a tabela
  const columns = [
    {
      header: "Status",
      accessor: ((status: StatusDto) => (
        <div className="flex items-center">
          <StatusBadge status={status.status} size="sm" />
        </div>
      )) as any,
    },
    {
      header: "Descrição",
      accessor: ((status: StatusDto) => (
        <div className="max-w-xs">
          <p className="truncate" title={status.descricao}>
            {status.descricao || "-"}
          </p>
        </div>
      )) as any,
    },
    {
      header: "Ordem",
      accessor: "ordemExibicao" as keyof StatusDto,
      className: "text-center",
    },
    {
      header: "Ativo",
      accessor: ((status: StatusDto) => (
        <button
          onClick={() => handleToggleAtivo(status.id)}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
          title={status.ativo ? "Desativar status" : "Ativar status"}>
          {status.ativo ? (
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
      accessor: ((status: StatusDto) => (
        <div className="flex space-x-1">
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/admin/status/${status.id}`)}
            title="Ver detalhes">
            <Eye className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/admin/status/${status.id}/editar`)}
            title="Editar status">
            <Edit className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => handleDeleteStatus(status.id, status.status)}
            title="Excluir status">
            <Trash2 className="h-4 w-4" />
          </CustomButton>
        </div>
      )) as any,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header com ações principais */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Gerenciamento de Status
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure os status utilizados no sistema para guias e fichas
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <CustomButton
            variant="primary"
            onClick={initializeDefaultStatuses}
            size="small"
            title="Inicializar status padrão do sistema">
            <Settings className="h-4 w-4 mr-2" />
            Inicializar Padrões
          </CustomButton>
          <CustomButton
            variant="primary"
            onClick={() => router.push("/admin/status/novo")}
            size="small">
            <Plus className="h-4 w-4 mr-2" />
            Novo Status
          </CustomButton>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700">Apenas ativos</span>
            </label>

            <CustomButton
              variant="primary"
              onClick={loadStatuses}
              size="small"
              className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </CustomButton>

            {(searchTerm || showActiveOnly) && (
              <CustomButton
                variant="primary"
                onClick={clearFilters}
                size="small">
                Limpar
              </CustomButton>
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Total de Status</p>
                <p className="text-xl font-bold text-blue-800">
                  {statuses.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <ToggleRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Status Ativos</p>
                <p className="text-xl font-bold text-green-800">
                  {statuses.filter((s) => s.ativo).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                <ToggleLeft className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status Inativos</p>
                <p className="text-xl font-bold text-gray-800">
                  {statuses.filter((s) => !s.ativo).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Mostrando {currentItems.length} de {totalItems} registros
              </p>
            </div>
            {totalPages > 1 && (
              <div className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <Loading message="Carregando status..." />
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Erro ao carregar dados
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <CustomButton variant="primary" onClick={loadStatuses}>
                Tentar Novamente
              </CustomButton>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statuses.length === 0
                  ? "Nenhum status cadastrado"
                  : "Nenhum status encontrado"}
              </h3>
              <p className="text-gray-600 mb-6">
                {statuses.length === 0
                  ? "Comece criando um novo status ou inicialize os status padrão."
                  : "Tente ajustar os filtros para encontrar o que procura."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {statuses.length === 0 && (
                  <CustomButton
                    variant="primary"
                    onClick={initializeDefaultStatuses}>
                    <Settings className="h-4 w-4 mr-2" />
                    Inicializar Status Padrão
                  </CustomButton>
                )}
                <CustomButton
                  variant="primary"
                  onClick={() => router.push("/admin/status/novo")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Status
                </CustomButton>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <DataTable
                  data={{
                    content: currentItems,
                    totalElements: totalItems,
                    totalPages: totalPages,
                    size: itemsPerPage,
                    number: currentPage - 1,
                    numberOfElements: currentItems.length,
                    first: currentPage === 1,
                    last: currentPage === totalPages,
                  }}
                  columns={columns}
                  loading={false}
                  onPageChange={(page) => setCurrentPage(page + 1)}
                />
              </div>

              {/* Desabilitar a paginação do DataTable */}
              {/* {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    pageSize={itemsPerPage}
                  />
                </div>
              )} */}
            </>
          )}
        </div>
      </div>

      {/* Informações de ajuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
          <Info className="mr-2 h-4 w-4" />
          Sobre o Gerenciamento de Status
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            • <strong>Status Ativos:</strong> Aparecem nas opções de seleção em
            formulários
          </p>
          <p>
            • <strong>Status Inativos:</strong> Não aparecem nas opções, mas
            mantêm dados existentes
          </p>
          <p>
            • <strong>Ordem de Exibição:</strong> Define a posição nas listas
            (números menores primeiro)
          </p>
          <p>
            • <strong>Exclusão:</strong> Só é possível excluir status que não
            estão sendo utilizados
          </p>
        </div>
      </div>
    </div>
  );
}
