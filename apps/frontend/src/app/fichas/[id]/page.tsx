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
  Link,
  History,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { fichaService } from "@/services/clinical";
import { FichaDto, StatusHistoryDto } from "@/types/clinical";
import { formatDate, formatDateTime } from "@/utils/dateUtils";
import { VincularGuiaModal } from "@/components/clinical/modals/VincularGuiasModal";
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

  const [showVincularModal, setShowVincularModal] = useState(false);

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

  const handleVincularSuccess = () => {
    setShowVincularModal(false);
    loadFichaData();
  };

  const handleDuplicateFicha = () => {
    if (ficha) {
      router.push(`/fichas/novo?duplicate=${fichaId}`);
    }
  };

  const handleVincularGuia = () => {
    setShowVincularModal(true);
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
      } catch (err: any) {
        toastUtil.error(err.response?.data?.message || "Erro ao excluir ficha");
      }
    }
  };

  const canVincularGuia = (): boolean => {
    return ficha?.tipoFicha === "ASSINATURA" && !ficha?.guiaId;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Loading message="Carregando dados da ficha..." />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !ficha) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {error || "Ficha não encontrada"}
              </h2>
              <CustomButton onClick={() => router.push("/fichas")}>
                Voltar para Fichas
              </CustomButton>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CustomButton
                  variant="primary"
                  onClick={() => router.push("/fichas")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </CustomButton>

                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <FileSignature className="h-8 w-8 mr-3 text-blue-600" />
                    Ficha {ficha.codigoFicha}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {ficha.pacienteNome} - {ficha.especialidade}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {canVincularGuia() && (
                  <CustomButton variant="primary" onClick={handleVincularGuia}>
                    <Link className="h-4 w-4 mr-2" />
                    Vincular à Guia
                  </CustomButton>
                )}

                <CustomButton variant="primary" onClick={handleDuplicateFicha}>
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
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
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
                  <History className="h-4 w-4 mr-2 inline" />
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
                        <p className="text-sm text-gray-600">Período</p>
                        <p className="font-medium">
                          {String(ficha.mes).padStart(2, "0")}/{ficha.ano}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ✅ Informações da Guia (se vinculada) */}
                  {ficha.guiaId ? (
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <Link className="mr-2 h-5 w-5" />
                        Vinculada à Guia
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">
                            Esta ficha está vinculada a uma guia
                          </p>
                          <p className="font-medium text-blue-800">
                            ID da Guia: {ficha.guiaId}
                          </p>
                        </div>
                        <CustomButton
                          variant="primary"
                          onClick={() => router.push(`/guias/${ficha.guiaId}`)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-100">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Guia
                        </CustomButton>
                      </div>
                    </div>
                  ) : (
                    ficha.tipoFicha === "ASSINATURA" && (
                      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                          <FileSignature className="mr-2 h-5 w-5" />
                          Ficha de Assinatura
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-yellow-600">
                              Esta ficha não está vinculada a nenhuma guia
                            </p>
                            <p className="font-medium text-yellow-800">
                              Você pode vincular a uma guia existente se
                              necessário
                            </p>
                          </div>
                          <CustomButton
                            variant="primary"
                            onClick={handleVincularGuia}>
                            <Link className="h-4 w-4 mr-2" />
                            Vincular à Guia
                          </CustomButton>
                        </div>
                      </div>
                    )
                  )}

                  {/* Informações do Paciente */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Informações do Paciente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Nome</p>
                        <p className="font-medium">{ficha.pacienteNome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Convênio</p>
                        <p className="font-medium">{ficha.convenioNome}</p>
                      </div>
                    </div>
                  </div>

                  {/* Responsável */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Building className="mr-2 h-5 w-5" />
                      Responsável
                    </h3>
                    <div>
                      <p className="text-sm text-gray-600">
                        Usuário Responsável
                      </p>
                      <p className="font-medium">
                        {ficha.usuarioResponsavelNome}
                      </p>
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Informações de Data
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                    <History className="mr-2 h-5 w-5" />
                    Histórico de Status
                  </h3>

                  {historicoStatus.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Nenhum histórico de status encontrado
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historicoStatus.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              {item.statusAnterior && (
                                <>
                                  <StatusBadge
                                    status={item.statusAnterior}
                                    size="xs"
                                  />
                                  <span className="text-gray-400">→</span>
                                </>
                              )}
                              <StatusBadge status={item.statusNovo} size="xs" />
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDateTime(item.dataAlteracao)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Alterado por:</p>
                              <p className="font-medium">
                                {item.alteradoPorNome}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Email:</p>
                              <p className="font-medium">
                                {item.alteradoPorEmail}
                              </p>
                            </div>
                          </div>

                          {item.motivo && (
                            <div className="mt-3">
                              <p className="text-gray-600 text-sm">Motivo:</p>
                              <p className="font-medium">{item.motivo}</p>
                            </div>
                          )}

                          {item.observacoes && (
                            <div className="mt-2">
                              <p className="text-gray-600 text-sm">
                                Observações:
                              </p>
                              <p className="text-gray-800">
                                {item.observacoes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Modal de Vincular Guia */}
        {showVincularModal && (
          <VincularGuiaModal
            fichaId={fichaId}
            pacienteNome={ficha.pacienteNome}
            especialidade={ficha.especialidade}
            onClose={() => setShowVincularModal(false)}
            onSuccess={handleVincularSuccess}
            isOpen={showVincularModal}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
