"use client";

import React, { useEffect, useState } from "react";
import { ticketService } from "@/services/ticket";
import { DashboardStatsDto } from "@/types/ticket";
import { Ticket, CheckCircle, Star, TrendingUp, Loader2 } from "lucide-react";

// Importações do Chart.js e React-Chartjs-2
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

// Registra os componentes do Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function TicketDashboard() {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await ticketService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  // --- Mapeamento de Cores e Labels ---

  const STATUS_COLORS: Record<string, string> = {
    OPEN: "#3b82f6", // blue-500
    IN_PROGRESS: "#a855f7", // purple-500
    WAITING: "#eab308", // yellow-500
    RESOLVED: "#22c55e", // green-500
    CLOSED: "#64748b", // slate-500
  };

  const STATUS_LABELS: Record<string, string> = {
    OPEN: "Aberto",
    IN_PROGRESS: "Em Andamento",
    WAITING: "Aguardando",
    RESOLVED: "Resolvido",
    CLOSED: "Fechado",
  };

  const PRIORITY_COLORS: Record<string, string> = {
    LOW: "#22c55e", // green-500
    MEDIUM: "#eab308", // yellow-500
    HIGH: "#f97316", // orange-500
    CRITICAL: "#ef4444", // red-500
  };

  const PRIORITY_LABELS: Record<string, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    CRITICAL: "Crítica",
  };

  // --- Preparação de Dados para o React-Chartjs-2 ---

  // 1. Dados para o Gráfico de Rosca (Status)
  const statusEntries = Object.entries(stats.ticketsByStatus);
  const pieData = {
    labels: statusEntries.map(([key]) => STATUS_LABELS[key] || key),
    datasets: [
      {
        label: "Quantidade",
        data: statusEntries.map(([, value]) => value),
        backgroundColor: statusEntries.map(
          ([key]) => STATUS_COLORS[key] || "#ccc"
        ),
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  // 2. Dados para o Gráfico de Barras (Prioridade)
  // Ordenação lógica: Baixa -> Crítica
  const priorityOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const priorityEntries = Object.entries(stats.ticketsByPriority).sort(
    (a, b) => priorityOrder.indexOf(a[0]) - priorityOrder.indexOf(b[0])
  );

  const barData = {
    labels: priorityEntries.map(([key]) => PRIORITY_LABELS[key] || key),
    datasets: [
      {
        label: "Quantidade de Chamados",
        data: priorityEntries.map(([, value]) => value),
        backgroundColor: priorityEntries.map(
          ([key]) => PRIORITY_COLORS[key] || "#ccc"
        ),
        borderRadius: 4,
      },
    ],
  };

  // --- Opções dos Gráficos ---

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Esconder legenda pois as barras já têm cores distintas
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1, // Inteiros apenas
        },
        grid: {
          color: "#f3f4f6",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard de Gestão
        </h1>
        <p className="text-gray-500">Visão geral da operação de suporte</p>
      </div>

      {/* --- CARDS DE KPI --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Em Aberto */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-4 bg-blue-50 rounded-full mr-4">
            <Ticket className="text-blue-600 h-8 w-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Chamados Abertos
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {stats.totalOpen}
            </h3>
          </div>
        </div>

        {/* Card 2: Fechados Hoje */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-4 bg-green-50 rounded-full mr-4">
            <CheckCircle className="text-green-600 h-8 w-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Finalizados Hoje
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {stats.totalClosedToday}
            </h3>
          </div>
        </div>

        {/* Card 3: SLA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div
            className={`p-4 rounded-full mr-4 ${
              stats.slaCompliancePercentage >= 80 ? "bg-teal-50" : "bg-red-50"
            }`}>
            <TrendingUp
              className={`h-8 w-8 ${
                stats.slaCompliancePercentage >= 80
                  ? "text-teal-600"
                  : "text-red-600"
              }`}
            />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">SLA Compliance</p>
            <h3
              className={`text-2xl font-bold ${
                stats.slaCompliancePercentage >= 80
                  ? "text-teal-700"
                  : "text-red-600"
              }`}>
              {stats.slaCompliancePercentage.toFixed(1)}%
            </h3>
          </div>
        </div>

        {/* Card 4: CSAT (Avaliação) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-4 bg-yellow-50 rounded-full mr-4">
            <Star className="text-yellow-500 h-8 w-8" fill="currentColor" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Satisfação (CSAT)
            </p>
            <div className="flex items-baseline">
              <h3 className="text-2xl font-bold text-gray-800">
                {stats.averageRating.toFixed(1)}
              </h3>
              <span className="text-sm text-gray-400 ml-1">/ 5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- GRÁFICOS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico 1: Status (Pie) */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Distribuição por Status
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center relative">
            {/* O posicionamento relativo ajuda a chartjs a renderizar corretamente */}
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        {/* Gráfico 2: Prioridade (Bar) */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Volume por Prioridade
          </h3>
          <div className="h-[300px] w-full">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
