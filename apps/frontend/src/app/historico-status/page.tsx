// src/app/historico-status/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  History,
  Filter,
  Search,
  Calendar,
  User,
  Clock,
  RefreshCw,
  Download,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { statusHistoryService } from "@/services/clinical";
import { StatusHistorySummaryDto, PageResponse } from "@/types/clinical";
import { formatDateTime } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

interface Filters {
  entityType: string;
  entityId: string;
  userId: string;
  startDate: string;
  endDate: string;
}

export default function HistoricoStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados principais
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
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Estados de filtros
  const [filters, setFilters] = useState<Filters>({
    entityType: searchParams.get("entityType") || "",
    entityId: searchParams.get("entityId") || "",
    userId: "",
    startDate: "",
    endDate: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Carregar dados
  useEffect(() => {
    loadHistorico();
  }, [currentPage, pageSize, filters]);

  const loadHistorico = async () => {
    try {
      setLoading(true);
      setError(null);

      let historicoData: PageResponse<StatusHistorySummaryDto>;

      if (filters.entityType && filters.entityId) {
        // Filtrar por entidade específica
        historicoData = await statusHistoryService.getHistoricoByEntity(
          filters.entityType,
          filters.entityId,
          currentPage,
          pageSize
        );
      } else if (filters.userId) {
        // Filtrar por usuário
        historicoData = await statusHistoryService.getHistoricoByUser(
          filters.userId,
          currentPage,
          pageSize
        );
      } else if (filters.startDate && filters.endDate) {
        // Filtrar por período
        historicoData = await statusHistoryService.getHistoricoByPeriodo(
          filters.startDate,
          filters.endDate,
          currentPage,
          pageSize
        );
      } else {
        // Buscar todo o histórico
        historicoData = await statusHistoryService.getAllHistorico(
          currentPage,
          pageSize
        );
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
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setFilters({
      entityType: "",
      entityId: "",
      userId: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const exportData = async () => {
    try {
      toastUtil.info("Funcionalidade de exportação será implementada");
    } catch (err) {
      toastUtil.error("Erro ao exportar dados");
    }
  };

  if (loading && historico.content.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando histórico de status..." />
        </main>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <History className="mr-2 h-6 w-6" />
                Histórico de Status
              </h1>
              <p className="text-gray-600 mt-1">
                Acompanhe todas as mudanças de status das entidades
              </p>
            </div>

            <div className="flex space-x-3">
              <CustomButton
                variant="primary"
                onClick={exportData}
                title="Exportar dados">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </CustomButton>

              <CustomButton variant="primary" onClick={loadHistorico}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </CustomButton>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
                <CustomButton
                  variant="primary"
                  size="small"
                  onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="mr-2 h-4 w-4" />
                  {showFilters ? "Ocultar" : "Mostrar"} Filtros
                </CustomButton>
              </div>
            </div>

            {showFilters && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Tipo de Entidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Entidade
                    </label>
                    <select
                      value={filters.entityType}
                      onChange={(e) =>
                        handleFilterChange("entityType", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Todos os tipos</option>
                      <option value="FICHA">Ficha</option>
                      <option value="GUIA">Guia</option>
                    </select>
                  </div>

                  {/* Data Início */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        handleFilterChange("startDate", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Data Fim */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) =>
                        handleFilterChange("endDate", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <CustomButton variant="primary" onClick={clearFilters}>
                    Limpar Filtros
                  </CustomButton>
                  <CustomButton variant="primary" onClick={loadHistorico}>
                    Aplicar Filtros
                  </CustomButton>
                </div>
              </div>
            )}
          </div>

          {/* Tabela de Histórico Customizada */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Histórico de Mudanças
                </h3>
                <div className="text-sm text-gray-600">
                  Total: {historico.totalElements} registros
                </div>
              </div>

              {/* Tabela Manual (não usar DataTable) */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status Anterior
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status Novo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Motivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center">
                          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                        </td>
                      </tr>
                    ) : historico.content.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-8 text-center text-gray-500">
                          Nenhum registro encontrado
                        </td>
                      </tr>
                    ) : (
                      historico.content.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(item.dataAlteracao)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                item.entityType === "FICHA"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                              {item.entityType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="font-medium text-gray-900">
                              {item.entityDescricao || "N/A"}
                            </div>
                            <code className="text-xs text-gray-500">
                              {item.entityId.substring(0, 8)}...
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.statusAnterior ? (
                              <StatusBadge status={item.statusAnterior} />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={item.statusNovo} />
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className="max-w-48 truncate text-sm text-gray-900"
                              title={item.motivo}>
                              {item.motivo || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.alteradoPorNome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <CustomButton
                              variant="primary"
                              size="small"
                              onClick={() =>
                                router.push(`/historico-status/${item.id}`)
                              }
                              title="Ver detalhes">
                              <Eye className="h-4 w-4" />
                            </CustomButton>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginação Manual */}
              {historico.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      Anterior
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === historico.totalPages - 1}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      Próximo
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando{" "}
                        <span className="font-medium">
                          {currentPage * pageSize + 1}
                        </span>{" "}
                        até{" "}
                        <span className="font-medium">
                          {Math.min(
                            (currentPage + 1) * pageSize,
                            historico.totalElements
                          )}
                        </span>{" "}
                        de{" "}
                        <span className="font-medium">
                          {historico.totalElements}
                        </span>{" "}
                        resultados
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                          <ChevronLeft className="h-5 w-5" />
                        </button>

                        {/* Números das páginas */}
                        {Array.from(
                          { length: Math.min(5, historico.totalPages) },
                          (_, i) => {
                            const page = i + Math.max(0, currentPage - 2);
                            if (page >= historico.totalPages) return null;

                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === currentPage
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                }`}>
                                {page + 1}
                              </button>
                            );
                          }
                        )}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === historico.totalPages - 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
