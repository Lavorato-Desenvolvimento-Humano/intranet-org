// apps/frontend/src/app/tabelas-valores/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Eye, Pencil, Trash } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import DataTable from "@/components/ui/data-table";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useAuth } from "@/context/AuthContext";
import tabelaValoresService, {
  TabelaValoresDto,
} from "@/services/tabelaValores";
import toastUtil from "@/utils/toast";
import { stripHtml } from "@/utils/textUtils";
import { CustomButton } from "@/components/ui/custom-button";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";

export default function TabelasValoresPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tabelas, setTabelas] = useState<TabelaValoresDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Buscar tabelas ao carregar a página
  useEffect(() => {
    const fetchTabelas = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await tabelaValoresService.getAllTabelas();
        setTabelas(data.content || []);
      } catch (err) {
        console.error("Erro ao buscar tabelas de valores:", err);
        setError(
          "Não foi possível carregar as tabelas de valores. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTabelas();
  }, []);

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
      setTabelas((prevTabelas) =>
        prevTabelas.filter((t) => t.id !== confirmDelete.tabela?.id)
      );
      toastUtil.success("Tabela de valores excluída com sucesso!");
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
        <div className="font-medium text-primary hover:text-primary-dark">
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
            <h1 className="text-2xl font-bold text-gray-800">
              Tabelas de Valores
            </h1>
            {canCreate && (
              <CustomButton
                variant="primary"
                icon={Plus}
                onClick={() => router.push("/tabelas-valores/nova")}>
                Nova Tabela
              </CustomButton>
            )}
          </div>

          {loading ? (
            <Loading message="Carregando tabelas de valores..." />
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              {error}
            </div>
          ) : (
            <DataTable
              data={tabelas}
              columns={columns}
              keyExtractor={(item) => item.id}
              searchable
              searchKeys={["nome", "descricao", "convenioNome"]}
              onRowClick={(tabela) =>
                router.push(`/tabelas-valores/${tabela.id}`)
              }
              emptyMessage="Nenhuma tabela de valores encontrada."
              title="Lista de Tabelas de Valores"
            />
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
