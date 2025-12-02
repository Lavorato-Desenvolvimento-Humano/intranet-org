"use client";

import React, { useEffect, useState } from "react";
import { ticketService } from "@/services/ticket";
import equipeService, { EquipeDto } from "@/services/equipe";
import { DashboardStatsDto } from "@/types/ticket";
import {
  Ticket as TicketIcon,
  CheckCircle,
  Star,
  TrendingUp,
  Loader2,
  AlertTriangle,
  User,
  CheckSquare,
  Activity,
  RefreshCw,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import toastUtil from "@/utils/toast";

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
import CustomButton from "@/components/ui/custom-button";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";

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
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"risk" | "closed" | "activity">(
    "risk"
  );

  const [equipes, setEquipes] = useState<EquipeDto[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user, logout } = useAuth();

  useEffect(() => {
    const loadEquipes = async () => {
      try {
        const data = await equipeService.getAllEquipes();
        setEquipes(data);
      } catch (err) {
        console.error("Erro ao carregar equipes", err);
      }
    };
    loadEquipes();
  }, []);

  useEffect(() => {
    const isCanView = user?.roles?.some(
      (role) => role === "ROLE_ADMIN" || "ROLE_SUPERVISOR" || "ROLE_GERENTE"
    );

    if (!isCanView) {
      setError(
        "Você não tem permissões de administrador para acessar esta página"
      );
    } else {
      setError(null);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [selectedTeamId]);

  const handleReauth = () => {
    logout();
    toastUtil.info("Por favor, faça login novamente para continuar.");
    window.location.href = "/auth/login?callback=/tickets/dashboard";
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getDashboardStats(
        selectedTeamId || undefined
      );
      setStats(data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas", error);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex items-center text-red-500 mb-4">
            <AlertTriangle className="mr-2" />
            <h2 className="text-xl font-bold">Erro de Acesso</h2>
          </div>

          <p className="mb-6 text-gray-700">{error}</p>

          <div className="flex flex-col gap-3">
            <CustomButton onClick={handleRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </CustomButton>

            <CustomButton
              onClick={handleReauth}
              variant="primary"
              className="w-full border border-gray-300">
              Fazer login novamente
            </CustomButton>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) return null;

  // --- SAFE GUARDS (Proteção contra dados undefined) ---
  // Se o backend antigo for chamado, esses campos virão nulos.
  // Usamos "|| []" para garantir que sempre sejam arrays.
  const ticketsAtRisk = stats.ticketsAtRisk || [];
  const recentActivity = stats.recentActivity || [];
  const recentlyClosed = stats.recentlyClosed || [];
  const lowRatedTickets = stats.lowRatedTickets || [];

  const ticketsByStatus = stats.ticketsByStatus || {};
  const ticketsByPriority = stats.ticketsByPriority || {};

  // --- CORES ---
  const STATUS_COLORS: Record<string, string> = {
    OPEN: "#3b82f6", // blue-500
    IN_PROGRESS: "#a855f7", // purple-500
    WAITING: "#eab308", // yellow-500
    RESOLVED: "#22c55e", // green-500
    CLOSED: "#64748b", // slate-500
  };

  // --- DADOS PARA GRÁFICOS ---
  const pieData = {
    labels: Object.keys(ticketsByStatus),
    datasets: [
      {
        data: Object.values(ticketsByStatus),
        backgroundColor: Object.keys(ticketsByStatus).map(
          (key) => STATUS_COLORS[key] || "#ccc"
        ),
        borderWidth: 1,
      },
    ],
  };

  const priorityOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const priorityEntries = Object.entries(ticketsByPriority).sort(
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
    <ProtectedRoute
      requiredRoles={["ROLE_ADMIN", "ROLE_SUPERVISOR", "ROLE_GERENTE"]}>
      <div className="container mx-auto py-8 px-4 space-y-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Centro de Comando
            </h1>
            <p className="text-gray-500">Gestão operacional de suporte</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer hover:border-blue-400 transition-colors">
                <option value="">Todas as Equipes</option>
                {equipes.map((equipe) => (
                  <option key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>

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
            bg={
              stats.slaCompliancePercentage >= 80 ? "bg-teal-50" : "bg-red-50"
            }
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
            <div className="flex border-b border-gray-100 overflow-x-auto">
              <button
                onClick={() => setActiveTab("risk")}
                className={`flex-1 min-w-[150px] py-4 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === "risk" ? "border-red-500 text-red-600 bg-red-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                <AlertTriangle size={18} /> Em Risco
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`flex-1 min-w-[150px] py-4 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === "activity" ? "border-blue-500 text-blue-600 bg-blue-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                <Activity size={18} /> Atividade
              </button>
              <button
                onClick={() => setActiveTab("closed")}
                className={`flex-1 min-w-[150px] py-4 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === "closed" ? "border-green-500 text-green-600 bg-green-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                <CheckSquare size={18} /> Entregas
              </button>
            </div>

            {/* Conteúdo das Abas */}
            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
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
                    (ticketsAtRisk.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-gray-500">
                          Tudo sob controle! Nenhum chamado em risco.
                        </td>
                      </tr>
                    ) : (
                      ticketsAtRisk.map((ticket) => (
                        <TicketRow
                          key={ticket.id}
                          ticket={ticket}
                          dateLabel={ticket.dueDate}
                          dateColor="text-red-600"
                          colors={STATUS_COLORS}
                        />
                      ))
                    ))}

                  {/* 2. ATIVIDADE RECENTE */}
                  {activeTab === "activity" &&
                    (recentActivity.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-gray-500">
                          Nenhuma atividade recente.
                        </td>
                      </tr>
                    ) : (
                      recentActivity.map((ticket) => (
                        <TicketRow
                          key={ticket.id}
                          ticket={ticket}
                          dateLabel={ticket.updatedAt || ticket.createdAt}
                          dateColor="text-gray-500"
                          colors={STATUS_COLORS}
                        />
                      ))
                    ))}

                  {/* 3. FECHADOS */}
                  {activeTab === "closed" &&
                    (recentlyClosed.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-gray-500">
                          Nenhum ticket fechado recentemente.
                        </td>
                      </tr>
                    ) : (
                      recentlyClosed.map((ticket) => (
                        <TicketRow
                          key={ticket.id}
                          ticket={ticket}
                          dateLabel={ticket.closedAt}
                          dateColor="text-green-600"
                          colors={STATUS_COLORS}
                        />
                      ))
                    ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-gray-100 text-center bg-gray-50">
              <Link
                href="/tickets"
                className="text-xs text-blue-600 font-medium hover:underline">
                Pesquisar em todos os{" "}
                {stats.totalOpen + (recentlyClosed.length || 0)} chamados
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
                {lowRatedTickets.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500 text-center">
                    Nenhuma avaliação baixa recente.
                  </div>
                ) : (
                  lowRatedTickets.map((t) => (
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
                              fill={
                                i < (t.rating || 0) ? "currentColor" : "none"
                              }
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
                          {t.closedAt
                            ? format(new Date(t.closedAt), "dd/MM")
                            : ""}
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
    </ProtectedRoute>
  );
}

// Subcomponente de Linha da Tabela
function TicketRow({ ticket, dateLabel, dateColor, colors }: any) {
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/tickets/${ticket.id}`);
  };
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
          style={{ backgroundColor: colors[ticket.status] || "#999" }}>
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
          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-700 uppercase">
            {ticket.requesterName ? ticket.requesterName.charAt(0) : "U"}
          </div>
          <span
            className="text-xs text-gray-600 truncate max-w-[120px]"
            title={ticket.requesterName}>
            {ticket.requesterName}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 uppercase">
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
