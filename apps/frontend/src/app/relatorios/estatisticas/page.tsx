// apps/frontend/src/app/relatorios/estatisticas/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  FileBarChart,
  TrendingUp,
  Users,
  Calendar,
  Download,
  RefreshCw,
  PieChart,
  Activity,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import relatorioService from "@/services/relatorio";
import { RelatorioEstatisticas } from "@/types/relatorio";
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
import { Bar, Doughnut } from "react-chartjs-2";

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

export default function EstatisticasRelatoriosPage() {
  const router = useRouter();

  // Estados principais
  const [estatisticas, setEstatisticas] =
    useState<RelatorioEstatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadEstatisticas();
  }, []);

  const loadEstatisticas = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await relatorioService.getEstatisticasRelatorios();
      setEstatisticas(data);
    } catch (err: any) {
      console.error("Erro ao carregar estatísticas:", err);
      setError(err.response?.data?.message || "Erro ao carregar estatísticas");
      toastUtil.error("Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEstatisticas();
    setRefreshing(false);
    toastUtil.success("Estatísticas atualizadas!");
  };

  // Configurações dos gráficos
  const getChartsData = () => {
    if (!estatisticas) return null;

    // Gráfico de status dos relatórios
    const statusData = {
      labels: ["Concluídos", "Processando", "Com Erro"],
      datasets: [
        {
          data: [
            estatisticas.relatoriosConcluidos,
            estatisticas.relatoriosProcessando,
            estatisticas.relatoriosErro,
          ],
          backgroundColor: [
            "#10B981", // verde
            "#F59E0B", // amarelo
            "#EF4444", // vermelho
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    };

    // Gráfico de compartilhamentos
    const compartilhamentosData = {
      labels: ["Recebidos", "Enviados"],
      datasets: [
        {
          label: "Compartilhamentos",
          data: [
            estatisticas.compartilhamentosRecebidos,
            estatisticas.compartilhamentosEnviados,
          ],
          backgroundColor: ["#3B82F6", "#8B5CF6"],
          borderColor: ["#1D4ED8", "#7C3AED"],
          borderWidth: 1,
        },
      ],
    };

    return { statusData, compartilhamentosData };
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando estatísticas..." />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !estatisticas) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {error || "Erro ao carregar estatísticas"}
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const chartsData = getChartsData();

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
                  <BarChart3 className="mr-2 h-6 w-6" />
                  Estatísticas de Relatórios
                </h1>
                <p className="text-gray-600 mt-1">
                  Visão geral e métricas dos relatórios do sistema
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <CustomButton
                variant="secondary"
                onClick={handleRefresh}
                disabled={refreshing}>
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Atualizar
              </CustomButton>

              <CustomButton
                variant="primary"
                onClick={() => router.push("/relatorios/novo")}>
                <FileBarChart className="h-4 w-4 mr-2" />
                Novo Relatório
              </CustomButton>
            </div>
          </div>

          {/* Cards de Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <FileBarChart className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total de Relatórios
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {estatisticas.totalRelatorios.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Concluídos
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {estatisticas.relatoriosConcluidos.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {estatisticas.totalRelatorios > 0
                      ? `${((estatisticas.relatoriosConcluidos / estatisticas.totalRelatorios) * 100).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full mr-4">
                  <Activity className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Processando
                  </p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {estatisticas.relatoriosProcessando.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {estatisticas.totalRelatorios > 0
                      ? `${((estatisticas.relatoriosProcessando / estatisticas.totalRelatorios) * 100).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Com Erro</p>
                  <p className="text-2xl font-bold text-red-900">
                    {estatisticas.relatoriosErro.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {estatisticas.totalRelatorios > 0
                      ? `${((estatisticas.relatoriosErro / estatisticas.totalRelatorios) * 100).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Compartilhamentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Compartilhamentos Recebidos
                </h3>
                <div className="bg-blue-100 p-2 rounded-full">
                  <Download className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-900 mb-2">
                {estatisticas.compartilhamentosRecebidos.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                Relatórios compartilhados com você
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Compartilhamentos Enviados
                </h3>
                <div className="bg-purple-100 p-2 rounded-full">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-purple-900 mb-2">
                {estatisticas.compartilhamentosEnviados.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                Relatórios que você compartilhou
              </p>
            </div>
          </div>

          {/* Gráficos */}
          {chartsData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Gráfico de Status */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Status dos Relatórios
                </h3>
                <div className="h-64">
                  <Doughnut
                    data={chartsData.statusData}
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

              {/* Gráfico de Compartilhamentos */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Compartilhamentos
                </h3>
                <div className="h-64">
                  <Bar
                    data={chartsData.compartilhamentosData}
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
          )}

          {/* Último Relatório */}
          {estatisticas.ultimoRelatorio && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Último Relatório Criado
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Título</p>
                  <p className="font-medium text-gray-900">
                    {estatisticas.ultimoRelatorio.titulo}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Criado por
                  </p>
                  <p className="text-gray-700">
                    {estatisticas.ultimoRelatorio.usuarioGeradorNome}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total de Registros
                  </p>
                  <p className="font-medium text-gray-900">
                    {estatisticas.ultimoRelatorio.totalRegistros.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Criado em</p>
                  <p className="text-gray-700">
                    {formatDateTime(estatisticas.ultimoRelatorio.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <CustomButton
                  variant="primary"
                  onClick={() =>
                    router.push(
                      `/relatorios/${estatisticas.ultimoRelatorio?.id}`
                    )
                  }>
                  <FileBarChart className="h-4 w-4 mr-2" />
                  Ver Relatório
                </CustomButton>
              </div>
            </div>
          )}

          {/* Resumo de Performance */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Resumo de Performance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">
                  {estatisticas.totalRelatorios > 0
                    ? `${((estatisticas.relatoriosConcluidos / estatisticas.totalRelatorios) * 100).toFixed(1)}%`
                    : "0%"}
                </p>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-purple-900">
                  {(
                    estatisticas.compartilhamentosRecebidos +
                    estatisticas.compartilhamentosEnviados
                  ).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Total de Compartilhamentos
                </p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-green-900">
                  {estatisticas.relatoriosProcessando}
                </p>
                <p className="text-sm text-gray-600">Em Processamento</p>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push("/relatorios")}>
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <FileBarChart className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Ver Todos os Relatórios
                  </h3>
                  <p className="text-sm text-gray-600">
                    Acesse a lista completa
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push("/relatorios/compartilhamentos")}>
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Compartilhamentos
                  </h3>
                  <p className="text-sm text-gray-600">
                    Gerencie compartilhamentos
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push("/relatorios/novo")}>
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Criar Novo Relatório
                  </h3>
                  <p className="text-sm text-gray-600">
                    Gere um novo relatório
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
