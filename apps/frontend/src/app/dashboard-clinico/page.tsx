// src/app/dashboard-clinico/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  FileText,
  Clipboard,
  TrendingUp,
  AlertTriangle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { UnidadeBadge } from "@/components/clinical/ui/UnidadeBadge";
import {
  clinicalStatsService,
  pacienteService,
  guiaService,
  fichaService,
} from "@/services/clinical";
import {
  ClinicalStats,
  PacienteSummaryDto,
  GuiaSummaryDto,
  FichaSummaryDto,
  UnidadeEnum,
} from "@/types/clinical";
import toastUtil from "@/utils/toast";

export default function DashboardClinicoPage() {
  const router = useRouter();

  // Estados principais
  const [stats, setStats] = useState<ClinicalStats>({
    totalPacientes: 0,
    pacientesKids: 0,
    pacientesSenior: 0,
    totalGuias: 0,
    guiasVencidas: 0,
    guiasComQuantidadeExcedida: 0,
    totalFichas: 0,
    fichasPorStatus: {},
  });
  const [recentPacientes, setRecentPacientes] = useState<PacienteSummaryDto[]>(
    []
  );
  const [guiasVencidas, setGuiasVencidas] = useState<GuiaSummaryDto[]>([]);
  const [fichasRecentes, setFichasRecentes] = useState<FichaSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do dashboard
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar estatísticas e dados recentes em paralelo
      const [statsData, pacientesData, guiasVencidasData, fichasData] =
        await Promise.all([
          clinicalStatsService.getClinicalStats(),
          pacienteService.getAllPacientes(0, 5), // Últimos 5 pacientes
          guiaService.getGuiasVencidas(0, 5), // 5 guias vencidas
          fichaService.getAllFichas(0, 5), // Últimas 5 fichas
        ]);

      setStats(statsData);
      setRecentPacientes(pacientesData.content);
      setGuiasVencidas(guiasVencidasData.content);
      setFichasRecentes(fichasData.content);
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
      setError("Erro ao carregar dados do dashboard");
      toastUtil.error("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ATIVO: "#10b981",
      INATIVO: "#ef4444",
      PENDENTE: "#f59e0b",
      CONCLUIDO: "#10b981",
      VENCIDO: "#dc2626",
    };
    return colors[status] || "#6b7280";
  };

  // Calcular percentual de guias vencidas
  const percentualGuiasVencidas =
    stats.totalGuias > 0
      ? ((stats.guiasVencidas / stats.totalGuias) * 100).toFixed(1)
      : "0";

  // Calcular percentual por unidade
  const percentualKids =
    stats.totalPacientes > 0
      ? ((stats.pacientesKids / stats.totalPacientes) * 100).toFixed(1)
      : "0";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando dashboard clínico..." />
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <Activity className="mr-2 h-6 w-6" />
                Dashboard Clínico
              </h1>
              <p className="text-gray-600 mt-1">
                Visão geral do módulo clínico
              </p>
            </div>
            <CustomButton variant="primary" onClick={() => loadDashboardData()}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Atualizar
            </CustomButton>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Cards de Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-blue-100 mr-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Pacientes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalPacientes}
                  </p>
                  <div className="flex space-x-2 mt-1">
                    <span className="text-xs text-pink-600">
                      KIDS: {stats.pacientesKids}
                    </span>
                    <span className="text-xs text-blue-600">
                      SENIOR: {stats.pacientesSenior}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-green-100 mr-4">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Guias</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalGuias}
                  </p>
                  {stats.guiasVencidas > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      {stats.guiasVencidas} vencidas ({percentualGuiasVencidas}
                      %)
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-purple-100 mr-4">
                  <Clipboard className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Fichas</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalFichas}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Object.keys(stats.fichasPorStatus).length} status
                    diferentes
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="rounded-full p-3 bg-red-100 mr-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Alertas</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {stats.guiasVencidas}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Guias vencidas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos e Distribuições */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Distribuição por Unidade */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <PieChart className="mr-2 h-5 w-5" />
                Distribuição por Unidade
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UnidadeBadge unidade={UnidadeEnum.KIDS} className="mr-2" />
                    <span className="text-sm text-gray-600">KIDS</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {stats.pacientesKids}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({percentualKids}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full"
                    style={{ width: `${percentualKids}%` }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UnidadeBadge
                      unidade={UnidadeEnum.SENIOR}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">SENIOR</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {stats.pacientesSenior}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({(100 - parseFloat(percentualKids)).toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${100 - parseFloat(percentualKids)}%`,
                    }}></div>
                </div>
              </div>
            </div>

            {/* Status das Fichas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Status das Fichas
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.fichasPorStatus || {}).length > 0 ? (
                  Object.entries(stats.fichasPorStatus).map(
                    ([status, quantidade]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between">
                        <StatusBadge status={status} />
                        <span className="text-sm font-medium">
                          {quantidade}
                        </span>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Nenhuma ficha encontrada
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Crie fichas para ver o status aqui
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seções de Atividade Recente */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pacientes Recentes */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Pacientes Recentes
                  </h3>
                  <CustomButton
                    variant="primary"
                    size="small"
                    onClick={() => router.push("/pacientes")}>
                    Ver todos
                  </CustomButton>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {recentPacientes.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Nenhum paciente encontrado
                  </div>
                ) : (
                  recentPacientes.map((paciente) => (
                    <div key={paciente.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {paciente.nome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {paciente.convenioNome}
                          </p>
                        </div>
                        <div className="text-right">
                          <UnidadeBadge unidade={paciente.unidade} />
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(paciente.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Guias Vencidas */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                    Guias Vencidas
                  </h3>
                  <CustomButton
                    variant="primary"
                    size="small"
                    onClick={() => router.push("/guias?filter=vencidas")}>
                    Ver todas
                  </CustomButton>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {guiasVencidas.length === 0 ? (
                  <div className="p-6 text-center text-green-600">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    Nenhuma guia vencida
                  </div>
                ) : (
                  guiasVencidas.map((guia) => (
                    <div key={guia.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {guia.numeroGuia}
                          </p>
                          <p className="text-xs text-gray-500">
                            {guia.pacienteNome}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-red-600 font-medium">
                            Venceu em {formatDate(guia.validade)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {guia.convenioNome}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Fichas Recentes */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Fichas Recentes
                  </h3>
                  <CustomButton
                    variant="primary"
                    size="small"
                    onClick={() => router.push("/fichas")}>
                    Ver todas
                  </CustomButton>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {fichasRecentes.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Nenhuma ficha encontrada
                  </div>
                ) : (
                  fichasRecentes.map((ficha) => (
                    <div key={ficha.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {ficha.codigoFicha}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ficha.pacienteNome} - {ficha.especialidade}
                          </p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={ficha.status} />
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(ficha.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <CustomButton
                variant="primary"
                onClick={() => router.push("/pacientes")}
                className="w-full justify-center">
                <Users className="mr-2 h-4 w-4" />
                Novo Paciente
              </CustomButton>
              <CustomButton
                variant="primary"
                onClick={() => router.push("/guias")}
                className="w-full justify-center">
                <FileText className="mr-2 h-4 w-4" />
                Nova Guia
              </CustomButton>
              <CustomButton
                variant="primary"
                onClick={() => router.push("/fichas")}
                className="w-full justify-center">
                <Clipboard className="mr-2 h-4 w-4" />
                Nova Ficha
              </CustomButton>
              <CustomButton
                variant="primary"
                onClick={() => router.push("/historico-status")}
                className="w-full justify-center">
                <Clock className="mr-2 h-4 w-4" />
                Ver Histórico
              </CustomButton>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
