"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Copy,
  FileText,
  User,
  Calendar,
  Clock,
  DollarSign,
  Building,
  Hash,
  Eye,
  Trash2,
  FileSignature,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { fichaService } from "@/services/clinical";
import { FichaDto, StatusHistoryDto } from "@/types/clinical";
import { formatDate, formatDateTime } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

export default function FichaDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const fichaId = params.id as string;

  // Estados principais
  const [ficha, setFicha] = useState<FichaDto | null>(null);
  const [historicoStatus, setHistoricoStatus] = useState<StatusHistoryDto[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "historico">("info");

  // Carregar dados da ficha
  useEffect(() => {
    if (fichaId) {
      loadFichaData();
    }
  }, [fichaId]);

  const loadFichaData = async () => {
    try {
      setLoading(true);
      setError(null);

      const fichaData = await fichaService.getFichaById(fichaId);
      setFicha(fichaData);

      // Carregar histórico de status
      const historico = await fichaService.getHistoricoStatusFicha(fichaId);
      setHistoricoStatus(historico);
    } catch (err) {
      console.error("Erro ao carregar dados da ficha:", err);
      setError("Erro ao carregar informações da ficha");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateFicha = () => {
    if (ficha) {
      router.push(`/fichas/novo?duplicate=${fichaId}`);
    }
  };

  const handleDeleteFicha = async () => {
    if (!ficha) return;

    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir a ficha ${ficha.codigoFicha}?`
    );

    if (confirmacao) {
      try {
        await fichaService.deleteFicha(fichaId);
        toastUtil.success("Ficha excluída com sucesso!");
        router.push("/fichas");
      } catch (err) {
        console.error("Erro ao excluir ficha:", err);
        toastUtil.error("Erro ao excluir ficha");
      }
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando dados da ficha..." />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !ficha) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {error || "Ficha não encontrada"}
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
          {/* Header com navegação */}
          <div className="flex items-center justify-between mb-6">
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
                  <FileSignature className="mr-2 h-6 w-6" />
                  Ficha #{ficha.codigoFicha}
                </h1>
                <p className="text-gray-600 mt-1">Detalhes da ficha</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <CustomButton variant="secondary" onClick={handleDuplicateFicha}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </CustomButton>
              <CustomButton
                variant="primary"
                onClick={() => router.push(`/fichas/${fichaId}/editar`)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </CustomButton>
              <CustomButton variant="primary" onClick={handleDeleteFicha}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </CustomButton>
            </div>
          </div>

          {/* Navegação por tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === "info"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  Informações
                </button>
                <button
                  onClick={() => setActiveTab("historico")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === "historico"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  Histórico ({historicoStatus.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "info" && (
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FileSignature className="mr-2 h-5 w-5" />
                      Informações da Ficha
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Código da Ficha</p>
                        <p className="font-medium">{ficha.codigoFicha}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <StatusBadge status={ficha.status} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Especialidade</p>
                        <p className="font-medium">{ficha.especialidade}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Quantidade Autorizada
                        </p>
                        <p className="font-medium">
                          {ficha.quantidadeAutorizada}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Ficha</p>
                        <p className="font-medium">
                          {ficha.tipoFicha === "COM_GUIA"
                            ? "Com Guia"
                            : "Assinatura"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mês/Ano</p>
                        <p className="font-medium">
                          {String(ficha.mes).padStart(2, "0")}/{ficha.ano}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Paciente */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Paciente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          Nome do Paciente
                        </p>
                        <p className="font-medium">{ficha.pacienteNome}</p>
                      </div>
                      {ficha.pacienteId && (
                        <div>
                          <p className="text-sm text-gray-600">Ações</p>
                          <CustomButton
                            variant="primary"
                            size="small"
                            onClick={() =>
                              router.push(`/pacientes/${ficha.pacienteId}`)
                            }>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Paciente
                          </CustomButton>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações do Convênio */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Building className="mr-2 h-5 w-5" />
                      Convênio
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          Nome do Convênio
                        </p>
                        <p className="font-medium">{ficha.convenioNome}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informações da Guia (se aplicável) */}
                  {ficha.guiaId && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        Guia Associada
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">ID da Guia</p>
                          <p className="font-medium">{ficha.guiaId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Ações</p>
                          <CustomButton
                            variant="primary"
                            size="small"
                            onClick={() =>
                              router.push(`/guias/${ficha.guiaId}`)
                            }>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Guia
                          </CustomButton>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informações de Auditoria */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Clock className="mr-2 h-5 w-5" />
                      Auditoria
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Responsável</p>
                        <p className="font-medium">
                          {ficha.usuarioResponsavelNome}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Criado em</p>
                        <p className="font-medium">
                          {formatDateTime(ficha.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Última atualização
                        </p>
                        <p className="font-medium">
                          {formatDateTime(ficha.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "historico" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Histórico de Status
                  </h3>
                  {historicoStatus.length > 0 ? (
                    <div className="space-y-4">
                      {historicoStatus.map((item) => (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex space-x-2">
                              <StatusBadge status={item.statusAnterior} />
                              <span className="text-gray-500">→</span>
                              <StatusBadge status={item.statusNovo} />
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDateTime(item.dataAlteracao)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>
                              <strong>Alterado por:</strong>{" "}
                              {item.alteradoPorNome}
                            </p>
                            <p>
                              <strong>Motivo:</strong> {item.motivo}
                            </p>
                            {item.observacoes && (
                              <p>
                                <strong>Observações:</strong> {item.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Nenhum histórico de alteração encontrado.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
