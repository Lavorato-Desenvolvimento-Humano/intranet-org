// apps/frontend/src/app/tabelas-valores/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Calendar, Eye, Pencil, Trash } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import DataTable from "@/components/ui/data-table";
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

export default function TabelasValoresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Estados para dados e paginação
  const [tabelas, setTabelas] = useState<TabelaValoresDto[]>([]);
  const [pageData, setPageData] = useState<TabelaValoresPageResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Inicializar parâmetros da URL
  useEffect(() => {
    const page = parseInt(searchParams?.get("page") || "1") - 1; // URL usa 1-based, state usa 0-based
    const size = parseInt(searchParams?.get("size") || "10");
    const sort = searchParams?.get("sort") || "nome";

    setCurrentPage(Math.max(0, page));
    setPageSize(Math.max(5, Math.min(50, size))); // Limitar entre 5 e 50
    setSortField(sort);
  }, [searchParams]);

  // Função para buscar tabelas
  const fetchTabelas = useCallback(async () => {
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
  }, [currentPage, pageSize, sortField, sortDirection]);

  // Buscar tabelas quando os parâmetros mudarem
  useEffect(() => {
    fetchTabelas();
  }, [fetchTabelas]);

  // Atualizar URL quando os parâmetros mudarem
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", (currentPage + 1).toString()); // URL usa 1-based
    params.set("size", pageSize.toString());
    params.set("sort", sortField);

    // Usar replace para não adicionar ao histórico do navegador
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [currentPage, pageSize, sortField]);

  // Função para mudar página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage - 1); // Pagination component usa 1-based
  };

  // Função para mudar tamanho da página
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // Voltar para primeira página
  };

  // Função para mudar ordenação
  const handleSortChange = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(0); // Voltar para primeira página
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

  // Definição das colunas da tabela
  const columns = [
    {
      key: "nome",
      header: "Nome",
      width: "25%",
      sortable: true,
      render: (value: string, record: TabelaValoresDto) => (
        <div className="font-medium text-primary hover:text-primary-dark cursor-pointer">
          {value}
        </div>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      width: "25%",
      render: (value: string) => (
        <div className="text-gray-600 truncate max-w-sm">
          {stripHtml(value) || "Sem descrição"}
        </div>
      ),
    },
    {
      key: "convenioNome",
      header: "Convênio",
      width: "20%",
      sortable: true,
      render: (value: string) => <div className="text-gray-700">{value}</div>,
    },
    {
      key: "createdAt",
      header: "Data de Criação",
      width: "15%",
      sortable: true,
      render: (value: string) => (
        <div className="text-gray-600 flex items-center">
          <Calendar size={16} className="mr-2 text-gray-400" />
          {formatDate(value)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      width: "15%",
      render: (_: any, record: TabelaValoresDto) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/tabelas-valores/${record.id}`);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Visualizar">
            <Eye size={18} />
          </button>
          {(isAdmin || isEditor) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/tabelas-valores/${record.id}/editar`);
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
                handleDeleteClick(record);
              }}
              className="p-1 text-red-600 hover:text-red-800"
              title="Excluir">
              <Trash size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

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
                    className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm">
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
                <DataTable
                  data={tabelas}
                  columns={columns.map((col) => ({
                    ...col,
                    sortable: col.sortable && !!col.sortable,
                  }))}
                  keyExtractor={(item) => item.id}
                  searchable={false} // Desabilitado já que temos paginação no servidor
                  onRowClick={(tabela) =>
                    router.push(`/tabelas-valores/${tabela.id}`)
                  }
                  emptyMessage="Nenhuma tabela de valores encontrada."
                  showHeader={false} // Usaremos nosso próprio cabeçalho
                  maxHeight="calc(100vh - 400px)"
                  enableScrolling={true}
                />
              </div>

              {/* Paginação inferior */}
              {pageData && pageData.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage + 1} // Pagination component usa 1-based
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
