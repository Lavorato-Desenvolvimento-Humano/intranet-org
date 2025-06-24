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

      // TODO: Implementar endpoint específico para buscar por ID
      // const historicoData = await statusHistoryService.getHistoricoById(historicoId);
      // setHistorico(historicoData);

      // Simulação temporária - em produção usar o endpoint específico
      toastUtil.info("Carregando detalhes do histórico...");
    } catch (err) {
      console.error("Erro ao carregar detalhes do histórico:", err);
      setError("Erro ao carregar informações do histórico");
      toastUtil.error("Erro ao carregar informações do histórico");
    } finally {
      setLoading(false);
    }
  };

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FICHA: "Ficha",
      GUIA: "Guia",
    };
    return labels[type] || type;
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "FICHA":
        return <FileText className="h-5 w-5" />;
      case "GUIA":
        return <FileText className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando detalhes do histórico..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
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
          </div>

          {/* Placeholder para quando o histórico não existe ou está carregando */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-12">
              <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Detalhes do Histórico
              </h3>
              <p className="text-gray-600 mb-6">
                Esta funcionalidade será implementada para mostrar os detalhes
                completos da mudança de status.
              </p>
              <CustomButton
                variant="primary"
                onClick={() => router.push("/historico-status")}>
                Voltar ao Histórico
              </CustomButton>
            </div>
          </div>

          {/* Template para quando os dados estiverem disponíveis */}
          {historico && (
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
                      {historico.alteradoPorNome}
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
                      <span className="text-gray-500">-</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Novo
                    </label>
                    <StatusBadge status={historico.statusNovo} />
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
                        Motivo
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {historico.motivo}
                      </p>
                    </div>
                  )}

                  {historico.observacoes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {historico.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
