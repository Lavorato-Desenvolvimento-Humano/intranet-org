"use client";

import React, { useEffect, useState } from "react";
import { ticketService } from "@/services/ticket";
import { DashboardStatsDto, TicketStatus } from "@/types/ticket";
import {
  Ticket as TicketIcon,
  CheckCircle,
  Star,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Search,
  User,
  Clock,
  CheckSquare,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
// import { ptBR } from "date-fns/locale"; // Descomente se tiver configurado

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
  const [activeTab, setActiveTab] = useState<"risk" | "closed" | "activity">(
    "risk"
  );

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

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  if (!stats) return null;

  // Cores
  const STATUS_COLORS: Record<string, string> = {
    OPEN: "#3b82f6",
    IN_PROGRESS: "#a855f7",
    WAITING: "#eab308",
    RESOLVED: "#22c55e",
    CLOSED: "#64748b",
  };

  // Dados Gráficos
  const pieData = {
    labels: Object.keys(stats.ticketsByStatus),
    datasets: [
      {
        data: Object.values(stats.ticketsByStatus),
        backgroundColor: Object.keys(stats.ticketsByStatus).map(
          (key) => STATUS_COLORS[key] || "#ccc"
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
    labels: priorityEntries.map(([k]) => k),
    datasets: [
      {
        label: "Chamados",
        data: priorityEntries.map(([, v]) => v),
        backgroundColor: ["#22c55e", "#eab308", "#f97316", "#ef4444"],
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Centro de Comando
          </h1>
          <p className="text-gray-500">Gestão operacional de suporte</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/tickets"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            Ver Lista Completa
          </Link>
          <button
            onClick={loadStats}
            className="text-sm text-blue-600 hover:underline">
            Atualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          icon={<TicketIcon className="text-blue-600" />}
          title="Em Aberto"
          value={stats.totalOpen}
          bg="bg-blue-50"
        />
        <KpiCard
          icon={<CheckCircle className="text-green-600" />}
          title="Fechados Hoje"
          value={stats.totalClosedToday}
          bg="bg-green-50"
        />
        <KpiCard
          icon={
            <TrendingUp
              className={
                stats.slaCompliancePercentage >= 80
                  ? "text-teal-600"
                  : "text-red-600"
              }
            />
          }
          title="SLA Compliance"
          value={`${stats.slaCompliancePercentage.toFixed(1)}%`}
          bg={stats.slaCompliancePercentage >= 80 ? "bg-teal-50" : "bg-red-50"}
        />
        <KpiCard
          icon={<Star className="text-yellow-500" fill="currentColor" />}
          title="CSAT"
          value={stats.averageRating.toFixed(1)}
          bg="bg-yellow-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUNA ESQUERDA: LISTAS TABULADAS (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
          {/* Header das Abas */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab("risk")}
              className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === "risk" ? "border-red-500 text-red-600 bg-red-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              <AlertTriangle size={18} /> Em Risco / Atrasados
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === "activity" ? "border-blue-500 text-blue-600 bg-blue-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              <Activity size={18} /> Atividade Recente (Todos)
            </button>
            <button
              onClick={() => setActiveTab("closed")}
              className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === "closed" ? "border-green-500 text-green-600 bg-green-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              <CheckSquare size={18} /> Últimos Fechados
            </button>
          </div>

          {/* Conteúdo das Abas */}
          <div className="flex-1 overflow-auto p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Assunto</th>
                  <th className="px-6 py-3">Responsável</th>
                  <th className="px-6 py-3 text-right">Data/Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* 1. EM RISCO */}
                {activeTab === "risk" &&
                  (stats.ticketsAtRisk.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        Tudo sob controle! Nenhum chamado em risco.
                      </td>
                    </tr>
                  ) : (
                    stats.ticketsAtRisk.map((ticket) => (
                      <TicketRow
                        key={ticket.id}
                        ticket={ticket}
                        dateLabel={ticket.dueDate}
                        dateColor="text-red-600"
                        colors={STATUS_COLORS}
                      />
                    ))
                  ))}

                {/* 2. ATIVIDADE RECENTE (MOSTRA QUALQUER UM) */}
                {activeTab === "activity" &&
                  stats.recentActivity.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      dateLabel={ticket.updatedAt || ticket.createdAt}
                      dateColor="text-gray-500"
                      colors={STATUS_COLORS}
                    />
                  ))}

                {/* 3. FECHADOS */}
                {activeTab === "closed" &&
                  stats.recentlyClosed.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      dateLabel={ticket.closedAt}
                      dateColor="text-green-600"
                      colors={STATUS_COLORS}
                    />
                  ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-gray-100 text-center bg-gray-50">
            <Link
              href="/tickets"
              className="text-xs text-blue-600 font-medium hover:underline">
              Pesquisar em todos os{" "}
              {
                stats.totalOpen +
                  stats.recentlyClosed.length /* apenas estimativa visual */
              }{" "}
              chamados
            </Link>
          </div>
        </div>

        {/* COLUNA DIREITA: ANALYTICS (1/3) */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-sm font-bold text-gray-700 mb-4">
              Volume por Status
            </h4>
            <div className="h-[200px] flex justify-center">
              <Pie
                data={pieData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "right" } },
                }}
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-sm font-bold text-gray-700 mb-4">
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

          {/* Avaliações Baixas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-orange-50 flex items-center justify-between">
              <h4 className="text-sm font-bold text-orange-800 flex items-center gap-2">
                <Star size={16} /> Atenção à Qualidade
              </h4>
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
              {stats.lowRatedTickets.length === 0 ? (
                <div className="p-4 text-xs text-gray-500 text-center">
                  Nenhuma avaliação baixa recente.
                </div>
              ) : (
                stats.lowRatedTickets.map((t) => (
                  <div key={t.id} className="p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <Link
                        href={`/tickets/${t.id}`}
                        className="text-xs font-bold text-gray-700 hover:underline">
                        #{t.id}
                      </Link>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            fill={i < (t.rating || 0) ? "currentColor" : "none"}
                            className={
                              i < (t.rating || 0) ? "" : "text-gray-200"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 italic">
                      "{t.ratingComment || "Sem comentário"}"
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                        {t.assigneeName || "N/A"}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {format(new Date(t.closedAt!), "dd/MM")}
                      </span>
                    </div>
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

// Subcomponente de Linha da Tabela
function TicketRow({ ticket, dateLabel, dateColor, colors }: any) {
  return (
    <tr className="bg-white hover:bg-gray-50 transition-colors group">
      <td className="px-6 py-4 font-medium text-gray-900">
        <Link href={`/tickets/${ticket.id}`} className="hover:underline">
          #{ticket.id}
        </Link>
      </td>
      <td className="px-6 py-4">
        <span
          className="px-2 py-1 rounded text-[10px] font-bold text-white shadow-sm"
          style={{ backgroundColor: colors[ticket.status] }}>
          {ticket.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div
          className="text-sm text-gray-800 truncate max-w-[180px]"
          title={ticket.title}>
          {ticket.title}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
            {ticket.assigneeName ? (
              ticket.assigneeName.charAt(0)
            ) : (
              <User size={12} />
            )}
          </div>
          <span className="text-xs text-gray-600 truncate max-w-[100px]">
            {ticket.assigneeName || "—"}
          </span>
        </div>
      </td>
      <td className={`px-6 py-4 text-right text-xs font-medium ${dateColor}`}>
        {dateLabel ? format(new Date(dateLabel), "dd/MM HH:mm") : "-"}
      </td>
    </tr>
  );
}

function KpiCard({ icon, title, value, bg }: any) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
      <div className={`p-3 rounded-lg mr-4 ${bg} [&>svg]:w-6 [&>svg]:h-6`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-gray-800 mt-0.5">{value}</h3>
      </div>
    </div>
  );
}
