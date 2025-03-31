// apps/frontend/src/app/tabelas-valores/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Calendar, Edit, ArrowLeft, Trash } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import tabelaValoresService, {
  TabelaValoresDto,
} from "@/services/tabelaValores";
import { CustomButton } from "@/components/ui/custom-button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import toastUtil from "@/utils/toast";

export default function TabelaValoresViewPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [tabela, setTabela] = useState<TabelaValoresDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    show: boolean;
    isDeleting: boolean;
  }>({
    show: false,
    isDeleting: false,
  });

  const tabelaId = params?.id as string;

  // Verificar permissões
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const canEdit = isAdmin || isEditor;
  const canDelete = isAdmin || isEditor;

  // Buscar dados da tabela
  useEffect(() => {
    const fetchTabela = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await tabelaValoresService.getTabelaById(tabelaId);
        setTabela(data);
      } catch (err) {
        console.error("Erro ao buscar dados da tabela:", err);
        setError(
          "Não foi possível carregar os dados da tabela. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    if (tabelaId) {
      fetchTabela();
    }
  }, [tabelaId]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para formatar hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Função para abrir o diálogo de confirmação
  const handleDeleteClick = () => {
    setConfirmDelete({
      show: true,
      isDeleting: false,
    });
  };

  // Função para excluir a tabela
  const handleConfirmDelete = async () => {
    setConfirmDelete((prev) => ({ ...prev, isDeleting: true }));

    try {
      await tabelaValoresService.deleteTabela(tabelaId);
      toastUtil.success("Tabela de valores excluída com sucesso!");
      router.push("/tabelas-valores");
    } catch (error) {
      console.error("Erro ao excluir tabela de valores:", error);
      toastUtil.error(
        "Erro ao excluir tabela de valores. Tente novamente mais tarde."
      );
      setConfirmDelete((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Função para renderizar o conteúdo da tabela
  const renderTableContent = () => {
    try {
      // Analisar o conteúdo JSON
      const jsonContent = JSON.parse(tabela?.conteudo || "[]");

      // Se for um array vazio, mostrar mensagem
      if (!Array.isArray(jsonContent) || jsonContent.length === 0) {
        return (
          <div className="text-gray-500 text-center py-4">
            Tabela sem valores cadastrados.
          </div>
        );
      }

      // Renderizar como tabela estruturada
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border-collapse border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Especialidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jsonContent.map((item: any, index: number) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.especialidade || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.valor || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.observacao || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } catch (error) {
      console.error("Erro ao renderizar conteúdo da tabela:", error);
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          Erro ao processar conteúdo da tabela. O formato JSON pode ser
          inválido.
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando dados da tabela..." />
        </main>
      </div>
    );
  }

  if (error || !tabela) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            {error || "Tabela não encontrada."}
          </div>
          <button
            onClick={() => router.push("/tabelas-valores")}
            className="flex items-center text-primary hover:text-primary-dark">
            <ArrowLeft size={16} className="mr-1" />
            Voltar para a lista de tabelas
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto p-6">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Tabelas de Valores", href: "/tabelas-valores" },
            { label: tabela.nome },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{tabela.nome}</h1>
          <div className="flex space-x-2">
            {canEdit && (
              <CustomButton
                variant="primary"
                icon={Edit}
                onClick={() =>
                  router.push(`/tabelas-valores/${tabelaId}/editar`)
                }>
                Editar
              </CustomButton>
            )}
            {canDelete && (
              <CustomButton
                variant="primary"
                icon={Trash}
                className="bg-red-500 hover:bg-red-700 text-white border-none"
                onClick={handleDeleteClick}>
                Excluir
              </CustomButton>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Detalhes da Tabela
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nome:</p>
                <p className="text-gray-800">{tabela.nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Convênio:</p>
                <p className="text-gray-800">{tabela.convenioNome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Criado por:</p>
                <p className="text-gray-800">{tabela.createdByName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Criação:</p>
                <p className="text-gray-800">
                  {formatDate(tabela.createdAt)} às{" "}
                  {formatTime(tabela.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {tabela.descricao && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Descrição:</p>
              <p className="text-gray-800 whitespace-pre-line">
                {tabela.descricao}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Conteúdo da Tabela
          </h2>
          {renderTableContent()}
        </div>
      </main>

      {confirmDelete.show && (
        <ConfirmDialog
          isOpen={confirmDelete.show}
          title="Excluir Tabela de Valores"
          message={`Tem certeza que deseja excluir a tabela "${tabela.nome}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete({ show: false, isDeleting: false })}
          isLoading={confirmDelete.isDeleting}
          variant="danger"
        />
      )}
    </div>
  );
}
