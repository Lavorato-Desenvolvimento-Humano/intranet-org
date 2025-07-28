"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FichaPdfJobDto,
  FichaPdfEstatisticasDto,
  StatusJobEnum,
  fichaPdfHelpers,
} from "@/types/fichaPdf";
import fichaPdfService from "@/services/ficha-pdf";
import { toast } from "react-hot-toast";
import {
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Plus,
  RefreshCw,
  BarChart3,
  Settings,
  Users,
  Calendar,
  AlertTriangle,
  Trash2,
} from "lucide-react";

export default function FichasPdfPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<FichaPdfJobDto[]>([]);
  const [estatisticas, setEstatisticas] =
    useState<FichaPdfEstatisticasDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriodo, setSelectedPeriodo] = useState<{
    mes?: number;
    ano?: number;
  }>({});

  useEffect(() => {
    carregarDados();
  }, [selectedPeriodo]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [jobsData, estatisticasData] = await Promise.all([
        fichaPdfService.getJobsUsuario(),
        fichaPdfService.getEstatisticas(
          selectedPeriodo.mes,
          selectedPeriodo.ano
        ),
      ]);

      setJobs(jobsData);
      setEstatisticas(estatisticasData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados das fichas PDF.");
    } finally {
      setLoading(false);
    }
  };

  const atualizarDados = async () => {
    try {
      setRefreshing(true);
      await carregarDados();
      toast.success("Dados atualizados com sucesso.");
    } catch (error) {
      toast.error("Erro ao atualizar dados.");
    } finally {
      setRefreshing(false);
    }
  };

  const baixarPdf = async (job: FichaPdfJobDto) => {
    try {
      await fichaPdfService.baixarESalvarPdf(
        job.jobId,
        `fichas_${fichaPdfHelpers.formatarMesAno(
          new Date().getMonth() + 1,
          new Date().getFullYear()
        )}_${job.jobId}.pdf`
      );
      toast.success("PDF baixado com sucesso.");
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      toast.error("Erro ao baixar PDF.");
    }
  };

  const cancelarJob = async (jobId: string) => {
    try {
      await fichaPdfService.cancelarJob(jobId);
      toast.success("Job cancelado com sucesso.");
      await carregarDados();
    } catch (error) {
      console.error("Erro ao cancelar job:", error);
      toast.error("Erro ao cancelar job.");
    }
  };

  const getStatusIcon = (status: StatusJobEnum) => {
    switch (status) {
      case StatusJobEnum.CONCLUIDO:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case StatusJobEnum.PROCESSANDO:
      case StatusJobEnum.INICIADO:
        return <Clock className="h-5 w-5 text-blue-600" />;
      case StatusJobEnum.ERRO:
        return <XCircle className="h-5 w-5 text-red-600" />;
      case StatusJobEnum.CANCELADO:
        return <Ban className="h-5 w-5 text-gray-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const renderEstatisticas = () => {
    if (!estatisticas) return null;

    const totalFichas = estatisticas.totalFichasGeradas ?? 0;
    const conveniosAtivos = estatisticas.conveniosAtivos ?? 0;
    const jobsConcluidos = estatisticas.jobsConcluidos ?? 0;
    const jobsEmAndamento = estatisticas.jobsEmAndamento ?? 0;
    const jobsComErro = estatisticas.jobsComErro ?? 0;
    const taxaSucesso = estatisticas.taxaSucesso ?? 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total de Fichas
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalFichas.toLocaleString()}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Convênios Ativos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {conveniosAtivos.toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Jobs Concluídos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {jobsConcluidos.toLocaleString()}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Taxa de Sucesso
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {(taxaSucesso * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                {jobsEmAndamento.toLocaleString()} processando,{" "}
                {jobsComErro.toLocaleString()} com erro
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>
    );
  };

  const renderJobsTable = () => {
    if (jobs.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum job encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Você ainda não gerou nenhuma ficha PDF. Comece criando uma nova
            geração.
          </p>
          <button
            onClick={() => router.push("/fichas-pdf/novo")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4 inline mr-2" />
            Nova Geração
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Histórico de Gerações
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fichas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progresso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Iniciado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(job.status)}
                      <span
                        className={`ml-2 text-sm font-medium ${fichaPdfHelpers.getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fichaPdfHelpers.getTipoGeracaoLabel(job.tipo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.fichasProcessadas}/{job.totalFichas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            job.status === StatusJobEnum.CONCLUIDO
                              ? "bg-green-500"
                              : job.status === StatusJobEnum.ERRO
                                ? "bg-red-500"
                                : "bg-blue-500"
                          }`}
                          style={{ width: `${job.progresso}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round(job.progresso)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fichaPdfHelpers.formatarDataHora(job.iniciado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {job.podeDownload &&
                        job.status === StatusJobEnum.CONCLUIDO && (
                          <button
                            onClick={() => baixarPdf(job)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Baixar PDF">
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      {(job.status === StatusJobEnum.INICIADO ||
                        job.status === StatusJobEnum.PROCESSANDO) && (
                        <button
                          onClick={() => cancelarJob(job.jobId)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Cancelar">
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          router.push(`/fichas-pdf/job/${job.jobId}`)
                        }
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        title="Ver detalhes">
                        <BarChart3 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fichas PDF</h1>
          <p className="text-gray-600">
            Gerencie e monitore a geração de fichas PDF para pacientes e
            convênios
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={atualizarDados}
            disabled={refreshing}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center">
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Atualizar
          </button>
          <button
            onClick={() => router.push("/fichas-pdf/estatisticas")}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Estatísticas
          </button>
          <button
            onClick={() => router.push("/fichas-pdf/configuracoes")}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </button>
          <button
            onClick={() => router.push("/fichas-pdf/novo")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Nova Geração
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      {renderEstatisticas()}

      {/* Filtros de período */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            Filtrar por período:
          </span>
          <select
            value={selectedPeriodo.mes || ""}
            onChange={(e) =>
              setSelectedPeriodo((prev) => ({
                ...prev,
                mes: e.target.value ? parseInt(e.target.value) : undefined,
              }))
            }
            className="border border-gray-300 rounded-md px-3 py-1 text-sm">
            <option value="">Todos os meses</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
              <option key={mes} value={mes}>
                {fichaPdfHelpers.formatarMesAno(mes, 2024).split(" ")[0]}
              </option>
            ))}
          </select>
          <select
            value={selectedPeriodo.ano || ""}
            onChange={(e) =>
              setSelectedPeriodo((prev) => ({
                ...prev,
                ano: e.target.value ? parseInt(e.target.value) : undefined,
              }))
            }
            className="border border-gray-300 rounded-md px-3 py-1 text-sm">
            <option value="">Todos os anos</option>
            {Array.from(
              { length: 5 },
              (_, i) => new Date().getFullYear() - i
            ).map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
          {(selectedPeriodo.mes || selectedPeriodo.ano) && (
            <button
              onClick={() => setSelectedPeriodo({})}
              className="text-sm text-blue-600 hover:text-blue-800">
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Alertas para jobs em andamento */}
      {estatisticas && estatisticas.jobsEmAndamento > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              {estatisticas.jobsEmAndamento} job(s) em andamento. Os arquivos
              estarão disponíveis para download quando concluídos.
            </span>
          </div>
        </div>
      )}

      {/* Tabela de jobs */}
      {renderJobsTable()}
    </div>
  );
}
