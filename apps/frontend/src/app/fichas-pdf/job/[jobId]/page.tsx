"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  FichaPdfStatusDto,
  StatusJobEnum,
  fichaPdfHelpers,
} from "@/types/fichaPdf";
import fichaPdfService from "@/services/ficha-pdf";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  RefreshCw,
  Play,
  Pause,
  FileText,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  Info,
  Activity,
} from "lucide-react";

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const [status, setStatus] = useState<FichaPdfStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [monitorando, setMonitorando] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (jobId) {
      carregarStatus();
    }
  }, [jobId]);

  useEffect(() => {
    // Iniciar monitoramento automático se o job estiver em andamento
    if (
      status &&
      (status.status === StatusJobEnum.INICIADO ||
        status.status === StatusJobEnum.PROCESSANDO)
    ) {
      iniciarMonitoramento();
    } else {
      pararMonitoramento();
    }

    return () => {
      pararMonitoramento();
    };
  }, [status?.status]);

  const carregarStatus = async () => {
    try {
      setLoading(true);
      const statusData = await fichaPdfService.getStatusGeracao(jobId);
      setStatus(statusData);
    } catch (error) {
      console.error("Erro ao carregar status do job:", error);
      toast.error("Erro ao carregar detalhes do job");
    } finally {
      setLoading(false);
    }
  };

  const iniciarMonitoramento = () => {
    if (intervalId) return; // Já está monitorando

    setMonitorando(true);
    const id = setInterval(async () => {
      try {
        const statusData = await fichaPdfService.getStatusGeracao(jobId);
        setStatus(statusData);

        // Parar monitoramento se finalizado
        if (
          statusData.status === StatusJobEnum.CONCLUIDO ||
          statusData.status === StatusJobEnum.ERRO ||
          statusData.status === StatusJobEnum.CANCELADO
        ) {
          pararMonitoramento();
        }
      } catch (error) {
        console.error("Erro no monitoramento:", error);
      }
    }, 2000);

    setIntervalId(id);
  };

  const pararMonitoramento = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setMonitorando(false);
  };

  const baixarPdf = async () => {
    if (!status) return;

    try {
      await fichaPdfService.baixarESalvarPdf(
        status.jobId,
        `fichas_${status.dadosJob?.mes || ""}_${status.dadosJob?.ano || ""}_${status.jobId}.pdf`
      );
      toast.success("PDF baixado com sucesso");
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      toast.error("Erro ao baixar PDF");
    }
  };

  const cancelarJob = async () => {
    if (!status) return;

    try {
      await fichaPdfService.cancelarJob(status.jobId);
      toast.success("Job cancelado com sucesso");
      await carregarStatus();
    } catch (error) {
      console.error("Erro ao cancelar job:", error);
      toast.error("Erro ao cancelar job");
    }
  };

  const getStatusIcon = (statusType: StatusJobEnum) => {
    switch (statusType) {
      case StatusJobEnum.CONCLUIDO:
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case StatusJobEnum.PROCESSANDO:
      case StatusJobEnum.INICIADO:
        return <Clock className="h-8 w-8 text-blue-600 animate-pulse" />;
      case StatusJobEnum.ERRO:
        return <XCircle className="h-8 w-8 text-red-600" />;
      case StatusJobEnum.CANCELADO:
        return <Ban className="h-8 w-8 text-gray-600" />;
      default:
        return <Clock className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusColor = (statusType: StatusJobEnum) => {
    switch (statusType) {
      case StatusJobEnum.CONCLUIDO:
        return "text-green-600 bg-green-50 border-green-200";
      case StatusJobEnum.PROCESSANDO:
      case StatusJobEnum.INICIADO:
        return "text-blue-600 bg-blue-50 border-blue-200";
      case StatusJobEnum.ERRO:
        return "text-red-600 bg-red-50 border-red-200";
      case StatusJobEnum.CANCELADO:
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  const renderProgressBar = () => {
    if (!status) return null;

    const progresso = Math.round(status.progresso);
    const progressColor =
      status.status === StatusJobEnum.CONCLUIDO
        ? "bg-green-500"
        : status.status === StatusJobEnum.ERRO
          ? "bg-red-500"
          : "bg-blue-500";

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Progresso</h3>
          <span className="text-2xl font-bold text-gray-900">{progresso}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className={`h-4 rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${progresso}%` }}></div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Fichas processadas:</span>
            <span className="ml-2 font-medium">{status.fichasProcessadas}</span>
          </div>
          <div>
            <span className="text-gray-600">Total de fichas:</span>
            <span className="ml-2 font-medium">{status.totalFichas}</span>
          </div>
        </div>

        {status.status === StatusJobEnum.PROCESSANDO && (
          <div className="mt-4 text-sm text-gray-600">
            <Activity className="h-4 w-4 inline mr-1" />
            Tempo restante estimado:{" "}
            {fichaPdfService.calcularTempoRestante(status) || "Calculando..."}
          </div>
        )}
      </div>
    );
  };

  const renderInformacoesJob = () => {
    if (!status) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Informações do Job
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Job ID:</span>
              <span className="ml-2 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {status.jobId}
              </span>
            </div>

            <div className="flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Usuário:</span>
              <span className="ml-2 text-sm font-medium">
                {status.usuarioNome}
              </span>
            </div>

            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Período:</span>
              <span className="ml-2 text-sm font-medium">
                {status.dadosJob &&
                  fichaPdfHelpers.formatarMesAno(
                    status.dadosJob.mes,
                    status.dadosJob.ano
                  )}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Iniciado:</span>
              <span className="ml-2 text-sm">
                {fichaPdfHelpers.formatarDataHora(status.iniciado)}
              </span>
            </div>

            {status.concluido && (
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Concluído:</span>
                <span className="ml-2 text-sm">
                  {fichaPdfHelpers.formatarDataHora(status.concluido)}
                </span>
              </div>
            )}

            <div className="flex items-center">
              <Building2 className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Tipo:</span>
              <span className="ml-2 text-sm font-medium">
                {fichaPdfHelpers.getTipoGeracaoLabel(status.tipo)}
              </span>
            </div>
          </div>
        </div>

        {status.dadosJob?.convenioNome && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <span className="text-sm text-gray-600">Convênio:</span>
            <span className="ml-2 text-sm font-medium">
              {status.dadosJob.convenioNome}
            </span>
          </div>
        )}

        {status.dadosJob?.pacienteNome && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <span className="text-sm text-gray-600">Paciente:</span>
            <span className="ml-2 text-sm font-medium">
              {status.dadosJob.pacienteNome}
            </span>
          </div>
        )}

        {status.dadosJob?.especialidades &&
          status.dadosJob.especialidades.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <span className="text-sm text-gray-600">Especialidades:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {status.dadosJob.especialidades.map((especialidade) => (
                  <span
                    key={especialidade}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {especialidade}
                  </span>
                ))}
              </div>
            </div>
          )}
      </div>
    );
  };

  const renderErro = () => {
    if (!status || !status.erro) return null;

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-3">
          <XCircle className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-red-900">Erro na Geração</h3>
        </div>
        <p className="text-red-700 text-sm">{status.erro}</p>
      </div>
    );
  };

  const renderAcoes = () => {
    if (!status) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ações</h3>

        <div className="flex flex-wrap gap-3">
          {/* Botão de download */}
          {status.podeDownload && status.status === StatusJobEnum.CONCLUIDO && (
            <button
              onClick={baixarPdf}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </button>
          )}

          {/* Botão de cancelar */}
          {fichaPdfService.podeSerCancelado(status) && (
            <button
              onClick={cancelarJob}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center">
              <Ban className="h-4 w-4 mr-2" />
              Cancelar Job
            </button>
          )}

          {/* Botão de atualizar */}
          <button
            onClick={carregarStatus}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </button>

          {/* Botão de monitoramento */}
          {!fichaPdfService.estaFinalizado(status) && (
            <button
              onClick={monitorando ? pararMonitoramento : iniciarMonitoramento}
              className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                monitorando
                  ? "bg-yellow-600 text-white hover:bg-yellow-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}>
              {monitorando ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Parar Monitoramento
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Monitorar Automaticamente
                </>
              )}
            </button>
          )}
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

  if (!status) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Job não encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            O job solicitado não foi encontrado ou você não tem permissão para
            visualizá-lo.
          </p>
          <button
            onClick={() => router.push("/fichas-pdf")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Voltar para Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => router.push("/fichas-pdf")}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center">
            {getStatusIcon(status.status)}
            <div className="ml-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Job {status.jobId.slice(0, 8)}
              </h1>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status.status)}`}>
                {status.status}
              </div>
            </div>
          </div>
        </div>

        {monitorando && (
          <div className="flex items-center text-sm text-blue-600">
            <Activity className="h-4 w-4 mr-1 animate-pulse" />
            Monitorando automaticamente
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Barra de progresso */}
        {renderProgressBar()}

        {/* Informações do job */}
        {renderInformacoesJob()}

        {/* Erro (se houver) */}
        {renderErro()}

        {/* Ações */}
        {renderAcoes()}

        {/* Dicas e informações */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Dicas:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Jobs de paciente são processados instantaneamente</li>
                <li>• Jobs de convênio e lote são processados em background</li>
                <li>
                  • O monitoramento automático atualiza o status a cada 2
                  segundos
                </li>
                <li>
                  • Arquivos PDF ficam disponíveis por 7 dias após a geração
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Timeline de status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>

          <div className="flow-root">
            <ul className="-mb-8">
              <li>
                <div className="relative pb-8">
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                        <Play className="h-4 w-4 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900">Job iniciado</p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {fichaPdfHelpers.formatarDataHora(status.iniciado)}
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              {status.status === StatusJobEnum.PROCESSANDO && (
                <li>
                  <div className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
                          <Clock className="h-4 w-4 text-white animate-pulse" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900">
                            Processando fichas
                          </p>
                          <p className="text-xs text-gray-500">
                            {status.fichasProcessadas} de {status.totalFichas}{" "}
                            fichas processadas
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          Em andamento
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )}

              {status.concluido && (
                <li>
                  <div className="relative">
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            status.status === StatusJobEnum.CONCLUIDO
                              ? "bg-green-500"
                              : status.status === StatusJobEnum.ERRO
                                ? "bg-red-500"
                                : "bg-gray-500"
                          }`}>
                          {status.status === StatusJobEnum.CONCLUIDO ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : status.status === StatusJobEnum.ERRO ? (
                            <XCircle className="h-4 w-4 text-white" />
                          ) : (
                            <Ban className="h-4 w-4 text-white" />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900">
                            Job {status.status.toLowerCase()}
                          </p>
                          {status.status === StatusJobEnum.CONCLUIDO && (
                            <p className="text-xs text-gray-500">
                              {status.totalFichas} fichas geradas com sucesso
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {fichaPdfHelpers.formatarDataHora(status.concluido)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
