// src/app/convenios/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, FileText, Eye, Pencil, Trash } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import DataTable from "@/components/ui/data-table";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useAuth } from "@/context/AuthContext";
import convenioService, { ConvenioDto } from "@/services/convenio";
import toastUtil from "@/utils/toast";
import { stripHtml } from "@/utils/textUtils";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";

export default function ConveniosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    show: boolean;
    convenio: ConvenioDto | null;
    isDeleting: boolean;
  }>({
    show: false,
    convenio: null,
    isDeleting: false,
  });

  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const canCreate = isAdmin || isEditor;
  const canDelete = isAdmin;

  // Buscar convênios ao carregar a página
  useEffect(() => {
    const fetchConvenios = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await convenioService.getAllConvenios();
        setConvenios(data);
      } catch (err) {
        console.error("Erro ao buscar convênios:", err);
        setError(
          "Não foi possível carregar os convênios. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConvenios();
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
  const handleDeleteClick = (convenio: ConvenioDto) => {
    setConfirmDelete({
      show: true,
      convenio,
      isDeleting: false,
    });
  };

  // Função para confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!confirmDelete.convenio) return;

    setConfirmDelete((prev) => ({ ...prev, isDeleting: true }));

    try {
      await convenioService.deleteConvenio(confirmDelete.convenio.id);
      setConvenios((prevConvenios) =>
        prevConvenios.filter((c) => c.id !== confirmDelete.convenio?.id)
      );
      toastUtil.success("Convênio excluído com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir convênio:", err);
      toastUtil.error("Erro ao excluir convênio. Tente novamente mais tarde.");
    } finally {
      setConfirmDelete({
        show: false,
        convenio: null,
        isDeleting: false,
      });
    }
  };

  // Definição das colunas da tabela
  const columns = [
    {
      key: "name",
      header: "Nome",
      width: "25%",
      sortable: true,
      render: (value: string, record: ConvenioDto) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
    },
    {
      key: "description",
      header: "Descrição",
      width: "35%",
      render: (value: string) => (
        <div className="text-gray-600 truncate max-w-sm">
          {stripHtml(value) || "Sem descrição"}
        </div>
      ),
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
      key: "postagemCount",
      header: "Postagens",
      width: "10%",
      sortable: true,
      render: (value: number) => (
        <div className="text-gray-600 flex items-center">
          <FileText size={16} className="mr-2 text-gray-400" />
          {value}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      width: "15%",
      render: (_: any, record: ConvenioDto) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/convenios/${record.id}`);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Visualizar">
            <Eye size={18} />
          </button>
          {(isAdmin || isEditor) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/convenios/${record.id}/editar`);
              }}
              className="p-1 text-yellow-600 hover:text-yellow-800"
              title="Editar">
              <Pencil size={18} />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(record);
              }}
              className="p-1 text-red-600 hover:text-red-800"
              title="Excluir"
              disabled={record.postagemCount > 0}>
              <Trash
                size={18}
                className={
                  record.postagemCount > 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              />
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
          <Breadcrumb items={[{ label: "Convênios" }]} />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Convênios</h1>
            {canCreate && (
              <button
                onClick={() => router.push("/convenios/novo")}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center">
                <Plus size={16} className="mr-1" />
                Novo Convênio
              </button>
            )}
          </div>

          {loading ? (
            <Loading message="Carregando convênios..." />
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              {error}
            </div>
          ) : (
            <DataTable
              data={convenios}
              columns={columns}
              keyExtractor={(item) => item.id}
              searchable
              searchKeys={["name", "description"]}
              onRowClick={(convenio) =>
                router.push(`/convenios/${convenio.id}`)
              }
              emptyMessage="Nenhum convênio encontrado."
              title="Lista de Convênios"
            />
          )}
        </main>

        {/* Diálogo de confirmação de exclusão */}
        {confirmDelete.show && (
          <ConfirmDialog
            isOpen={confirmDelete.show}
            title="Excluir Convênio"
            message={`Tem certeza que deseja excluir o convênio "${confirmDelete.convenio?.name}"? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            onConfirm={handleConfirmDelete}
            onCancel={() =>
              setConfirmDelete({
                show: false,
                convenio: null,
                isDeleting: false,
              })
            }
            isLoading={confirmDelete.isDeleting}
            variant="danger"
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
