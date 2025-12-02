"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import WorkflowStats from "@/components/workflow/WorkflowStats";
import UsersWorkload from "@/components/workflow/UsersWorkload";
import WorkflowCard from "@/components/workflow/WorkflowCard";
import {
  AlertTriangle,
  Clock,
  UserCheck,
  BarChart2,
  ChevronRight,
  RefreshCw,
  Filter,
  Users,
  PieChart,
  CheckCircle,
} from "lucide-react";
import {
  WorkflowStatsDto,
  WorkflowSummaryDto,
  UserWorkloadDto,
  WorkflowTemplateDto,
  WorkflowStatusTemplateDto,
} from "@/types/workflow";
import workflowService from "@/services/workflow";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import toastUtil from "@/utils/toast";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Estados de Dados
  const [stats, setStats] = useState<WorkflowStatsDto | null>(null);
  const [userStats, setUserStats] = useState<WorkflowStatsDto | null>(null);
  const [overdueWorkflows, setOverdueWorkflows] = useState<
    WorkflowSummaryDto[]
  >([]);
  const [nearDeadlineWorkflows, setNearDeadlineWorkflows] = useState<
    WorkflowSummaryDto[]
  >([]);
  const [assignedWorkflows, setAssignedWorkflows] = useState<
    WorkflowSummaryDto[]
  >([]);
  const [usersWorkload, setUsersWorkload] = useState<UserWorkloadDto[]>([]);

  // Estados de Filtro
  const [templates, setTemplates] = useState<WorkflowTemplateDto[]>([]);
  const [statusTemplates, setStatusTemplates] = useState<
    WorkflowStatusTemplateDto[]
  >([]);

  // FILTROS SELECIONADOS
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedStatusTemplateId, setSelectedStatusTemplateId] =
    useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Estados de Loading e Erro
  const [loading, setLoading] = useState({
    global: true,
    stats: true,
  });
  const [error, setError] = useState<string | null>(null);

  // 1. Carregamento Inicial (Templates e Usuários/Carga)
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [templatesRes, statusTemplatesRes, workloadRes] =
          await Promise.all([
            workflowService.getAllTemplates(0, 100),
            workflowService.getAllStatusTemplates(0, 100),
            workflowService.getUsersWorkload(),
          ]);

        setTemplates(templatesRes.content || []);
        setStatusTemplates(statusTemplatesRes.content || []);
        setUsersWorkload(workloadRes);
      } catch (err) {
        console.error("Erro ao carregar dados base", err);
      } finally {
        setLoading((prev) => ({ ...prev, global: false }));
      }
    };
    fetchBaseData();
  }, []);

  // 2. Carregamento de Dados Dinâmicos (Sempre que um filtro mudar)
  useEffect(() => {
    const fetchData = async () => {
      setLoading((prev) => ({ ...prev, stats: true }));
      try {
        const statsData = await workflowService.getStatsWithFilters({
          templateId: selectedTemplateId,
          statusTemplateId: selectedStatusTemplateId,
          userId: selectedUserId,
        });
        setStats(statsData);

        // Buscar listas específicas
        // Dica: Se selecionar um usuário, filtre os atrasados desse usuário
        const overdueData = await workflowService.findOverdueWorkflows();
        // Filtragem no front se o back não suportar parâmetros ainda:
        const filteredOverdue = selectedUserId
          ? overdueData.filter((w) => w.currentAssigneeId === selectedUserId)
          : overdueData;
        setOverdueWorkflows(filteredOverdue);

        const nearDeadlineData =
          await workflowService.findWorkflowsNearDeadline(3);
        const filteredNear = selectedUserId
          ? nearDeadlineData.filter(
              (w) => w.currentAssigneeId === selectedUserId
            )
          : nearDeadlineData;
        setNearDeadlineWorkflows(filteredNear);
      } catch (err) {
        console.error("Erro ao buscar dados do dashboard", err);
      } finally {
        setLoading((prev) => ({ ...prev, stats: false, global: false }));
      }
    };

    if (!loading.global) {
      fetchData();
    }
  }, [
    selectedTemplateId,
    selectedStatusTemplateId,
    selectedUserId,
    loading.global,
  ]);

  // Função para limpar filtros
  const clearFilters = () => {
    setSelectedTemplateId("");
    setSelectedStatusTemplateId("");
    setSelectedUserId("");
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-6 px-4 bg-gray-50 min-h-screen">
        <Breadcrumb
          items={[
            { label: "Fluxos", href: "/workflows" },
            { label: "Dashboard" },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Dashboard Gerencial
            </h1>
            <p className="text-gray-600">
              Visão geral da produtividade e gargalos
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 hover:bg-gray-200 rounded-full"
            title="Atualizar">
            <RefreshCw size={20} className="text-gray-600" />
          </button>
        </div>

        {/* ÁREA DE FILTROS - Melhorada */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Filter size={20} className="text-primary" /> Filtros Globais
            </h2>
            {(selectedTemplateId ||
              selectedStatusTemplateId ||
              selectedUserId) && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-500 hover:text-red-700 font-medium">
                Limpar Filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro de Usuário (Novo) */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Colaborador
              </label>
              <div className="relative">
                <Users
                  size={16}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
                  <option value="">Todos os Colaboradores</option>
                  {usersWorkload.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.userName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtro de Template */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Processo / Fluxo
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  setSelectedTemplateId(e.target.value);
                  setSelectedStatusTemplateId("");
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                <option value="">Todos os Processos</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Template de Status */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Tipo de Status
              </label>
              <select
                value={selectedStatusTemplateId}
                onChange={(e) => {
                  setSelectedStatusTemplateId(e.target.value);
                  setSelectedTemplateId("");
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                <option value="">Todos os Tipos</option>
                {statusTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ESTATÍSTICAS VISUAIS (Melhoria 1) */}
        {loading.stats ? (
          <Loading />
        ) : (
          stats && (
            <div className="mb-8">
              <WorkflowStats stats={stats} />
              {/* Sugestão: Adicionar um componente de gráfico aqui se tiver biblioteca instalada */}
            </div>
          )
        )}

        {/* LISTAS DE ATENÇÃO (Melhoria 3 - Scroll e Ver todos) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Card de Atrasados */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-100 bg-red-50 rounded-t-xl flex justify-between items-center">
              <h3 className="font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle size={18} /> Atrasados ({overdueWorkflows.length}
                )
              </h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              {overdueWorkflows.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <CheckCircle
                    size={40}
                    className="mb-2 text-green-500 opacity-50"
                  />
                  <p>Tudo em dia!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Removemos o .slice() para mostrar todos */}
                  {overdueWorkflows.map((wf) => (
                    <WorkflowCard key={wf.id} workflow={wf} compact={true} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card de Próximos do Prazo */}
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-100 bg-orange-50 rounded-t-xl flex justify-between items-center">
              <h3 className="font-bold text-orange-700 flex items-center gap-2">
                <Clock size={18} /> Vencem em breve (
                {nearDeadlineWorkflows.length})
              </h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              {nearDeadlineWorkflows.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <p>Nenhum prazo crítico próximo.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nearDeadlineWorkflows.map((wf) => (
                    <WorkflowCard key={wf.id} workflow={wf} compact={true} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carga de Trabalho */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart2 size={24} className="text-gray-700" /> Distribuição de
            Carga
          </h2>
          <UsersWorkload usersWorkload={usersWorkload} />
        </div>
      </div>
    </>
  );
}
