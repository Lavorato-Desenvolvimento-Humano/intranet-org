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
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { statusHistoryService } from "@/services/clinical";
import { StatusHistorySummaryDto } from "@/types/clinical";
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

  // Estados principais - lista simples sem paginação
  const [historico, setHistorico] = useState<StatusHistorySummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Estados de filtros simplificados
  const [filters, setFilters] = useState<Filters>({
    entityType: "",
    startDate: "",
    endDate: "",
  });

  // Estados para exibição
  const [displayedItems, setDisplayedItems] = useState<
    StatusHistorySummaryDto[]
  >([]);
  const [itemsToShow, setItemsToShow] = useState(20);

  // Carregar dados na inicialização
  useEffect(() => {
    loadHistorico();
  }, []);

  // Aplicar filtros localmente
  useEffect(() => {
    let filtered = [...historico];

    if (filters.entityType) {
      filtered = filtered.filter(
        (item) => item.entityType === filters.entityType
      );
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(
        (item) => new Date(item.dataAlteracao) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Fim do dia
      filtered = filtered.filter(
        (item) => new Date(item.dataAlteracao) <= endDate
      );
    }

    setDisplayedItems(filtered.slice(0, itemsToShow));
  }, [historico, filters, itemsToShow]);

  const loadHistorico = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar uma quantidade maior para filtrar localmente
      const historicoData = await statusHistoryService.getAllHistorico(0, 100);
      setHistorico(historicoData.content);
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
    setItemsToShow(20); // Reset para mostrar apenas os primeiros 20
  };

  const clearFilters = () => {
    setFilters({
      entityType: "",
      startDate: "",
      endDate: "",
    });
    setItemsToShow(20);
  };

  const loadMore = () => {
    setItemsToShow((prev) => prev + 20);
  };

  const exportData = async () => {
    try {
      toastUtil.info("Funcionalidade de exportação será implementada");
    } catch (err) {
      toastUtil.error("Erro ao exportar dados");
    }
  };

  const hasMoreItems =
    displayedItems.length < historico.length &&
    (filters.entityType || filters.startDate || filters.endDate
      ? displayedItems.length <
        historico.filter((item) => {
          let matches = true;
          if (filters.entityType && item.entityType !== filters.entityType)
            matches = false;
          if (
            filters.startDate &&
            new Date(item.dataAlteracao) < new Date(filters.startDate)
          )
            matches = false;
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            if (new Date(item.dataAlteracao) > endDate) matches = false;
          }
          return matches;
        }).length
      : displayedItems.length < historico.length);

  return (
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

        {/* Filtros Simplificados */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
              <CustomButton
                variant="primary"
                size="small"
                onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </CustomButton>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </div>
          )}
        </div>

        {/* Tabela Simplificada */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Histórico de Mudanças
              </h3>
              <div className="text-sm text-gray-600">
                Mostrando {displayedItems.length} de {historico.length}{" "}
                registros
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Loading message="Carregando histórico..." />
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum registro encontrado</p>
                {(filters.entityType ||
                  filters.startDate ||
                  filters.endDate) && (
                  <p className="text-sm text-gray-400 mt-1">
                    Tente ajustar os filtros
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Lista de Cards (mais responsiva que tabela) */}
                <div className="space-y-4">
                  {displayedItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-6 sm:gap-4">
                          {/* Data/Hora */}
                          <div className="sm:col-span-1">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDateTime(item.dataAlteracao)}
                            </div>
                          </div>

                          {/* Tipo */}
                          <div className="sm:col-span-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                item.entityType === "FICHA"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                              {item.entityType}
                            </span>
                          </div>

                          {/* Entidade */}
                          <div className="sm:col-span-1">
                            <div className="text-sm font-medium text-gray-900">
                              {item.entityDescricao || "N/A"}
                            </div>
                            <code className="text-xs text-gray-500">
                              {item.entityId.substring(0, 8)}...
                            </code>
                          </div>

                          {/* Status */}
                          <div className="sm:col-span-2 flex items-center space-x-2">
                            {item.statusAnterior ? (
                              <StatusBadge status={item.statusAnterior} />
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                            <span className="text-gray-400">→</span>
                            <StatusBadge status={item.statusNovo} />
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

                {/* Botão Carregar Mais */}
                {hasMoreItems && (
                  <div className="text-center mt-6 pt-6 border-t border-gray-200">
                    <CustomButton variant="primary" onClick={loadMore}>
                      Carregar Mais Registros
                    </CustomButton>
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
