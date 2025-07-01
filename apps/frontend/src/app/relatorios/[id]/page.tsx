// apps/frontend/src/app/relatorios/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useStatus } from "@/hooks/useStatus";
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
  Stethoscope,
  Building,
  Hash,
  ArrowRight,
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
          icon: XCircle,
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
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${config.className}`}>
      <IconComponent className="h-4 w-4 mr-1" />
      {config.label}
    </span>
  );
};

export default function RelatorioDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const { getStatusColor } = useStatus();
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
    loadRelatorio();
  }, [relatorioId]);

  // Carregar dados quando aba mudar
  useEffect(() => {
    if (
      activeTab === "dados" &&
      !dadosRelatorio &&
      relatorio?.statusRelatorio === StatusRelatorioEnum.CONCLUIDO
    ) {
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
        toastUtil.error(
          error.response?.data?.message || "Erro ao reprocessar relatório"
        );
      }
    }
  };

  // Colunas melhoradas para tabela de dados
  const dadosColumns = [
    {
      header: "Tipo/Identificação",
      accessor: ((item: RelatorioItemDto) => (
        <div className="space-y-2">
          {/* Badge do tipo */}
          <div className="flex items-center">
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                item.tipoEntidade === "FICHA"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : item.tipoEntidade === "GUIA"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-gray-100 text-gray-800 border border-gray-200"
              }`}>
              {item.tipoEntidade === "FICHA" && (
                <FileText className="h-3 w-3 mr-1" />
              )}
              {item.tipoEntidade === "GUIA" && (
                <Hash className="h-3 w-3 mr-1" />
              )}
              {item.tipoEntidade}
            </span>
          </div>

          {/* Código/Número principal */}
          <div className="font-mono text-sm font-semibold">
            {item.tipoEntidade === "FICHA" && item.codigoFicha && (
              <div className="text-blue-700">Código: {item.codigoFicha}</div>
            )}
            {item.tipoEntidade === "GUIA" && item.numeroGuia && (
              <div className="text-green-700">Nº Guia: {item.numeroGuia}</div>
            )}
          </div>

          {/* Vinculação para fichas */}
          {item.tipoEntidade === "FICHA" && item.numeroGuia && (
            <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <ArrowRight className="h-3 w-3 mr-1" />
              Vinculada à Guia:{" "}
              <span className="font-mono ml-1">{item.numeroGuia}</span>
            </div>
          )}
        </div>
      )) as any,
      className: "min-w-[200px]",
    },
    {
      header: "Paciente",
      accessor: ((item: RelatorioItemDto) => (
        <div className="space-y-1">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium text-gray-900">
              {item.pacienteNome || (
                <span className="text-red-500 text-sm italic">
                  Não informado
                </span>
              )}
            </span>
          </div>
          {item.pacienteId && (
            <div className="text-xs text-gray-500 font-mono pl-6">
              ID: {item.pacienteId.substring(0, 8)}...
            </div>
          )}
        </div>
      )) as any,
      className: "min-w-[180px]",
    },
    {
      header: "Convênio",
      accessor: ((item: RelatorioItemDto) => (
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-gray-400" />
          {item.convenioNome &&
          item.convenioNome !== "Convênio não informado" ? (
            <span className="font-medium">{item.convenioNome}</span>
          ) : (
            <span className="text-red-500 text-sm italic flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Não informado
            </span>
          )}
        </div>
      )) as any,
      className: "min-w-[150px]",
    },
    {
      header: "Status",
      accessor: ((item: RelatorioItemDto) => (
        <div className="space-y-2">
          {/* Status atual usando o hook useStatus */}
          <span
            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
              item.status
            )}`}>
            {item.status || "Não informado"}
          </span>

          {/* Mudança de status */}
          {item.statusAnterior && item.statusNovo && (
            <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
              <div className="flex items-center">
                <span className="text-gray-500">{item.statusAnterior}</span>
                <ArrowRight className="h-3 w-3 mx-1" />
                <span className="font-medium">{item.statusNovo}</span>
              </div>
              {item.dataMudancaStatus && (
                <div className="text-xs text-gray-500 mt-1">
                  {formatDateTime(item.dataMudancaStatus)}
                </div>
              )}
            </div>
          )}
        </div>
      )) as any,
      className: "min-w-[160px]",
    },
    {
      header: "Especialidade",
      accessor: ((item: RelatorioItemDto) => (
        <div className="flex items-center">
          <Stethoscope className="h-4 w-4 mr-2 text-gray-400" />
          <span
            className={
              item.especialidade && item.especialidade !== "Não informado"
                ? "text-gray-900"
                : "text-gray-400 italic"
            }>
            {item.especialidade || "N/A"}
          </span>
        </div>
      )) as any,
      className: "min-w-[140px]",
    },
    {
      header: "Responsável",
      accessor: ((item: RelatorioItemDto) => (
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-gray-400" />
          <span
            className={
              item.usuarioResponsavelNome
                ? "text-gray-900"
                : "text-gray-400 italic"
            }>
            {item.usuarioResponsavelNome || "Não informado"}
          </span>
        </div>
      )) as any,
      className: "min-w-[140px]",
    },
    {
      header: "Última Atualização",
      accessor: ((item: RelatorioItemDto) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            {formatDateTime(item.dataAtualizacao)}
          </div>
          {item.motivoMudanca && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <strong>Motivo:</strong> {item.motivoMudanca}
            </div>
          )}
        </div>
      )) as any,
      className: "min-w-[180px]",
    },
  ];

  // Colunas para tabela de logs
  const logsColumns = [
    {
      header: "Ação",
      accessor: "acao" as keyof RelatorioLogDto,
      className: "font-medium",
    },
    {
      header: "Usuário",
      accessor: "usuarioNome" as keyof RelatorioLogDto,
    },
    {
      header: "IP",
      accessor: "ipAddress" as keyof RelatorioLogDto,
    },
    {
      header: "Data/Hora",
      accessor: ((log: RelatorioLogDto) =>
        formatDateTime(log.createdAt)) as any,
    },
  ];

  // Componente de estatísticas melhorado
  const EstatisticasCard: React.FC<{ dadosRelatorio: RelatorioDataDto }> = ({
    dadosRelatorio,
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total de Registros */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Total de Registros
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {dadosRelatorio.totalRegistros}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Registros processados no período
            </p>
          </div>
          <FileText className="h-8 w-8 text-blue-500" />
        </div>
      </div>

      {/* Distribuição por Convênio */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Convênios Ativos
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {Object.keys(dadosRelatorio.distribuicaoPorConvenio || {}).length}
            </p>
          </div>
          <Building className="h-6 w-6 text-green-500" />
        </div>
        <div className="space-y-2 max-h-24 overflow-y-auto">
          {Object.entries(dadosRelatorio.distribuicaoPorConvenio || {})
            .slice(0, 3)
            .map(([convenio, count]) => (
              <div key={convenio} className="flex justify-between text-sm">
                <span className="text-gray-700 truncate" title={convenio}>
                  {convenio.length > 15
                    ? `${convenio.substring(0, 15)}...`
                    : convenio}
                </span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          {Object.keys(dadosRelatorio.distribuicaoPorConvenio || {}).length >
            3 && (
            <div className="text-xs text-gray-500 italic">
              +
              {Object.keys(dadosRelatorio.distribuicaoPorConvenio || {})
                .length - 3}{" "}
              mais...
            </div>
          )}
        </div>
      </div>

      {/* Distribuição por Status */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Status Únicos</p>
            <p className="text-3xl font-bold text-gray-900">
              {Object.keys(dadosRelatorio.distribuicaoPorStatus || {}).length}
            </p>
          </div>
          <CheckCircle className="h-6 w-6 text-yellow-500" />
        </div>
        <div className="space-y-2 max-h-24 overflow-y-auto">
          {Object.entries(dadosRelatorio.distribuicaoPorStatus || {})
            .slice(0, 3)
            .map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm">
                <span className="text-gray-700 truncate" title={status}>
                  {status.length > 15
                    ? `${status.substring(0, 15)}...`
                    : status}
                </span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          {Object.keys(dadosRelatorio.distribuicaoPorStatus || {}).length >
            3 && (
            <div className="text-xs text-gray-500 italic">
              +
              {Object.keys(dadosRelatorio.distribuicaoPorStatus || {}).length -
                3}{" "}
              mais...
            </div>
          )}
        </div>
      </div>

      {/* Distribuição por Especialidade */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Especialidades</p>
            <p className="text-3xl font-bold text-gray-900">
              {
                Object.keys(dadosRelatorio.distribuicaoPorEspecialidade || {})
                  .length
              }
            </p>
          </div>
          <Stethoscope className="h-6 w-6 text-purple-500" />
        </div>
        <div className="space-y-2 max-h-24 overflow-y-auto">
          {Object.entries(dadosRelatorio.distribuicaoPorEspecialidade || {})
            .slice(0, 3)
            .map(([especialidade, count]) => (
              <div key={especialidade} className="flex justify-between text-sm">
                <span className="text-gray-700 truncate" title={especialidade}>
                  {especialidade.length > 15
                    ? `${especialidade.substring(0, 15)}...`
                    : especialidade}
                </span>
                <span className="font-medium text-gray-900">{count}</span>
              </div>
            ))}
          {Object.keys(dadosRelatorio.distribuicaoPorEspecialidade || {})
            .length > 3 && (
            <div className="text-xs text-gray-500 italic">
              +
              {Object.keys(dadosRelatorio.distribuicaoPorEspecialidade || {})
                .length - 3}{" "}
              mais...
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Configuração dos gráficos
  const getChartData = () => {
    if (!dadosRelatorio) return null;

    // Gráfico de distribuição por status
    const statusData = {
      labels: Object.keys(dadosRelatorio.distribuicaoPorStatus),
      datasets: [
        {
          data: Object.values(dadosRelatorio.distribuicaoPorStatus),
          backgroundColor: [
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#3B82F6",
            "#8B5CF6",
            "#F97316",
          ],
          borderWidth: 1,
        },
      ],
    };

    // Gráfico de distribuição por especialidade
    const especialidadeData = {
      labels: Object.keys(dadosRelatorio.distribuicaoPorEspecialidade),
      datasets: [
        {
          label: "Quantidade",
          data: Object.values(dadosRelatorio.distribuicaoPorEspecialidade),
          backgroundColor: "#3B82F6",
          borderColor: "#1D4ED8",
          borderWidth: 1,
        },
      ],
    };

    return { statusData, especialidadeData };
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando relatório..." />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !relatorio) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {error || "Relatório não encontrado"}
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const chartData = getChartData();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          {/* Header */}
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
                  <FileBarChart className="mr-2 h-6 w-6" />
                  {relatorio.titulo}
                </h1>
                <p className="text-gray-600 mt-1">
                  Detalhes e dados do relatório
                </p>
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
                variant="primary"
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

          {/* Navegação por tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab("visao-geral")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === "visao-geral"
                      ? "border-blue-500 text-blue-600"
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
                      className={`px-6 py-3 text-sm font-medium border-b-2 ${
                        activeTab === "dados"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}>
                      <FileText className="h-4 w-4 mr-2 inline" />
                      Dados ({relatorio.totalRegistros})
                    </button>

                    <button
                      onClick={() => setActiveTab("graficos")}
                      className={`px-6 py-3 text-sm font-medium border-b-2 ${
                        activeTab === "graficos"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}>
                      <BarChart3 className="h-4 w-4 mr-2 inline" />
                      Gráficos
                    </button>
                  </>
                )}

                <button
                  onClick={() => setActiveTab("logs")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === "logs"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  <FileText className="h-4 w-4 mr-2 inline" />
                  Logs
                </button>
              </nav>
            </div>

            {/* Conteúdo das abas */}
            <div className="p-6">
              {/* Aba Visão Geral */}
              {activeTab === "visao-geral" && (
                <div className="space-y-6">
                  {/* Informações básicas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Status
                          </p>
                          <StatusBadge status={relatorio.statusRelatorio} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Criado por
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {relatorio.usuarioGeradorNome}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Período
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDate(relatorio.periodoInicio)} a{" "}
                            {formatDate(relatorio.periodoFim)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Total de Registros
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {relatorio.totalRegistros.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Descrição e filtros */}
                  {relatorio.descricao && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Descrição
                      </h3>
                      <p className="text-gray-700">{relatorio.descricao}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Filter className="h-5 w-5 mr-2" />
                      Filtros Aplicados
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(relatorio.filtros).map(([key, value]) => {
                        if (
                          !value ||
                          (Array.isArray(value) && value.length === 0)
                        )
                          return null;

                        return (
                          <div key={key} className="flex">
                            <span className="font-medium text-gray-600 capitalize mr-2">
                              {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                            </span>
                            <span className="text-gray-800">
                              {Array.isArray(value)
                                ? value.join(", ")
                                : String(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Informações do Sistema
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">
                          Criado em:
                        </span>
                        <span className="ml-2 text-gray-800">
                          {formatDateTime(relatorio.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">
                          Atualizado em:
                        </span>
                        <span className="ml-2 text-gray-800">
                          {formatDateTime(relatorio.updatedAt)}
                        </span>
                      </div>
                      {relatorio.hashCompartilhamento && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">
                            Hash de compartilhamento:
                          </span>
                          <code className="ml-2 text-xs bg-white px-2 py-1 rounded border">
                            {relatorio.hashCompartilhamento}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Aba Dados */}
              {activeTab === "dados" && (
                <div>
                  {loadingDados ? (
                    <Loading message="Carregando dados do relatório..." />
                  ) : dadosRelatorio ? (
                    <div className="space-y-6">
                      {/* Estatísticas melhoradas */}
                      <EstatisticasCard dadosRelatorio={dadosRelatorio} />

                      {/* Tabela de dados */}
                      <div className="bg-white border rounded-lg">
                        <div className="p-4 border-b">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Dados Detalhados
                          </h3>
                        </div>
                        <div className="overflow-x-auto">
                          <DataTable
                            data={{
                              content: dadosRelatorio.itens || [],
                              totalElements: dadosRelatorio.itens?.length || 0,
                              totalPages: 1,
                              size: dadosRelatorio.itens?.length || 0,
                              number: 0,
                              numberOfElements:
                                dadosRelatorio.itens?.length || 0,
                              first: true,
                              last: true,
                            }}
                            columns={dadosColumns}
                            loading={false}
                            onPageChange={() => {}}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Dados não disponíveis</p>
                    </div>
                  )}
                </div>
              )}

              {/* Aba Gráficos */}
              {activeTab === "graficos" && (
                <div>
                  {loadingDados ? (
                    <Loading message="Carregando gráficos..." />
                  ) : chartData ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Gráfico de pizza - Status */}
                        <div className="bg-white border rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <PieChart className="h-5 w-5 mr-2" />
                            Distribuição por Status
                          </h3>
                          <div className="h-64">
                            <Pie
                              data={chartData.statusData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: "bottom",
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>

                        {/* Gráfico de barras - Especialidades */}
                        <div className="bg-white border rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2" />
                            Distribuição por Especialidade
                          </h3>
                          <div className="h-64">
                            <Bar
                              data={chartData.especialidadeData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    display: false,
                                  },
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      precision: 0,
                                    },
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tabelas de distribuição */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Distribuição por Status */}
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            Por Status
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(
                              dadosRelatorio?.distribuicaoPorStatus || {}
                            ).map(([status, count]) => (
                              <div
                                key={status}
                                className="flex justify-between">
                                <span className="text-sm text-gray-600">
                                  {status}
                                </span>
                                <span className="text-sm font-medium">
                                  {count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Distribuição por Convênio */}
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            Por Convênio
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(
                              dadosRelatorio?.distribuicaoPorConvenio || {}
                            ).map(([convenio, count]) => (
                              <div
                                key={convenio}
                                className="flex justify-between">
                                <span className="text-sm text-gray-600 truncate">
                                  {convenio}
                                </span>
                                <span className="text-sm font-medium">
                                  {count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Distribuição por Unidade */}
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            Por Unidade
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(
                              dadosRelatorio?.distribuicaoPorUnidade || {}
                            ).map(([unidade, count]) => (
                              <div
                                key={unidade}
                                className="flex justify-between">
                                <span className="text-sm text-gray-600">
                                  {unidade}
                                </span>
                                <span className="text-sm font-medium">
                                  {count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Gráficos não disponíveis</p>
                    </div>
                  )}
                </div>
              )}

              {/* Aba Logs */}
              {activeTab === "logs" && (
                <div>
                  {loadingLogs ? (
                    <Loading message="Carregando logs..." />
                  ) : (
                    <div className="bg-white border rounded-lg">
                      <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Histórico de Ações
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {logs.length} registros encontrados
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <DataTable
                          data={{
                            content: logs,
                            totalElements: logs.length,
                            totalPages: 1,
                            size: logs.length,
                            number: 0,
                            numberOfElements: logs.length,
                            first: true,
                            last: true,
                          }}
                          columns={logsColumns}
                          loading={false}
                          onPageChange={() => {}}
                        />
                      </div>
                    </div>
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
