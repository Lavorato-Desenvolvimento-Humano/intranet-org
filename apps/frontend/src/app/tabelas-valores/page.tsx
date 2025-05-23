// apps/frontend/src/app/tabelas-valores/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Calendar,
  Eye,
  Pencil,
  Trash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import Pagination from "@/components/ui/pagination";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useAuth } from "@/context/AuthContext";
import tabelaValoresService, {
  TabelaValoresDto,
  TabelaValoresPageResponse,
} from "@/services/tabelaValores";
import toastUtil from "@/utils/toast";
import { stripHtml } from "@/utils/textUtils";
import { CustomButton } from "@/components/ui/custom-button";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";

// Força a página a ser renderizada dinamicamente
export const dynamic = "force-dynamic";

export default function TabelasValoresPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Estados para dados e paginação
  const [tabelas, setTabelas] = useState<TabelaValoresDto[]>([]);
  const [pageData, setPageData] = useState<TabelaValoresPageResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Estados para controles de paginação
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState("nome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Estado para confirmação de exclusão
  const [confirmDelete, setConfirmDelete] = useState<{
    show: boolean;
    tabela: TabelaValoresDto | null;
    isDeleting: boolean;
  }>({
    show: false,
    tabela: null,
    isDeleting: false,
  });

  // Verificar permissões
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const canCreate = isAdmin || isEditor;
  const canDelete = isAdmin || isEditor;

  // Marcar como montado para evitar problemas de hidratação
  useEffect(() => {
    setMounted(true);
  }, []);

  // Inicializar parâmetros da URL apenas após montar no cliente
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const page = parseInt(urlParams.get("page") || "1") - 1;
      const size = parseInt(urlParams.get("size") || "10");
      const sort = urlParams.get("sort") || "nome";
      const direction = (urlParams.get("direction") || "asc") as "asc" | "desc";

      setCurrentPage(Math.max(0, page));
      setPageSize(Math.max(5, Math.min(50, size)));
      setSortField(sort);
      setSortDirection(direction);
    }
  }, [mounted]);

  // Função para buscar tabelas
  const fetchTabelas = useCallback(async () => {
    if (!mounted) return; // Não buscar antes de montar

    setLoading(true);
    setError(null);
    try {
      const sortParam = `${sortField},${sortDirection}`;
      const data = await tabelaValoresService.getAllTabelas(
        currentPage,
        pageSize,
        sortParam
      );

      setPageData(data);
      setTabelas(data.content || []);
    } catch (err) {
      console.error("Erro ao buscar tabelas de valores:", err);
      setError(
        "Não foi possível carregar as tabelas de valores. Tente novamente mais tarde."
      );
      setTabelas([]);
      setPageData(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortField, sortDirection, mounted]);

  // Buscar tabelas quando os parâmetros mudarem
  useEffect(() => {
    if (mounted) {
      fetchTabelas();
    }
  }, [fetchTabelas, mounted]);

  // Atualizar URL quando os parâmetros mudarem - apenas no cliente
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      const params = new URLSearchParams();
      params.set("page", (currentPage + 1).toString());
      params.set("size", pageSize.toString());
      params.set("sort", sortField);
      params.set("direction", sortDirection);

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [currentPage, pageSize, sortField, sortDirection, mounted]);

  // Função para mudar página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage - 1);
  };

  // Função para mudar tamanho da página
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // Função para mudar ordenação
  const handleSortChange = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(0);
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para abrir diálogo de confirmação de exclusão
  const handleDeleteClick = (tabela: TabelaValoresDto) => {
    setConfirmDelete({
      show: true,
      tabela,
      isDeleting: false,
    });
  };

  // Função para confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!confirmDelete.tabela) return;

    setConfirmDelete((prev) => ({ ...prev, isDeleting: true }));

    try {
      await tabelaValoresService.deleteTabela(confirmDelete.tabela.id);
      toastUtil.success("Tabela de valores excluída com sucesso!");

      // Recarregar dados após exclusão
      await fetchTabelas();
    } catch (err) {
      console.error("Erro ao excluir tabela de valores:", err);
      toastUtil.error(
        "Erro ao excluir tabela de valores. Tente novamente mais tarde."
      );
    } finally {
      setConfirmDelete({
        show: false,
        tabela: null,
        isDeleting: false,
      });
    }
  };

  // Função para renderizar cabeçalho da tabela
  const renderTableHeader = (
    label: string,
    field: string,
    sortable: boolean = false
  ) => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
        sortable ? "cursor-pointer select-none hover:bg-gray-100" : ""
      }`}
      onClick={() => sortable && handleSortChange(field)}>
      <div className="flex items-center">
        {label}
        {sortable && sortField === field && (
          <span className="ml-1">
            {sortDirection === "asc" ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </span>
        )}
      </div>
    </th>
  );

  // Não renderizar nada até estar montado no cliente
  if (!mounted) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <div className="flex-grow container mx-auto p-6">
            <Loading message="Carregando página..." />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Tabelas de Valores" },
            ]}
          />

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Tabelas de Valores
              </h1>
              {pageData && (
                <p className="text-sm text-gray-600 mt-1">
                  {pageData.totalElements}{" "}
                  {pageData.totalElements === 1
                    ? "tabela encontrada"
                    : "tabelas encontradas"}
                </p>
              )}
            </div>
            {canCreate && (
              <CustomButton
                variant="primary"
                icon={Plus}
                onClick={() => router.push("/tabelas-valores/nova")}>
                Nova Tabela
              </CustomButton>
            )}
          </div>

          {/* Controles de paginação superior */}
          {!loading && pageData && pageData.totalElements > 0 && (
            <div className="mb-4 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-600">
                  Itens por página:
                  <select
                    value={pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(parseInt(e.target.value))
                    }
                    className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </label>
                <div className="text-sm text-gray-600">
                  Página {currentPage + 1} de {pageData.totalPages}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <Loading message="Carregando tabelas de valores..." />
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              {error}
              <button
                onClick={fetchTabelas}
                className="ml-4 text-primary hover:text-primary-dark underline">
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {renderTableHeader("Nome", "nome", true)}
                        {renderTableHeader("Descrição", "descricao")}
                        {renderTableHeader("Convênio", "convenioNome", true)}
                        {renderTableHeader(
                          "Data de Criação",
                          "createdAt",
                          true
                        )}
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tabelas.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-16 text-center text-gray-500">
                            Nenhuma tabela de valores encontrada.
                          </td>
                        </tr>
                      ) : (
                        tabelas.map((tabela) => (
                          <tr
                            key={tabela.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() =>
                              router.push(`/tabelas-valores/${tabela.id}`)
                            }>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-primary hover:text-primary-dark">
                                {tabela.nome}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-gray-600 truncate max-w-xs">
                                {stripHtml(tabela.descricao) || "Sem descrição"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-700">
                                {tabela.convenioNome}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-600 flex items-center">
                                <Calendar
                                  size={16}
                                  className="mr-2 text-gray-400"
                                />
                                {formatDate(tabela.createdAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/tabelas-valores/${tabela.id}`
                                    );
                                  }}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  title="Visualizar">
                                  <Eye size={18} />
                                </button>
                                {(isAdmin || isEditor) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/tabelas-valores/${tabela.id}/editar`
                                      );
                                    }}
                                    className="p-1 text-yellow-600 hover:text-yellow-800"
                                    title="Editar">
                                    <Pencil size={18} />
                                  </button>
                                )}
                                {(isAdmin || isEditor) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(tabela);
                                    }}
                                    className="p-1 text-red-600 hover:text-red-800"
                                    title="Excluir">
                                    <Trash size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginação inferior */}
              {pageData && pageData.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage + 1}
                    totalPages={pageData.totalPages}
                    onPageChange={handlePageChange}
                    totalItems={pageData.totalElements}
                    pageSize={pageSize}
                  />
                </div>
              )}
            </>
          )}
        </main>

        {/* Diálogo de confirmação de exclusão */}
        {confirmDelete.show && (
          <ConfirmDialog
            isOpen={confirmDelete.show}
            title="Excluir Tabela de Valores"
            message={`Tem certeza que deseja excluir a tabela "${confirmDelete.tabela?.nome}"? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            onConfirm={handleConfirmDelete}
            onCancel={() =>
              setConfirmDelete({ show: false, tabela: null, isDeleting: false })
            }
            isLoading={confirmDelete.isDeleting}
            variant="danger"
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
