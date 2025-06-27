// src/app/historico-status/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  User,
  FileText,
  Info,
  History,
  Calendar,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { statusHistoryService } from "@/services/clinical";
import { StatusHistoryDto } from "@/types/clinical";
import { formatDateTime } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

export default function HistoricoDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const historicoId = params.id as string;

  // Estados
  const [historico, setHistorico] = useState<StatusHistoryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do histórico
  useEffect(() => {
    if (historicoId) {
      loadHistoricoData();
    }
  }, [historicoId]);

  const loadHistoricoData = async () => {
    try {
      setLoading(true);
      setError(null);

      const historicoData =
        await statusHistoryService.getHistoricoById(historicoId);
      setHistorico(historicoData);
    } catch (err: any) {
      console.error("Erro ao carregar dados do histórico:", err);
      setError(
        err.response?.data?.message ||
          "Erro ao carregar informações do histórico"
      );
      toastUtil.error("Erro ao carregar dados do histórico");
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType?.toUpperCase()) {
      case "GUIA":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "FICHA":
        return <User className="h-5 w-5 text-green-500" />;
      default:
        return <History className="h-5 w-5 text-gray-500" />;
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

  const navigateToEntity = () => {
    if (!historico) return;

    const entityType = historico.entityType.toUpperCase();
    const entityId = historico.entityId;

    switch (entityType) {
      case "GUIA":
        router.push(`/guias/${entityId}`);
        break;
      case "FICHA":
        router.push(`/fichas/${entityId}`);
        break;
      default:
        toastUtil.info("Tipo de entidade não reconhecido");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando detalhes do histórico..." />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <History className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Erro ao carregar dados
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="space-x-3">
                  <CustomButton variant="primary" onClick={loadHistoricoData}>
                    Tentar Novamente
                  </CustomButton>
                  <CustomButton
                    variant="primary"
                    onClick={() => router.push("/historico-status")}>
                    Voltar ao Histórico
                  </CustomButton>
                </div>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!historico) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Histórico não encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  O registro de histórico solicitado não foi encontrado.
                </p>
                <CustomButton
                  variant="primary"
                  onClick={() => router.push("/historico-status")}>
                  Voltar ao Histórico
                </CustomButton>
              </div>
            </div>
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
                  <History className="mr-2 h-6 w-6" />
                  Detalhes do Histórico
                </h1>
                <p className="text-gray-600 mt-1">
                  Informações detalhadas da mudança de status
                </p>
              </div>
            </div>

            <CustomButton
              variant="primary"
              onClick={navigateToEntity}
              className="flex items-center">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver {getEntityTypeLabel(historico.entityType)}
            </CustomButton>
          </div>

          <div className="space-y-6">
            {/* Informações Gerais */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Info className="mr-2 h-5 w-5" />
                Informações Gerais
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data e Hora
                  </label>
                  <div className="flex items-center text-gray-900">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    {formatDateTime(historico.dataAlteracao)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Entidade
                  </label>
                  <div className="flex items-center">
                    {getEntityIcon(historico.entityType)}
                    <span className="ml-2 text-gray-900">
                      {getEntityTypeLabel(historico.entityType)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID da Entidade
                  </label>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {historico.entityId}
                  </code>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuário Responsável
                  </label>
                  <div className="flex items-center text-gray-900">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                      <div>{historico.alteradoPorNome}</div>
                      <div className="text-sm text-gray-600">
                        {historico.alteradoPorEmail}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mudança de Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Mudança de Status
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Anterior
                  </label>
                  {historico.statusAnterior ? (
                    <StatusBadge status={historico.statusAnterior} />
                  ) : (
                    <span className="text-gray-500 italic">
                      Status inicial - sem status anterior
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Novo
                  </label>
                  <StatusBadge status={historico.statusNovo} />
                </div>
              </div>

              {/* Fluxo visual da mudança */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-4">
                  {historico.statusAnterior ? (
                    <StatusBadge status={historico.statusAnterior} size="lg" />
                  ) : (
                    <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-full text-sm">
                      Status Inicial
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-0.5 bg-gray-400"></div>
                    <ArrowLeft className="h-4 w-4 text-gray-400 rotate-180" />
                    <div className="w-8 h-0.5 bg-gray-400"></div>
                  </div>

                  <StatusBadge status={historico.statusNovo} size="lg" />
                </div>
              </div>
            </div>

            {/* Detalhes Adicionais */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Detalhes Adicionais
              </h2>

              <div className="space-y-4">
                {historico.motivo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo da Alteração
                    </label>
                    <div className="text-gray-900 bg-blue-50 p-4 rounded-md border-l-4 border-blue-500">
                      {historico.motivo}
                    </div>
                  </div>
                )}

                {historico.observacoes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <div className="text-gray-900 bg-gray-50 p-4 rounded-md border-l-4 border-gray-300">
                      {historico.observacoes}
                    </div>
                  </div>
                )}

                {!historico.motivo && !historico.observacoes && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Nenhuma informação adicional foi registrada para esta
                      mudança.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadados do Sistema */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Informações do Sistema
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    ID do Registro
                  </label>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                    {historico.id}
                  </code>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Data de Criação
                  </label>
                  <span className="text-gray-700">
                    {formatDateTime(historico.dataAlteracao)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Usuário do Sistema
                  </label>
                  <span className="text-gray-700">
                    {historico.alteradoPorId}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
