"use client";

import React, { useEffect, useState } from "react";
import { ticketService } from "@/services/ticket";
import {
  DashboardStatsDto,
  TicketPriority,
  TicketStatus,
} from "@/types/ticket";
import {
  Ticket as TicketIcon,
  CheckCircle,
  Star,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Clock,
  ThumbsDown,
  Search,
  User,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Importações do Chart.js
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

  // --- Mapeamentos ---
  const STATUS_COLORS: Record<string, string> = {
    OPEN: "#3b82f6",
    IN_PROGRESS: "#a855f7",
    WAITING: "#eab308",
    RESOLVED: "#22c55e",
    CLOSED: "#64748b",
  };
  const PRIORITY_COLORS: Record<string, string> = {
    LOW: "#22c55e",
    MEDIUM: "#eab308",
    HIGH: "#f97316",
    CRITICAL: "#ef4444",
  };
  const PRIORITY_LABELS: Record<string, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    CRITICAL: "Crítica",
  };

  // --- Dados Gráficos ---
  const statusEntries = Object.entries(stats.ticketsByStatus);
  const pieData = {
    labels: statusEntries.map(([key]) => key),
    datasets: [
      {
        data: statusEntries.map(([, value]) => value),
        backgroundColor: statusEntries.map(
          ([key]) => STATUS_COLORS[key] || "#ccc"
        ),
        borderWidth: 1,
      },
    ],
  };

  const priorityOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const priorityEntries = Object.entries(stats.ticketsByPriority).sort(
    (a, b) => priorityOrder.indexOf(a[0]) - priorityOrder.indexOf(b[0])
  );
  const barData = {
    labels: priorityEntries.map(([key]) => PRIORITY_LABELS[key] || key),
    datasets: [
      {
        label: "Chamados",
        data: priorityEntries.map(([, value]) => value),
        backgroundColor: priorityEntries.map(
          ([key]) => PRIORITY_COLORS[key] || "#ccc"
        ),
        borderRadius: 4,
      },
    ],
  };

  const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Centro de Comando
          </h1>
          <p className="text-gray-500">
            Monitoramento em tempo real da operação
          </p>
        </div>
        <button
          onClick={loadStats}
          className="text-sm text-blue-600 hover:underline">
          Atualizar dados
        </button>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          icon={<TicketIcon className="text-blue-600 h-6 w-6" />}
          title="Em Aberto"
          value={stats.totalOpen}
          bg="bg-blue-50"
        />
        <KpiCard
          icon={<CheckCircle className="text-green-600 h-6 w-6" />}
          title="Fechados Hoje"
          value={stats.totalClosedToday}
          bg="bg-green-50"
        />
        <KpiCard
          icon={
            <TrendingUp
              className={`h-6 w-6 ${stats.slaCompliancePercentage >= 80 ? "text-teal-600" : "text-red-600"}`}
            />
          }
          title="SLA Compliance"
          value={`${stats.slaCompliancePercentage.toFixed(1)}%`}
          bg={stats.slaCompliancePercentage >= 80 ? "bg-teal-50" : "bg-red-50"}
        />
        <KpiCard
          icon={
            <Star className="text-yellow-500 h-6 w-6" fill="currentColor" />
          }
          title="CSAT Médio"
          value={stats.averageRating.toFixed(1)}
          bg="bg-yellow-50"
          sub="/ 5.0"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- COLUNA ESQUERDA: LISTAS DE ATENÇÃO (2/3 da tela) --- */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. TICKETS EM RISCO (SLA) */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-50 bg-red-50/30 flex justify-between items-center">
              <h3 className="font-semibold text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Atenção: Risco de SLA (Vencidos ou &lt;48h)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Assunto</th>
                    <th className="px-6 py-3">Equipe/Técnico</th>
                    <th className="px-6 py-3">Vencimento</th>
                    <th className="px-6 py-3">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.ticketsAtRisk.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center text-gray-500">
                        Nenhum ticket em risco no momento.
                      </td>
                    </tr>
                  ) : (
                    stats.ticketsAtRisk.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">#{ticket.id}</td>
                        <td
                          className="px-6 py-4 truncate max-w-[200px]"
                          title={ticket.title}>
                          {ticket.title}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">
                              {ticket.targetTeamNome || "-"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {ticket.assigneeName || "Sem técnico"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isOverdue(ticket.dueDate)
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                            {ticket.dueDate
                              ? format(new Date(ticket.dueDate), "dd/MM HH:mm")
                              : "S/D"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="text-blue-600 hover:underline">
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. TODOS OS CHAMADOS RECENTES */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-500" />
                Últimos Chamados (Geral)
              </h3>
              <Link
                href="/tickets"
                className="text-sm text-blue-600 hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Assunto</th>
                    <th className="px-6 py-3">Solicitante</th>
                    <th className="px-6 py-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{
                            backgroundColor: STATUS_COLORS[ticket.status],
                          }}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate">
                        {ticket.title}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {ticket.requesterName}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {format(new Date(ticket.createdAt), "dd/MM/yy HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- COLUNA DIREITA: ANALYTICS E FEEDBACK (1/3 da tela) --- */}
        <div className="space-y-8">
          {/* GRÁFICOS COMPACTOS */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">
              Status Atual
            </h4>
            <div className="h-[200px] flex justify-center">
              <Pie
                data={pieData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">
              Volume por Prioridade
            </h4>
            <div className="h-[150px]">
              <Bar
                data={barData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { display: false } },
                }}
              />
            </div>
          </div>

          {/* LISTA DE AVALIAÇÕES BAIXAS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-orange-50/50">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-orange-500" />
                Motivos de Insatisfação
              </h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {stats.lowRatedTickets.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  Nenhuma avaliação baixa recente. Bom trabalho!
                </div>
              ) : (
                stats.lowRatedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-gray-700">
                        Ticket #{ticket.id}
                      </span>
                      <div className="flex text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={
                              i < (ticket.rating || 0) ? "currentColor" : "none"
                            }
                            className={
                              i < (ticket.rating || 0) ? "" : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 italic mb-2">
                      "{ticket.ratingComment || "Sem comentário"}"
                    </p>
                    <div className="text-xs text-gray-400 text-right">
                      Técnico: {ticket.assigneeName || "N/A"}
                    </div>
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="text-xs text-blue-500 hover:underline mt-1 block">
                      Investigar
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente Auxiliar para Cards
function KpiCard({
  icon,
  title,
  value,
  bg,
  sub,
}: {
  icon: any;
  title: string;
  value: string | number;
  bg: string;
  sub?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center transition-transform hover:scale-105">
      <div className={`p-4 rounded-full mr-4 ${bg}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <div className="flex items-baseline">
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          {sub && <span className="text-sm text-gray-400 ml-1">{sub}</span>}
        </div>
      </div>
    </div>
  );
}
