// src/app/historico-status/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  Filter,
  RefreshCw,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { Pagination } from "@/components/ui/pagination";
import { statusHistoryService } from "@/services/clinical";
import { StatusHistorySummaryDto, PageResponse } from "@/types/clinical";
import { formatDateTime } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

interface Filters {
  entityType: string;
  startDate: string;
  endDate: string;
}

// Componente interno que usa useSearchParams
function HistoricoContent() {
  const router = useRouter();

  const [historico, setHistorico] = useState<
    PageResponse<StatusHistorySummaryDto>
  >({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Estados de filtros
  const [filters, setFilters] = useState<Filters>({
    entityType: "",
    startDate: "",
    endDate: "",
  });

  // Carregar dados na inicialização e quando filtros/página mudarem
  useEffect(() => {
    loadHistorico();
  }, [currentPage, filters]);

  const loadHistorico = async () => {
    try {
      setLoading(true);
      setError(null);

      let historicoData: PageResponse<StatusHistorySummaryDto>;

      if (filters.startDate && filters.endDate) {
        historicoData = await statusHistoryService.getHistoricoByPeriodo(
          filters.startDate,
          filters.endDate,
          currentPage,
          20
        );
      } else {
        historicoData = await statusHistoryService.getAllHistorico(
          currentPage,
          20
        );
      }

      if (filters.entityType && (!filters.startDate || !filters.endDate)) {
        const filteredContent = historicoData.content.filter(
          (item) => item.entityType === filters.entityType
        );
        historicoData = {
          ...historicoData,
          content: filteredContent,
          numberOfElements: filteredContent.length,
        };
      }

      setHistorico(historicoData);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      setError("Erro ao carregar histórico de status");
      toastUtil.error("Erro ao carregar histórico de status");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(0); // Reset para primeira página ao filtrar
  };

  const clearFilters = () => {
    setFilters({
      entityType: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1); // Pagination component usa 1-based, backend usa 0-based
  };

  const exportData = async () => {
    try {
      toastUtil.info("Funcionalidade de exportação será implementada");
    } catch (err) {
      toastUtil.error("Erro ao exportar dados");
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType?.toUpperCase()) {
      case "GUIA":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "FICHA":
        return <User className="h-4 w-4 text-green-500" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType?.toUpperCase()) {
      case "GUIA":
        return "Guia";
      case "FICHA":
        return "Ficha";
      default:
        return entityType;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <History className="mr-3 h-8 w-8 text-blue-600" />
              Histórico de Status
            </h1>
            <p className="text-gray-600 mt-2">
              Acompanhe todas as mudanças de status de guias e fichas
            </p>
          </div>

          <div className="flex space-x-3">
            <CustomButton
              variant="primary"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {showFilters ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </CustomButton>

            <CustomButton variant="primary" onClick={loadHistorico}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </CustomButton>

            <CustomButton variant="primary" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </CustomButton>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Entidade
                </label>
                <select
                  value={filters.entityType}
                  onChange={(e) =>
                    handleFilterChange("entityType", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Todos</option>
                  <option value="GUIA">Guias</option>
                  <option value="FICHA">Fichas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <CustomButton
                  variant="primary"
                  onClick={clearFilters}
                  className="w-full">
                  Limpar Filtros
                </CustomButton>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Stats Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Total de registros encontrados
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {historico.totalElements}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Página {currentPage + 1} de {historico.totalPages || 1}
                </p>
                <p className="text-sm text-gray-600">
                  {historico.numberOfElements} registros nesta página
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <Loading message="Carregando histórico..." />
            ) : error ? (
              <div className="text-center py-8">
                <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Erro ao carregar dados
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <CustomButton variant="primary" onClick={loadHistorico}>
                  Tentar Novamente
                </CustomButton>
              </div>
            ) : historico.content.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum registro encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Não foram encontrados registros de histórico com os filtros
                  aplicados.
                </p>
                <CustomButton variant="primary" onClick={clearFilters}>
                  Limpar Filtros
                </CustomButton>
              </div>
            ) : (
              <>
                {/* Lista de registros */}
                <div className="space-y-4">
                  {historico.content.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-1">
                          {/* Tipo e Data */}
                          <div className="sm:col-span-1">
                            <div className="flex items-center mb-2">
                              {getEntityIcon(item.entityType)}
                              <span className="ml-2 text-sm font-medium text-gray-700">
                                {getEntityTypeLabel(item.entityType)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDateTime(item.dataAlteracao)}
                            </div>
                          </div>

                          {/* ID da Entidade */}
                          <div className="sm:col-span-1">
                            <div className="text-sm text-gray-600">
                              ID da Entidade
                            </div>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {item.entityId.toString().substring(0, 8)}...
                            </code>
                          </div>

                          {/* Mudança de Status */}
                          <div className="sm:col-span-1">
                            <div className="flex items-center space-x-2">
                              {item.statusAnterior ? (
                                <StatusBadge
                                  status={item.statusAnterior}
                                  size="xs"
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                              <span className="text-gray-400">→</span>
                              <StatusBadge status={item.statusNovo} size="xs" />
                            </div>
                          </div>

                          {/* Usuário */}
                          <div className="sm:col-span-1">
                            <div className="text-sm text-gray-900">
                              {item.alteradoPorNome}
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="mt-3 sm:mt-0 sm:ml-4">
                          <CustomButton
                            variant="primary"
                            size="small"
                            onClick={() =>
                              router.push(`/historico-status/${item.id}`)
                            }
                            title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </CustomButton>
                        </div>
                      </div>

                      {/* Motivo (se existir) */}
                      {item.motivo && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Motivo:</span>{" "}
                            {item.motivo}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {historico.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage + 1}
                      totalPages={historico.totalPages}
                      onPageChange={handlePageChange}
                      totalItems={historico.totalElements}
                      pageSize={historico.size}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Componente principal com Suspense
export default function HistoricoStatusPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto p-6">
              <Loading message="Carregando página..." />
            </main>
          </div>
        }>
        <HistoricoContent />
      </Suspense>
    </ProtectedRoute>
  );
}
