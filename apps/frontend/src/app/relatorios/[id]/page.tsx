// apps/frontend/src/app/relatorios/[id]/page.tsx - VERSÃO MELHORADA

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  FileBarChart,
  Calendar,
  User,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  PieChart,
  Eye,
  FileText,
  Link,
  Hash,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { DataTable } from "@/components/clinical/ui/DataTable";
import relatorioService from "@/services/relatorio";
import {
  RelatorioDto,
  RelatorioDataDto,
  RelatorioItemDto,
  StatusRelatorioEnum,
  RelatorioLogDto,
} from "@/types/relatorio";
import { formatDate, formatDateTime } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { RelatorioDataComponent } from "@/components/relatorio/RelatorioDataComponent";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Componente para badge de status
const StatusBadge = ({ status }: { status: StatusRelatorioEnum }) => {
  const getStatusConfig = (status: StatusRelatorioEnum) => {
    switch (status) {
      case StatusRelatorioEnum.CONCLUIDO:
        return {
          label: "Concluído",
          className: "bg-green-100 text-green-800",
          icon: CheckCircle,
        };
      case StatusRelatorioEnum.PROCESSANDO:
        return {
          label: "Processando",
          className: "bg-yellow-100 text-yellow-800",
          icon: Clock,
        };
      case StatusRelatorioEnum.ERRO:
        return {
          label: "Erro",
          className: "bg-red-100 text-red-800",
          icon: XCircle,
        };
      case StatusRelatorioEnum.CANCELADO:
        return {
          label: "Cancelado",
          className: "bg-gray-100 text-gray-800",
          icon: AlertCircle,
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-800",
          icon: AlertCircle,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${config.className}`}>
      <Icon className="h-4 w-4 mr-2" />
      {config.label}
    </span>
  );
};

// Componente melhorado para tabela de dados
const RelatorioTable = ({ dados }: { dados: RelatorioDataDto }) => {
  const columns = [
    {
      header: "Tipo",
      accessor: "tipoEntidade" as keyof RelatorioItemDto,
      className: "text-center font-medium",
    },
    {
      header: "Identificação",
      accessor: ((item: RelatorioItemDto) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">
            {item.pacienteNome || "N/A"}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            {item.codigoFicha && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">
                F:{item.codigoFicha}
              </span>
            )}
            {item.numeroGuia && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-mono">
                G:{item.numeroGuia}
              </span>
            )}
          </div>
          {item.codigoFicha && item.numeroGuia && (
            <div className="flex items-center text-xs text-gray-500">
              <Link className="h-3 w-3 mr-1" />
              Ficha vinculada à Guia
            </div>
          )}
        </div>
      )) as any,
    },
    {
      header: "Convênio & Especialidade",
      accessor: ((item: RelatorioItemDto) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">
            {item.convenioNome || "N/A"}
          </div>
          <div className="text-sm text-gray-600">
            {item.especialidade || "N/A"}
          </div>
        </div>
      )) as any,
    },
    {
      header: "Status",
      accessor: ((item: RelatorioItemDto) => (
        <div className="space-y-1">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {item.status}
          </span>
          {item.statusFicha &&
            item.statusGuia &&
            item.statusFicha !== item.statusGuia && (
              <div className="text-xs text-gray-500">
                F: {item.statusFicha} | G: {item.statusGuia}
              </div>
            )}
        </div>
      )) as any,
    },
    {
      header: "Responsável",
      accessor: ((item: RelatorioItemDto) => (
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-gray-400" />
          <span className="text-sm">
            {item.usuarioResponsavelNome || "N/A"}
          </span>
        </div>
      )) as any,
    },
    {
      header: "Atualização",
      accessor: ((item: RelatorioItemDto) => (
        <div className="text-sm text-gray-600">
          {formatDateTime(item.dataAtualizacao)}
        </div>
      )) as any,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Registros Detalhados ({dados.itens.length})
        </h3>
      </div>
      <DataTable
        data={{
          content: dados.itens,
          totalElements: dados.itens.length,
          totalPages: 1,
          size: dados.itens.length,
          number: 0,
          first: true,
          last: true,
          numberOfElements: dados.itens.length,
        }}
        columns={columns}
        onPageChange={() => {}}
      />
    </div>
  );
};

export default function RelatorioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const relatorioId = params.id as string;

  // Estados principais
  const [relatorio, setRelatorio] = useState<RelatorioDto | null>(null);
  const [dadosRelatorio, setDadosRelatorio] = useState<RelatorioDataDto | null>(
    null
  );
  const [logs, setLogs] = useState<RelatorioLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDados, setLoadingDados] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "visao-geral" | "dados" | "graficos" | "logs"
  >("visao-geral");

  // Carregar dados iniciais
  useEffect(() => {
    if (relatorioId) {
      loadRelatorio();
    }
  }, [relatorioId]);

  // Carregar dados específicos baseado na aba ativa
  useEffect(() => {
    if (!relatorio) return;

    if (activeTab === "dados" && !dadosRelatorio) {
      loadDadosRelatorio();
    }
    if (activeTab === "logs" && logs.length === 0) {
      loadLogs();
    }
  }, [activeTab, relatorio]);

  const loadRelatorio = async () => {
    try {
      setLoading(true);
      setError(null);

      const relatorioData =
        await relatorioService.getRelatorioById(relatorioId);
      setRelatorio(relatorioData);
    } catch (err: any) {
      console.error("Erro ao carregar relatório:", err);
      setError(err.response?.data?.message || "Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  };

  const loadDadosRelatorio = async () => {
    try {
      setLoadingDados(true);
      const dados = await relatorioService.getDadosRelatorio(relatorioId);
      setDadosRelatorio(dados);
    } catch (err: any) {
      console.error("Erro ao carregar dados do relatório:", err);
      toastUtil.error("Erro ao carregar dados do relatório");
    } finally {
      setLoadingDados(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const logsData = await relatorioService.getLogsRelatorio(relatorioId);
      setLogs(logsData);
    } catch (err: any) {
      console.error("Erro ao carregar logs:", err);
      toastUtil.error("Erro ao carregar logs do relatório");
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (relatorio?.statusRelatorio !== StatusRelatorioEnum.CONCLUIDO) {
        toastUtil.warning("Relatório ainda está sendo processado");
        return;
      }

      const blob = await relatorioService.baixarRelatorioPDF(relatorioId);
      const filename = `relatorio-${relatorio.titulo.replace(/[^a-zA-Z0-9]/g, "-")}-${formatDate(relatorio.createdAt)}.pdf`;
      relatorioService.downloadFile(blob, filename);
      toastUtil.success("Download iniciado!");
    } catch (error: any) {
      toastUtil.error("Erro ao baixar relatório");
    }
  };

  const handleReprocessar = async () => {
    const confirmacao = window.confirm(
      "Tem certeza que deseja reprocessar este relatório? Os dados atuais serão substituídos."
    );

    if (confirmacao) {
      try {
        await relatorioService.reprocessarRelatorio(relatorioId);
        toastUtil.success("Reprocessamento iniciado!");
        await loadRelatorio();
      } catch (error: any) {
        toastUtil.error("Erro ao reprocessar relatório");
      }
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-20">
          <div className="max-w-7xl mx-auto p-6">
            <Loading message="Carregando relatório..." />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !relatorio) {
    return (
      <ProtectedRoute>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-20">
          <div className="max-w-7xl mx-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                Erro ao Carregar Relatório
              </h2>
              <p className="text-red-600 mb-4">
                {error || "Relatório não encontrado"}
              </p>
              <CustomButton variant="primary" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </CustomButton>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header melhorado */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start">
              <CustomButton
                variant="secondary"
                onClick={() => router.back()}
                className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </CustomButton>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                  <FileBarChart className="mr-3 h-8 w-8 text-primary" />
                  {relatorio.titulo}
                </h1>
                <p className="text-gray-600 mt-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Gerado por {relatorio.usuarioGeradorNome} em{" "}
                  {formatDateTime(relatorio.createdAt)}
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(relatorio.periodoInicio)} -{" "}
                    {formatDate(relatorio.periodoFim)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Hash className="h-4 w-4 mr-1" />
                    {relatorio.totalRegistros} registros
                  </div>
                  <StatusBadge status={relatorio.statusRelatorio} />
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              {relatorio.statusRelatorio === StatusRelatorioEnum.CONCLUIDO && (
                <CustomButton variant="primary" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </CustomButton>
              )}

              <CustomButton
                variant="secondary"
                onClick={() =>
                  router.push(`/relatorios/${relatorioId}/compartilhar`)
                }>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </CustomButton>

              {relatorio.statusRelatorio === StatusRelatorioEnum.ERRO && (
                <CustomButton variant="secondary" onClick={handleReprocessar}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reprocessar
                </CustomButton>
              )}
            </div>
          </div>

          {/* Navegação por tabs melhorada */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab("visao-geral")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "visao-geral"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  <Eye className="h-4 w-4 mr-2 inline" />
                  Visão Geral
                </button>

                {relatorio.statusRelatorio ===
                  StatusRelatorioEnum.CONCLUIDO && (
                  <>
                    <button
                      onClick={() => setActiveTab("dados")}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "dados"
                          ? "border-primary text-primary"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}>
                      <FileText className="h-4 w-4 mr-2 inline" />
                      Dados Detalhados
                    </button>

                    <button
                      onClick={() => setActiveTab("graficos")}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "graficos"
                          ? "border-primary text-primary"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}>
                      <BarChart3 className="h-4 w-4 mr-2 inline" />
                      Gráficos
                    </button>
                  </>
                )}

                <button
                  onClick={() => setActiveTab("logs")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "logs"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  <Filter className="h-4 w-4 mr-2 inline" />
                  Logs
                </button>
              </nav>
            </div>
          </div>

          {/* Conteúdo das tabs */}
          <div className="space-y-6">
            {activeTab === "visao-geral" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card de informações gerais */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileBarChart className="h-5 w-5 mr-2 text-primary" />
                    Informações do Relatório
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Título:
                      </label>
                      <p className="text-gray-900 font-medium">
                        {relatorio.titulo}
                      </p>
                    </div>

                    {relatorio.descricao && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-600">
                          Descrição:
                        </label>
                        <p className="text-gray-900">{relatorio.descricao}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Período:
                      </label>
                      <p className="text-gray-900">
                        {formatDate(relatorio.periodoInicio)} até{" "}
                        {formatDate(relatorio.periodoFim)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Total de Registros:
                      </label>
                      <p className="text-2xl font-bold text-primary">
                        {relatorio.totalRegistros}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Status:
                      </label>
                      <div className="mt-1">
                        <StatusBadge status={relatorio.statusRelatorio} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Última Atualização:
                      </label>
                      <p className="text-gray-900">
                        {formatDateTime(relatorio.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Filtros aplicados */}
                  {relatorio.filtros &&
                    Object.keys(relatorio.filtros).length > 0 && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          Filtros Aplicados
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {Object.entries(relatorio.filtros).map(
                            ([key, value]) => (
                              <div key={key} className="flex">
                                <span className="font-medium text-gray-600 capitalize mr-2">
                                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                                  :
                                </span>
                                <span className="text-gray-900">
                                  {Array.isArray(value)
                                    ? value.join(", ")
                                    : String(value)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* Card de ações rápidas */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Ações Rápidas
                    </h3>
                    <div className="space-y-3">
                      {relatorio.statusRelatorio ===
                        StatusRelatorioEnum.CONCLUIDO && (
                        <CustomButton
                          variant="primary"
                          onClick={handleDownloadPDF}
                          className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Baixar PDF
                        </CustomButton>
                      )}

                      <CustomButton
                        variant="secondary"
                        onClick={() =>
                          router.push(`/relatorios/${relatorioId}/compartilhar`)
                        }
                        className="w-full">
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </CustomButton>

                      {relatorio.statusRelatorio ===
                        StatusRelatorioEnum.ERRO && (
                        <CustomButton
                          variant="secondary"
                          onClick={handleReprocessar}
                          className="w-full">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reprocessar
                        </CustomButton>
                      )}
                    </div>
                  </div>

                  {/* Card de status */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Status
                    </h3>
                    <div className="text-center">
                      <StatusBadge status={relatorio.statusRelatorio} />
                      <p className="text-sm text-gray-600 mt-2">
                        {relatorio.statusRelatorio ===
                          StatusRelatorioEnum.CONCLUIDO &&
                          "Relatório processado com sucesso"}
                        {relatorio.statusRelatorio ===
                          StatusRelatorioEnum.PROCESSANDO &&
                          "Processando dados..."}
                        {relatorio.statusRelatorio ===
                          StatusRelatorioEnum.ERRO &&
                          "Erro durante o processamento"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "dados" && (
              <div>
                {loadingDados ? (
                  <Loading message="Carregando dados detalhados..." />
                ) : dadosRelatorio ? (
                  <RelatorioDataComponent dados={dadosRelatorio} />
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Nenhum dado disponível para exibição
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "graficos" && (
              <div>
                {loadingDados ? (
                  <Loading message="Carregando gráficos..." />
                ) : dadosRelatorio ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráficos de distribuição */}
                    {dadosRelatorio.distribuicaoPorStatus &&
                      Object.keys(dadosRelatorio.distribuicaoPorStatus).length >
                        0 && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <PieChart className="h-5 w-5 mr-2" />
                            Distribuição por Status
                          </h3>
                          <Pie
                            data={{
                              labels: Object.keys(
                                dadosRelatorio.distribuicaoPorStatus
                              ),
                              datasets: [
                                {
                                  data: Object.values(
                                    dadosRelatorio.distribuicaoPorStatus
                                  ),
                                  backgroundColor: [
                                    "#2EA6B8",
                                    "#58C5D6",
                                    "#A7A9AC",
                                    "#939598",
                                    "#808285",
                                  ],
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              plugins: {
                                legend: { position: "bottom" },
                              },
                            }}
                          />
                        </div>
                      )}

                    {dadosRelatorio.distribuicaoPorConvenio &&
                      Object.keys(dadosRelatorio.distribuicaoPorConvenio)
                        .length > 0 && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2" />
                            Distribuição por Convênio
                          </h3>
                          <Bar
                            data={{
                              labels: Object.keys(
                                dadosRelatorio.distribuicaoPorConvenio
                              ),
                              datasets: [
                                {
                                  label: "Registros",
                                  data: Object.values(
                                    dadosRelatorio.distribuicaoPorConvenio
                                  ),
                                  backgroundColor: "#2EA6B8",
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              plugins: {
                                legend: { display: false },
                              },
                              scales: {
                                y: { beginAtZero: true },
                              },
                            }}
                          />
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Nenhum dado disponível para gráficos
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "logs" && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Logs do Relatório
                  </h3>
                </div>

                <div className="p-6">
                  {loadingLogs ? (
                    <Loading message="Carregando logs..." />
                  ) : logs.length > 0 ? (
                    <div className="space-y-4">
                      {logs.map((log, index) => (
                        <div
                          key={log.id || index}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">
                              {log.acao}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDateTime(log.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <User className="h-4 w-4 inline mr-1" />
                            {log.usuarioNome}
                          </div>
                          {log.detalhes &&
                            Object.keys(log.detalhes).length > 0 && (
                              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(log.detalhes, null, 2)}
                                </pre>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum log encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
