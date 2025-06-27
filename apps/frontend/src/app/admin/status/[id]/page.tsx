// src/app/admin/status/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Settings,
  Calendar,
  User,
  ToggleLeft,
  ToggleRight,
  Info,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { statusService } from "@/services/clinical";
import { StatusDto } from "@/types/clinical";
import { formatDateTime } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

export default function StatusDetailPage() {
  const router = useRouter();
  const params = useParams();
  const statusId = params.id as string;

  // Estados
  const [status, setStatus] = useState<StatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do status
  useEffect(() => {
    if (statusId) {
      loadStatusData();
    }
  }, [statusId]);

  const loadStatusData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statusData = await statusService.getStatusById(statusId);
      setStatus(statusData);
    } catch (err: any) {
      console.error("Erro ao carregar dados do status:", err);
      setError(
        err.response?.data?.message || "Erro ao carregar informações do status"
      );
      toastUtil.error("Erro ao carregar dados do status");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAtivo = async () => {
    if (!status) return;

    try {
      await statusService.toggleStatusAtivo(status.id);
      toastUtil.success(
        `Status ${status.ativo ? "desativado" : "ativado"} com sucesso!`
      );
      loadStatusData(); // Recarregar dados
    } catch (err: any) {
      console.error("Erro ao alterar status:", err);
      toastUtil.error(err.response?.data?.message || "Erro ao alterar status");
    }
  };

  const handleDeleteStatus = async () => {
    if (!status) return;

    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir o status "${status.status}"?\n\nEsta ação não pode ser desfeita e pode afetar outros registros no sistema.`
    );

    if (confirmacao) {
      try {
        await statusService.deleteStatus(status.id);
        toastUtil.success("Status excluído com sucesso!");
        router.push("/admin/status");
      } catch (err: any) {
        console.error("Erro ao excluir status:", err);
        toastUtil.error(
          err.response?.data?.message || "Erro ao excluir status"
        );
      }
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando detalhes do status..." />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Erro ao carregar dados
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="space-x-3">
                  <CustomButton variant="primary" onClick={loadStatusData}>
                    Tentar Novamente
                  </CustomButton>
                  <CustomButton
                    variant="primary"
                    onClick={() => router.push("/admin/status")}>
                    Voltar à Lista
                  </CustomButton>
                </div>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!status) {
    return (
      <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Status não encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  O status solicitado não foi encontrado.
                </p>
                <CustomButton
                  variant="primary"
                  onClick={() => router.push("/admin/status")}>
                  Voltar à Lista
                </CustomButton>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <CustomButton
                variant="primary"
                onClick={() => router.back()}
                className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </CustomButton>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Settings className="mr-2 h-6 w-6" />
                  Detalhes do Status
                </h1>
                <p className="text-gray-600 mt-1">
                  Informações completas do status "{status.status}"
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <CustomButton
                variant="primary"
                onClick={handleToggleAtivo}
                className="flex items-center">
                {status.ativo ? (
                  <>
                    <ToggleRight className="h-4 w-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </CustomButton>

              <CustomButton
                variant="primary"
                onClick={() =>
                  router.push(`/admin/status/${status.id}/editar`)
                }>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </CustomButton>

              <CustomButton variant="primary" onClick={handleDeleteStatus}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </CustomButton>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informações Principais */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Badge e Informações Básicas */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">
                  Informações Básicas
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Status
                    </label>
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={status.status} size="lg" />
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {status.status}
                      </code>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Atual
                    </label>
                    <div className="flex items-center">
                      {status.ativo ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-green-700 font-medium">
                            Ativo
                          </span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-gray-600 font-medium">
                            Inativo
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordem de Exibição
                    </label>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {status.ordemExibicao || "-"}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        na lista de status
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID do Sistema
                    </label>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                      {status.id}
                    </code>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Descrição
                </h2>

                {status.descricao ? (
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <p className="text-gray-700">{status.descricao}</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Nenhuma descrição foi fornecida para este status.
                    </p>
                  </div>
                )}
              </div>

              {/* Metadados do Sistema */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Informações do Sistema
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Data de Criação
                    </label>
                    <div className="flex items-center text-gray-700">
                      <Calendar className="h-4 w-4 mr-2" />
                      {status.createdAt
                        ? formatDateTime(status.createdAt)
                        : "Não disponível"}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Última Atualização
                    </label>
                    <div className="flex items-center text-gray-700">
                      <Calendar className="h-4 w-4 mr-2" />
                      {status.updatedAt
                        ? formatDateTime(status.updatedAt)
                        : "Não disponível"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar com informações adicionais */}
            <div className="lg:col-span-1 space-y-6">
              {/* Ações Rápidas */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Ações Rápidas
                </h3>

                <div className="space-y-3">
                  <CustomButton
                    variant="primary"
                    onClick={() =>
                      router.push(`/admin/status/${status.id}/editar`)
                    }
                    className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Status
                  </CustomButton>

                  <CustomButton
                    variant="primary"
                    onClick={handleToggleAtivo}
                    className="w-full justify-start">
                    {status.ativo ? (
                      <>
                        <ToggleLeft className="h-4 w-4 mr-2" />
                        Desativar Status
                      </>
                    ) : (
                      <>
                        <ToggleRight className="h-4 w-4 mr-2" />
                        Ativar Status
                      </>
                    )}
                  </CustomButton>

                  <CustomButton
                    variant="primary"
                    onClick={() => router.push("/admin/status/novo")}
                    className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Criar Novo Status
                  </CustomButton>
                </div>
              </div>

              {/* Informações sobre Uso */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <Info className="mr-2 h-5 w-5" />
                  Informações de Uso
                </h3>

                <div className="space-y-3 text-sm text-blue-700">
                  <div>
                    <p className="font-medium">• Status Ativo:</p>
                    <p>
                      {status.ativo
                        ? "Aparece nas opções de seleção do sistema"
                        : "Não aparece nas opções, mas mantém dados existentes"}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">• Ordem de Exibição:</p>
                    <p>
                      Define a posição nas listas de seleção. Números menores
                      aparecem primeiro.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">• Exclusão:</p>
                    <p>
                      Só é possível excluir status que não estão sendo usados em
                      guias ou fichas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status da Configuração */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Status da Configuração
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Configurado</span>
                    <span className="text-green-600 font-medium">✓ Sim</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ativo</span>
                    <span
                      className={`font-medium ${status.ativo ? "text-green-600" : "text-red-600"}`}>
                      {status.ativo ? "✓ Sim" : "✗ Não"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tem Descrição</span>
                    <span
                      className={`font-medium ${status.descricao ? "text-green-600" : "text-gray-500"}`}>
                      {status.descricao ? "✓ Sim" : "- Não"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Ordem Definida
                    </span>
                    <span
                      className={`font-medium ${status.ordemExibicao ? "text-green-600" : "text-gray-500"}`}>
                      {status.ordemExibicao ? "✓ Sim" : "- Não"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
