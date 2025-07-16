"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FichaPdfEstatisticasDto,
  ConvenioDto,
  ConvenioEstatisticasDto,
  fichaPdfHelpers,
} from "@/types/fichaPdf";
import fichaPdfService from "@/services/ficha-pdf";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Filter,
  PieChart,
} from "lucide-react";

export default function EstatisticasPage() {
  const router = useRouter();
  const [estatisticas, setEstatisticas] =
    useState<FichaPdfEstatisticasDto | null>(null);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [estatisticasConvenio, setEstatisticasConvenio] = useState<
    ConvenioEstatisticasDto[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingConvenios, setLoadingConvenios] = useState(false);
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
  });

  useEffect(() => {
    carregarDados();
  }, [filtros]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [estatisticasData, conveniosData] = await Promise.all([
        fichaPdfService.getEstatisticas(filtros.mes, filtros.ano),
        fichaPdfService.getConveniosHabilitados(),
      ]);

      setEstatisticas(estatisticasData);
      setConvenios(conveniosData);

      // Carregar estatísticas de convênios em paralelo
      carregarEstatisticasConvenios(conveniosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticasConvenios = async (
    conveniosList: ConvenioDto[]
  ) => {
    try {
      setLoadingConvenios(true);
      const estatisticasPromises = conveniosList.map((convenio) =>
        fichaPdfService.getEstatisticasConvenio(convenio.id).catch(() => null)
      );

      const resultados = await Promise.all(estatisticasPromises);
      const estatisticasValidas = resultados.filter(
        Boolean
      ) as ConvenioEstatisticasDto[];
      setEstatisticasConvenio(estatisticasValidas);
    } catch (error) {
      console.error("Erro ao carregar estatísticas dos convênios:", error);
    } finally {
      setLoadingConvenios(false);
    }
  };

  const exportarRelatorio = async () => {
    try {
      // Criar dados para exportação
      const dadosExportacao = {
        periodo: `${fichaPdfHelpers.formatarMesAno(filtros.mes, filtros.ano)}`,
        estatisticasGerais: estatisticas,
        estatisticasConvenios: estatisticasConvenio,
        dataGeracao: new Date().toISOString(),
      };

      // Converter para JSON e criar blob
      const jsonString = JSON.stringify(dadosExportacao, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `estatisticas_fichas_pdf_${filtros.mes}_${filtros.ano}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Relatório exportado com sucesso");
    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
      toast.error("Erro ao exportar relatório");
    }
  };

  const renderEstatisticasGerais = () => {
    if (!estatisticas) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total de Fichas
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {estatisticas.totalFichasGeradas.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Período: {estatisticas.periodo}
              </p>
            </div>
            <FileText className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Jobs Concluídos
              </p>
              <p className="text-3xl font-bold text-green-600">
                {estatisticas.jobsConcluidos}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {estatisticas.jobsEmAndamento} em andamento
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Taxa de Sucesso
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {(estatisticas.taxaSucesso * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {estatisticas.jobsComErro} jobs com erro
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Convênios Ativos
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {estatisticas.conveniosAtivos}
              </p>
              <p className="text-xs text-gray-500 mt-1">Habilitados para PDF</p>
            </div>
            <Users className="h-10 w-10 text-orange-600" />
          </div>
        </div>
      </div>
    );
  };

  const renderGraficoFichasPorMes = () => {
    if (!estatisticas?.fichasPorMes) return null;

    const meses = Object.keys(estatisticas.fichasPorMes).sort();
    const maxValue = Math.max(...Object.values(estatisticas.fichasPorMes));

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Fichas Geradas por Mês
        </h3>

        <div className="space-y-3">
          {meses.map((mes) => {
            const quantidade = estatisticas.fichasPorMes[mes];
            const porcentagem =
              maxValue > 0 ? (quantidade / maxValue) * 100 : 0;

            return (
              <div key={mes} className="flex items-center">
                <div className="w-16 text-sm text-gray-600">{mes}</div>
                <div className="flex-1 mx-3">
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${porcentagem}%` }}>
                      {porcentagem > 15 && (
                        <span className="text-white text-xs font-medium">
                          {quantidade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-16 text-right text-sm font-medium text-gray-900">
                  {quantidade.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderConveniosMaisUtilizados = () => {
    if (!estatisticas?.conveniosMaisUtilizados) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Convênios Mais Utilizados
        </h3>

        <div className="space-y-3">
          {estatisticas.conveniosMaisUtilizados
            .slice(0, 10)
            .map((convenio, index) => (
              <div
                key={convenio.convenioId}
                className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                          ? "bg-gray-400"
                          : index === 2
                            ? "bg-orange-500"
                            : "bg-blue-500"
                    }`}>
                    {index + 1}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {convenio.convenioNome}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {convenio.totalFichas.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">fichas</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderEstatisticasConvenios = () => {
    if (!estatisticasConvenio.length) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Estatísticas por Convênio
          </h3>
        </div>

        {loadingConvenios ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">
              Carregando estatísticas dos convênios...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Convênio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fichas/Mês
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fichas/Ano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pacientes Ativos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Média/Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidades
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estatisticasConvenio.map((stats) => (
                  <tr key={stats.convenioId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stats.convenioNome}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stats.fichasGeradasMes.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stats.fichasGeradasAno.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stats.pacientesAtivos.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stats.mediaFichasPorPaciente.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {stats.especialidadesCobertas.slice(0, 3).map((esp) => (
                          <span
                            key={esp}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {esp}
                          </span>
                        ))}
                        {stats.especialidadesCobertas.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{stats.especialidadesCobertas.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Estatísticas de Fichas PDF
            </h1>
            <p className="text-gray-600">
              Análise detalhada de geração de fichas e performance do sistema
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={carregarDados}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </button>
          <button
            onClick={exportarRelatorio}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Período:</span>

          <select
            value={filtros.mes}
            onChange={(e) =>
              setFiltros({ ...filtros, mes: parseInt(e.target.value) })
            }
            className="border border-gray-300 rounded-md px-3 py-1 text-sm">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
              <option key={mes} value={mes}>
                {fichaPdfHelpers.formatarMesAno(mes, 2024).split(" ")[0]}
              </option>
            ))}
          </select>

          <select
            value={filtros.ano}
            onChange={(e) =>
              setFiltros({ ...filtros, ano: parseInt(e.target.value) })
            }
            className="border border-gray-300 rounded-md px-3 py-1 text-sm">
            {Array.from(
              { length: 5 },
              (_, i) => new Date().getFullYear() - i
            ).map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {/* Estatísticas Gerais */}
        {renderEstatisticasGerais()}

        {/* Gráficos e análises */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderGraficoFichasPorMes()}
          {renderConveniosMaisUtilizados()}
        </div>

        {/* Estatísticas por convênio */}
        {renderEstatisticasConvenios()}

        {/* Resumo de performance */}
        {estatisticas && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Resumo de Performance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {estatisticas.jobsConcluidos}
                </div>
                <div className="text-sm text-gray-600">Jobs Concluídos</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${(estatisticas.jobsConcluidos / estatisticas.totalJobs) * 100}%`,
                    }}></div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {estatisticas.jobsEmAndamento}
                </div>
                <div className="text-sm text-gray-600">Em Andamento</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(estatisticas.jobsEmAndamento / estatisticas.totalJobs) * 100}%`,
                    }}></div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {estatisticas.jobsComErro}
                </div>
                <div className="text-sm text-gray-600">Com Erro</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${(estatisticas.jobsComErro / estatisticas.totalJobs) * 100}%`,
                    }}></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total de Jobs:</span>
                <span className="font-medium">{estatisticas.totalJobs}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-600">Taxa de Sucesso:</span>
                <span className="font-medium text-green-600">
                  {(estatisticas.taxaSucesso * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-600">Período Analisado:</span>
                <span className="font-medium">{estatisticas.periodo}</span>
              </div>
            </div>
          </div>
        )}

        {/* Insights e recomendações */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Insights e Recomendações
          </h3>

          <div className="space-y-3 text-sm text-blue-800">
            {estatisticas && (
              <>
                {estatisticas.taxaSucesso >= 0.95 && (
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                    <span>
                      Excelente taxa de sucesso! O sistema está funcionando de
                      forma estável.
                    </span>
                  </div>
                )}

                {estatisticas.jobsEmAndamento > 5 && (
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
                    <span>
                      Alto número de jobs em andamento. Considere otimizar o
                      processamento em lote.
                    </span>
                  </div>
                )}

                {estatisticas.jobsComErro >
                  estatisticas.jobsConcluidos * 0.1 && (
                  <div className="flex items-start">
                    <XCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
                    <span>
                      Taxa de erro elevada. Recomenda-se investigar as causas
                      dos erros.
                    </span>
                  </div>
                )}

                {estatisticas.conveniosMaisUtilizados.length > 0 && (
                  <div className="flex items-start">
                    <TrendingUp className="h-4 w-4 text-purple-600 mr-2 mt-0.5" />
                    <span>
                      O convênio "
                      {estatisticas.conveniosMaisUtilizados[0]?.convenioNome}" é
                      o mais utilizado com{" "}
                      {estatisticas.conveniosMaisUtilizados[0]?.totalFichas}{" "}
                      fichas geradas.
                    </span>
                  </div>
                )}

                <div className="flex items-start">
                  <PieChart className="h-4 w-4 text-indigo-600 mr-2 mt-0.5" />
                  <span>
                    {estatisticas.totalFichasGeradas > 1000
                      ? "Volume alto de fichas geradas indica uso intensivo do sistema."
                      : "Volume moderado de fichas. Sistema com capacidade para crescimento."}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
