"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Download,
  Share2,
  Trash2,
  FileBarChart,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  BarChart3,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { DataTable } from "@/components/clinical/ui/DataTable";
import { SearchInput } from "@/components/clinical/ui/SearchInput";
import { FilterDropdown } from "@/components/clinical/ui/FilterDropdown";
import relatorioService from "@/services/relatorio";
import { useAuth } from "@/context/AuthContext";
import {
  RelatorioSummaryDto,
  RelatorioPageResponse,
  StatusRelatorioEnum,
  RelatorioFilterRequest,
} from "@/types/relatorio";
import { formatDate, formatDateTime } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";
import { Pagination } from "@/components/ui/pagination";

// Componente para badge de status
const StatusBadge = ({ status }: { status: StatusRelatorioEnum }) => {
  const getStatusConfig = (status: StatusRelatorioEnum) => {
    switch (status) {
      case StatusRelatorioEnum.CONCLUIDO:
        return { label: "Concluído", className: "bg-green-100 text-green-800" };
      case StatusRelatorioEnum.PROCESSANDO:
        return {
          label: "Processando",
          className: "bg-yellow-100 text-yellow-800",
        };
      case StatusRelatorioEnum.ERRO:
        return { label: "Erro", className: "bg-red-100 text-red-800" };
      case StatusRelatorioEnum.CANCELADO:
        return { label: "Cancelado", className: "bg-gray-100 text-gray-800" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-800" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
};

export default function RelatoriosPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Estados principais
  const [relatorios, setRelatorios] = useState<RelatorioPageResponse>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTipoEntidade, setSelectedTipoEntidade] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  // Lista de status disponíveis
  const statusOptions = Object.values(StatusRelatorioEnum).map((status) => ({
    value: status,
    label: status
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  // Lista de tipos de entidade
  const tipoEntidadeOptions = [
    { value: "TODOS", label: "Todos" },
    { value: "GUIA", label: "Guias" },
    { value: "FICHA", label: "Fichas" },
    { value: "PACIENTE", label: "Pacientes" },
  ];

  // Carregar dados iniciais
  useEffect(() => {
    loadRelatorios();
  }, [currentPage, selectedStatus, selectedTipoEntidade]);

  // Busca com debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== "") {
        searchRelatorios();
      } else {
        loadRelatorios();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadRelatorios = async () => {
    try {
      setLoading(true);

      let relatoriosData: RelatorioPageResponse;

      // Aplicar filtros se necessário
      if (selectedStatus || selectedTipoEntidade) {
        const filters: RelatorioFilterRequest = {};

        if (selectedStatus) {
          filters.statusRelatorio = selectedStatus as StatusRelatorioEnum;
        }

        if (selectedTipoEntidade) {
          filters.tipoEntidade = selectedTipoEntidade;
        }

        relatoriosData = await relatorioService.buscarRelatorios(
          filters,
          currentPage,
          20
        );
      } else {
        // Verificar se usuário pode ver todos os relatórios (admin/supervisor)
        const isAdminOrSupervisor = user?.roles?.some((role) =>
          ["ADMIN", "SUPERVISOR"].includes(role)
        );

        if (isAdminOrSupervisor) {
          relatoriosData = await relatorioService.getAllRelatorios(
            currentPage,
            20
          );
        } else {
          relatoriosData = await relatorioService.getMeusRelatorios(
            currentPage,
            20
          );
        }
      }

      setRelatorios(relatoriosData);
    } catch (error: any) {
      console.error("Erro ao carregar relatórios:", error);
      toastUtil.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  };

  const searchRelatorios = async () => {
    try {
      setLoading(true);

      const filters: RelatorioFilterRequest = {
        titulo: searchTerm,
      };

      if (selectedStatus) {
        filters.statusRelatorio = selectedStatus as StatusRelatorioEnum;
      }

      if (selectedTipoEntidade) {
        filters.tipoEntidade = selectedTipoEntidade;
      }

      const relatoriosData = await relatorioService.buscarRelatorios(
        filters,
        currentPage,
        20
      );
      setRelatorios(relatoriosData);
    } catch (error: any) {
      console.error("Erro ao pesquisar relatórios:", error);
      toastUtil.error("Erro ao pesquisar relatórios");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRelatorios();
    setRefreshing(false);
    toastUtil.success("Lista atualizada!");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1);
  };

  const handleDeleteRelatorio = async (id: string) => {
    const confirmacao = window.confirm(
      "Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita."
    );

    if (confirmacao) {
      try {
        await relatorioService.excluirRelatorio(id);
        toastUtil.success("Relatório excluído com sucesso!");
        await loadRelatorios();
      } catch (error: any) {
        toastUtil.error(
          error.response?.data?.message || "Erro ao excluir relatório"
        );
      }
    }
  };

  const handleDownloadPDF = async (relatorio: RelatorioSummaryDto) => {
    try {
      if (relatorio.statusRelatorio !== StatusRelatorioEnum.CONCLUIDO) {
        toastUtil.warning("Relatório ainda está sendo processado");
        return;
      }

      const blob = await relatorioService.baixarRelatorioPDF(relatorio.id);
      const filename = `relatorio-${relatorio.titulo.replace(/[^a-zA-Z0-9]/g, "-")}-${formatDate(relatorio.createdAt)}.pdf`;
      relatorioService.downloadFile(blob, filename);
      toastUtil.success("Download iniciado!");
    } catch (error: any) {
      toastUtil.error("Erro ao baixar relatório");
    }
  };

  // Definir colunas da tabela
  const columns = [
    {
      header: "Título",
      accessor: "titulo" as keyof RelatorioSummaryDto,
      className: "font-medium text-blue-600 hover:text-blue-800 cursor-pointer",
      onClick: (relatorio: RelatorioSummaryDto) =>
        router.push(`/relatorios/${relatorio.id}`),
    },
    {
      header: "Criado por",
      accessor: "usuarioGeradorNome" as keyof RelatorioSummaryDto,
    },
    {
      header: "Período",
      accessor: ((relatorio: RelatorioSummaryDto) =>
        `${formatDate(relatorio.periodoInicio)} - ${formatDate(relatorio.periodoFim)}`) as any,
    },
    {
      header: "Registros",
      accessor: "totalRegistros" as keyof RelatorioSummaryDto,
      className: "text-center",
    },
    {
      header: "Status",
      accessor: ((relatorio: RelatorioSummaryDto) => (
        <StatusBadge status={relatorio.statusRelatorio} />
      )) as any,
    },
    {
      header: "Criado em",
      accessor: ((relatorio: RelatorioSummaryDto) =>
        formatDateTime(relatorio.createdAt)) as any,
    },
    {
      header: "Ações",
      accessor: ((relatorio: RelatorioSummaryDto) => (
        <div className="flex space-x-2">
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/relatorios/${relatorio.id}`)}
            title="Visualizar relatório">
            <Eye className="h-4 w-4" />
          </CustomButton>

          {relatorio.statusRelatorio === StatusRelatorioEnum.CONCLUIDO && (
            <CustomButton
              variant="primary"
              size="small"
              onClick={() => handleDownloadPDF(relatorio)}
              title="Baixar PDF">
              <Download className="h-4 w-4" />
            </CustomButton>
          )}

          <CustomButton
            variant="primary"
            size="small"
            onClick={() =>
              router.push(`/relatorios/${relatorio.id}/compartilhar`)
            }
            title="Compartilhar relatório">
            <Share2 className="h-4 w-4" />
          </CustomButton>

          {(relatorio.usuarioGeradorNome === user?.fullName ||
            user?.roles?.includes("ADMIN")) && (
            <CustomButton
              variant="primary"
              size="small"
              onClick={() => handleDeleteRelatorio(relatorio.id)}
              title="Excluir relatório">
              <Trash2 className="h-4 w-4" />
            </CustomButton>
          )}
        </div>
      )) as any,
      className: "text-center",
    },
  ];

  if (loading && relatorios.content.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando relatórios..." />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FileBarChart className="mr-2 h-6 w-6" />
                Relatórios
              </h1>
              <p className="text-gray-600 mt-1">
                Gere e gerencie relatórios detalhados do sistema
              </p>
            </div>

            <div className="flex space-x-3">
              <CustomButton
                variant="secondary"
                onClick={handleRefresh}
                disabled={refreshing}>
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Atualizar
              </CustomButton>

              <CustomButton
                variant="primary"
                onClick={() => router.push("/relatorios/estatisticas")}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Estatísticas
              </CustomButton>

              <CustomButton
                variant="primary"
                onClick={() => router.push("/relatorios/novo")}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Relatório
              </CustomButton>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <SearchInput
                  placeholder="Buscar por título..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              </div>

              <FilterDropdown
                placeholder="Status"
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: "", label: "Todos os status" },
                  ...statusOptions,
                ]}
              />

              <FilterDropdown
                placeholder="Tipo de Entidade"
                value={selectedTipoEntidade}
                onChange={setSelectedTipoEntidade}
                options={[
                  { value: "", label: "Todos os tipos" },
                  ...tipoEntidadeOptions,
                ]}
              />
            </div>
          </div>

          {/* Tabela de Relatórios */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Lista de Relatórios
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {relatorios.totalElements} relatórios encontrados
              </p>
            </div>

            <div className="overflow-x-auto">
              <DataTable
                data={relatorios}
                columns={columns}
                loading={loading}
                onPageChange={handlePageChange}
              />
            </div>

            {/* Paginação */}
            {relatorios.totalPages > 1 && (
              <div className="p-6 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage + 1}
                  totalPages={relatorios.totalPages}
                  onPageChange={handlePageChange}
                  totalItems={relatorios.totalElements}
                  pageSize={relatorios.size}
                />
              </div>
            )}
          </div>

          {/* Card de atalhos rápidos */}
          <div className="mt-6 grid grid-cols-3 md:grid-cols-3 gap-6">
            <div
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() =>
                router.push("/relatorios/compartilhamentos/recebidos")
              }>
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Share2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Compartilhamentos
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ver relatórios compartilhados
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
