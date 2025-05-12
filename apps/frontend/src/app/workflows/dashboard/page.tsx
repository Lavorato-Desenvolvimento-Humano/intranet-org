// src/app/workflows/dashboard/page.tsx
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
} from "lucide-react";
import {
  WorkflowStatsDto,
  WorkflowSummaryDto,
  UserWorkloadDto,
} from "@/types/workflow";
import workflowService from "@/services/workflow";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
    const fetchData = async () => {
      try {
        // Carregar estatísticas gerais
        const statsData = await workflowService.getGeneralStats();
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
  }, []);

  const isLoading = Object.values(loading).some((value) => value);

  return (
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

      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

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
                <Loading size="small" message="Carregando prazos próximos..." />
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
            <Loading size="medium" message="Carregando suas estatísticas..." />
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
  );
}
