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
  History,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { DataTable } from "@/components/clinical/ui/DataTable";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { guiaService } from "@/services/clinical";
import {
  GuiaDto,
  FichaSummaryDto,
  StatusHistoryDto,
  PageResponse,
} from "@/types/clinical";
import { formatDate, formatDateTime, calculateAge } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

export default function GuiaDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const guiaId = params.id as string;

  // Estados principais
  const [guia, setGuia] = useState<GuiaDto | null>(null);
  const [fichas, setFichas] = useState<PageResponse<FichaSummaryDto>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
  });

  const [historicoStatus, setHistoricoStatus] = useState<StatusHistoryDto[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "fichas" | "historico">(
    "info"
  );
  const [fichasPage, setFichasPage] = useState(0);

  // Carregar dados da guia
  useEffect(() => {
    if (guiaId) {
      loadGuiaData();
    }
  }, [guiaId]);

  // Recarregar fichas quando a página mudar
  useEffect(() => {
    if (guiaId && activeTab === "fichas") {
      loadFichas();
    }
  }, [guiaId, fichasPage, activeTab]);

  const loadGuiaData = async () => {
    try {
      setLoading(true);
      setError(null);

      const guiaData = await guiaService.getGuiaById(guiaId);
      setGuia(guiaData);

      const historico = await guiaService.getHistoricoStatusGuia(guiaId);
      setHistoricoStatus(historico);

      loadFichas(); // Carregar fichas após carregar a guia
    } catch (err) {
      console.error("Erro ao carregar dados da guia:", err);
      setError("Erro ao carregar informações da guia");
    } finally {
      setLoading(false);
    }
  };

  const loadFichas = async () => {
    try {
      const fichasData = await guiaService.getFichasByGuiaId(
        guiaId,
        fichasPage,
        10
      );

      setFichas(fichasData);
    } catch (err) {
      console.error("Erro ao carregar fichas:", err);
      toastUtil.error("Erro ao carregar fichas");
    }
  };

  const handleFichasPageChange = (page: number) => {
    setFichasPage(page);
  };

  const handleDuplicateGuia = () => {
    if (guia) {
      router.push(`/guias/novo?duplicate=${guiaId}`);
    }
  };

  const handleDeleteGuia = async () => {
    if (!guia) return;

    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir a guia ${guia.numeroGuia}?`
    );

    if (confirmacao) {
      try {
        await guiaService.deleteGuia(guiaId);
        toastUtil.success("Guia excluída com sucesso!");
        router.push("/guias");
      } catch (err: any) {
        toastUtil.error(err.response?.data?.message || "Erro ao excluir guia");
      }
    }
  };

  // Colunas para tabela de fichas
  const fichasColumns = [
    {
      header: "Código",
      accessor: "codigoFicha" as keyof FichaSummaryDto,
      className: "font-medium",
    },
    {
      header: "Especialidade",
      accessor: "especialidade" as keyof FichaSummaryDto,
    },
    {
      header: "Status",
      accessor: ((ficha: FichaSummaryDto) => (
        <StatusBadge status={ficha.status} />
      )) as any,
    },
    {
      header: "Quantidade",
      accessor: "quantidadeAutorizada" as keyof FichaSummaryDto,
      className: "text-center",
    },
    {
      header: "Responsável",
      accessor: "usuarioResponsavelNome" as keyof FichaSummaryDto,
    },
    {
      header: "Ações",
      accessor: ((ficha: FichaSummaryDto) => (
        <div className="flex space-x-2">
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/fichas/${ficha.id}`)}>
            <Eye className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/fichas/${ficha.id}/editar`)}>
            <Edit className="h-4 w-4" />
          </CustomButton>
        </div>
      )) as any,
    },
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Loading message="Carregando dados da guia..." />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !guia) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {error || "Guia não encontrada"}
              </h2>
              <CustomButton onClick={() => router.push("/guias")}>
                Voltar para Guias
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
                  onClick={() => router.push("/guias")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </CustomButton>

                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <FileText className="h-8 w-8 mr-3 text-blue-600" />
                    Guia #{guia.numeroGuia}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {guia.pacienteNome} - {guia.convenioNome}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CustomButton variant="primary" onClick={handleDuplicateGuia}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </CustomButton>

                <CustomButton
                  variant="primary"
                  onClick={() => router.push(`/guias/${guiaId}/editar`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </CustomButton>

                <CustomButton variant="primary" onClick={handleDeleteGuia}>
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
                  onClick={() => setActiveTab("fichas")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === "fichas"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  Fichas ({fichas?.totalElements || 0})
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
                  {/* Status e informações básicas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Status da Guia
                          </h3>
                          <StatusBadge status={guia.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              Número da Guia
                            </p>
                            <p className="font-medium">{guia.numeroGuia}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Número da Venda
                            </p>
                            <p className="font-medium">
                              {guia.numeroVenda || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Validade</p>
                            <p
                              className={`font-medium ${
                                new Date(guia.validade) < new Date()
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}>
                              {formatDate(guia.validade)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Período</p>
                            <p className="font-medium">
                              {String(guia.mes).padStart(2, "0")}/{guia.ano}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Lote</p>
                            <p className="font-medium">{guia.lote || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <DollarSign className="mr-2 h-5 w-5" />
                          Valores
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Valor Total</p>
                            <p className="font-medium text-xl text-green-600">
                              R$ {guia.valorReais.toFixed(2)}
                            </p>
                          </div>
                          {/* REMOVIDO: Quantidade Autorizada Global */}
                          <div>
                            <p className="text-sm text-gray-600">
                              Quantidade Faturada
                            </p>
                            <p className="font-medium">
                              {guia.quantidadeFaturada}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Paciente */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Informações do Paciente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Nome</p>
                        <p className="font-medium">{guia.pacienteNome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Convênio</p>
                        <p className="font-medium">{guia.convenioNome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Responsável pela Guia
                        </p>
                        <p className="font-medium">
                          {guia.usuarioResponsavelNome}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Especialidades e Quantidades (Tabela Nova) */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Building className="mr-2 h-5 w-5" />
                      Especialidades Autorizadas
                    </h3>

                    {guia.itens && guia.itens.length > 0 ? (
                      <div className="overflow-hidden border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Especialidade
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Qtd. Autorizada
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {guia.itens.map((item, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                  {item.especialidade}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 text-right font-medium">
                                  {item.quantidade}
                                </td>
                              </tr>
                            ))}
                            {/* Linha de Total */}
                            <tr className="bg-gray-50">
                              <td className="px-6 py-3 text-sm font-bold text-gray-900">
                                Total
                              </td>
                              <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">
                                {guia.itens.reduce(
                                  (acc, curr) => acc + curr.quantidade,
                                  0
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Nenhuma especialidade registrada.
                      </p>
                    )}
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
                          {formatDateTime(guia.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Última atualização
                        </p>
                        <p className="font-medium">
                          {formatDateTime(guia.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "fichas" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Fichas da Guia
                    </h3>
                    <CustomButton
                      onClick={() =>
                        router.push(`/fichas/novo?guiaId=${guiaId}`)
                      }>
                      <FileText className="h-4 w-4 mr-2" />
                      Nova Ficha
                    </CustomButton>
                  </div>

                  <DataTable
                    data={fichas}
                    columns={fichasColumns}
                    onPageChange={handleFichasPageChange}
                    loading={false}
                  />
                </div>
              )}

              {/* Histórico */}
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
                      {historicoStatus.map((item, index) => (
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
      </div>
    </ProtectedRoute>
  );
}
