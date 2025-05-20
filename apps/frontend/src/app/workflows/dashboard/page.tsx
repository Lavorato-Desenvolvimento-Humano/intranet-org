// apps/frontend/src/app/workflows/dashboard/page.tsx
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
  const [retryCount, setRetryCount] = useState(0);
  const { user, logout } = useAuth();

  // Novo estado para filtros
  const [templates, setTemplates] = useState<WorkflowTemplateDto[]>([]);
  const [statusTemplates, setStatusTemplates] = useState<
    WorkflowStatusTemplateDto[]
  >([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedStatusTemplateId, setSelectedStatusTemplateId] =
    useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingStatusTemplates, setLoadingStatusTemplates] = useState(false);

  const [loading, setLoading] = useState({
    stats: true,
    userStats: true,
    overdue: true,
    nearDeadline: true,
    assigned: true,
    workload: true,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Função para carregar templates
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const response = await workflowService.getAllTemplates(0, 100);
        setTemplates(response.content || []);
      } catch (err) {
        console.error("Erro ao carregar templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    // Função para carregar templates de status
    const fetchStatusTemplates = async () => {
      try {
        setLoadingStatusTemplates(true);
        const response = await workflowService.getAllStatusTemplates(0, 100);
        setStatusTemplates(response.content || []);
      } catch (err) {
        console.error("Erro ao carregar templates de status:", err);
      } finally {
        setLoadingStatusTemplates(false);
      }
    };

    // Carregar templates e templates de status
    fetchTemplates();
    fetchStatusTemplates();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carregar estatísticas gerais com base no filtro de template
        setLoading((prev) => ({ ...prev, stats: true }));
        let statsData;

        if (selectedTemplateId) {
          // Se um template de fluxo está selecionado
          statsData =
            await workflowService.getStatsByTemplate(selectedTemplateId);
        } else if (selectedStatusTemplateId) {
          // Se um template de status está selecionado
          statsData = await workflowService.getStatsByStatusTemplate(
            selectedStatusTemplateId
          );
        } else {
          // Sem filtro
          statsData = await workflowService.getGeneralStats();
        }

        setStats(statsData);
      } catch (err) {
        console.error("Erro ao carregar estatísticas gerais:", err);
        setError("Não foi possível carregar algumas estatísticas.");
      } finally {
        setLoading((prev) => ({ ...prev, stats: false }));
      }

      try {
        // Carregar estatísticas do usuário
        const userStatsData = await workflowService.getUserStats();
        setUserStats(userStatsData);
      } catch (err) {
        console.error("Erro ao carregar estatísticas do usuário:", err);
      } finally {
        setLoading((prev) => ({ ...prev, userStats: false }));
      }

      try {
        // Carregar fluxos atrasados
        const overdueData = await workflowService.findOverdueWorkflows();
        setOverdueWorkflows(overdueData);
      } catch (err) {
        console.error("Erro ao carregar fluxos atrasados:", err);
      } finally {
        setLoading((prev) => ({ ...prev, overdue: false }));
      }

      try {
        // Carregar fluxos com prazo próximo
        const nearDeadlineData =
          await workflowService.findWorkflowsNearDeadline(3);
        setNearDeadlineWorkflows(nearDeadlineData);
      } catch (err) {
        console.error("Erro ao carregar fluxos com prazo próximo:", err);
      } finally {
        setLoading((prev) => ({ ...prev, nearDeadline: false }));
      }

      try {
        // Carregar fluxos atribuídos
        const assignedData = await workflowService.getAssignedWorkflows();
        setAssignedWorkflows(assignedData);
      } catch (err) {
        console.error("Erro ao carregar fluxos atribuídos:", err);
      } finally {
        setLoading((prev) => ({ ...prev, assigned: false }));
      }

      try {
        // Carregar carga de trabalho dos usuários
        const workloadData = await workflowService.getUsersWorkload();
        setUsersWorkload(workloadData);
      } catch (err) {
        console.error("Erro ao carregar carga de trabalho:", err);
      } finally {
        setLoading((prev) => ({ ...prev, workload: false }));
      }
    };

    fetchData();
  }, [selectedTemplateId, selectedStatusTemplateId]);

  useEffect(() => {
    // Verificar se o usuário tem a role de ADMIN
    const isAdmin = user?.roles?.some(
      (role) => role === "ROLE_ADMIN" || role === "ADMIN"
    );

    if (!isAdmin) {
      setError(
        "Você não tem permissões de administrador para acessar esta página"
      );
    } else {
      setError(null);
    }
  }, [user]);

  // Função para forçar o recarregamento da pagina
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    window.location.reload();
  };

  // Função para tentar reautenticar o usuário
  const handleReauth = () => {
    logout();
    toastUtil.info("Por favor, faça login novamente para continuar.");
    window.location.href = "/auth/login?callback=/admin";
  };

  // Função para lidar com mudanças no filtro de template
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);

    // Limpar o filtro de template de status se um template de fluxo for selecionado
    if (templateId) {
      setSelectedStatusTemplateId("");
    }
  };

  // Função para lidar com mudanças no filtro de template de status
  const handleStatusTemplateChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const statusTemplateId = e.target.value;
    setSelectedStatusTemplateId(statusTemplateId);

    // Limpar o filtro de template se um template de status for selecionado
    if (statusTemplateId) {
      setSelectedTemplateId("");
    }
  };

  // Função para limpar os filtros
  const clearFilters = () => {
    setSelectedTemplateId("");
    setSelectedStatusTemplateId("");
  };

  const isLoading = Object.values(loading).some((value) => value);

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
            <button
              onClick={handleRetry}
              className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark flex items-center justify-center">
              <RefreshCw size={16} className="mr-2" />
              Tentar novamente
            </button>

            <button
              onClick={handleReauth}
              className="w-full border border-gray-300 px-4 py-2 rounded hover:bg-gray-100">
              Fazer login novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-6 px-4">
        <Breadcrumb
          items={[
            { label: "Fluxos de Trabalho", href: "/workflows" },
            { label: "Dashboard" },
          ]}
        />

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard de Fluxos</h1>
          <p className="text-gray-600">
            Monitoramento e acompanhamento dos fluxos de trabalho
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center mb-4">
            <Filter size={20} className="text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template de Fluxo
              </label>
              <select
                value={selectedTemplateId}
                onChange={handleTemplateChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loadingTemplates}>
                <option value="">Todos os templates</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template de Status
              </label>
              <select
                value={selectedStatusTemplateId}
                onChange={handleStatusTemplateChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loadingStatusTemplates}>
                <option value="">Todos os templates de status</option>
                {statusTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors">
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Resto do conteúdo do dashboard */}
        <Tabs defaultValue="general">
          <TabsList className="bg-white rounded-lg shadow-sm p-1 mb-4">
            <TabsTrigger value="general" className="py-2 px-4">
              <BarChart2 size={16} className="mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="personal" className="py-2 px-4">
              <UserCheck size={16} className="mr-2" />
              Meus Fluxos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            {loading.stats ? (
              <Loading size="medium" message="Carregando estatísticas..." />
            ) : stats ? (
              <WorkflowStats stats={stats} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600">
                  Nenhum dado estatístico disponível.
                </p>
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Carga de Trabalho</h2>
              {loading.workload ? (
                <Loading
                  size="medium"
                  message="Carregando dados de carga de trabalho..."
                />
              ) : (
                <UsersWorkload usersWorkload={usersWorkload} />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <AlertTriangle size={20} className="text-red-500 mr-2" />
                    Fluxos Atrasados
                  </h2>
                  <button
                    className="text-primary hover:text-primary-dark flex items-center text-sm"
                    onClick={() => router.push("/workflows?filter=overdue")}>
                    Ver todos
                    <ChevronRight size={16} />
                  </button>
                </div>

                {loading.overdue ? (
                  <Loading
                    size="small"
                    message="Carregando fluxos atrasados..."
                  />
                ) : overdueWorkflows.length > 0 ? (
                  <div className="space-y-3">
                    {overdueWorkflows.slice(0, 3).map((workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <p className="text-gray-600">Nenhum fluxo atrasado.</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Clock size={20} className="text-orange-500 mr-2" />
                    Próximos do Prazo
                  </h2>
                  <button
                    className="text-primary hover:text-primary-dark flex items-center text-sm"
                    onClick={() =>
                      router.push("/workflows?filter=near_deadline")
                    }>
                    Ver todos
                    <ChevronRight size={16} />
                  </button>
                </div>

                {loading.nearDeadline ? (
                  <Loading
                    size="small"
                    message="Carregando prazos próximos..."
                  />
                ) : nearDeadlineWorkflows.length > 0 ? (
                  <div className="space-y-3">
                    {nearDeadlineWorkflows.slice(0, 3).map((workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <p className="text-gray-600">
                      Nenhum fluxo com prazo próximo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="personal">
            {loading.userStats ? (
              <Loading
                size="medium"
                message="Carregando suas estatísticas..."
              />
            ) : userStats ? (
              <WorkflowStats stats={userStats} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600">
                  Nenhum dado estatístico disponível.
                </p>
              </div>
            )}

            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <UserCheck size={20} className="text-blue-500 mr-2" />
                  Atribuídos a Mim
                </h2>
                <button
                  className="text-primary hover:text-primary-dark flex items-center text-sm"
                  onClick={() => router.push("/workflows?tab=assigned")}>
                  Ver todos
                  <ChevronRight size={16} />
                </button>
              </div>

              {loading.assigned ? (
                <Loading size="small" message="Carregando seus fluxos..." />
              ) : assignedWorkflows.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedWorkflows.slice(0, 6).map((workflow) => (
                    <WorkflowCard key={workflow.id} workflow={workflow} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <p className="text-gray-600">
                    Nenhum fluxo atribuído a você no momento.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
