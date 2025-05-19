// src/app/workflows/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  FilterIcon,
  Settings,
  Home,
  CircleEqualIcon,
} from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { CustomButton } from "@/components/ui/custom-button";
import WorkflowCard from "@/components/workflow/WorkflowCard";
import { Loading } from "@/components/ui/loading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import workflowService from "@/services/workflow";
import { WorkflowSummaryDto } from "@/types/workflow";
import Navbar from "@/components/layout/Navbar";

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [assignedWorkflows, setAssignedWorkflows] = useState<
    WorkflowSummaryDto[]
  >([]);
  const [loadingAssigned, setLoadingAssigned] = useState(true);

  const fetchWorkflows = async (status?: string) => {
    try {
      setLoading(true);
      let response;

      if (status && status !== "all") {
        response = await workflowService.getWorkflowsByStatus(status, page, 12);
      } else {
        response = await workflowService.getAllWorkflows(page, 12);
      }

      setWorkflows(response.content || []);
      setTotalPages(Math.ceil((response.totalElements || 0) / 12));
    } catch (err) {
      console.error("Erro ao carregar fluxos:", err);
      setError(
        "Não foi possível carregar os fluxos. Tente novamente mais tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedWorkflows = async () => {
    try {
      setLoadingAssigned(true);
      const data = await workflowService.getAssignedWorkflows();
      setAssignedWorkflows(data);
    } catch (err) {
      console.error("Erro ao carregar fluxos atribuídos:", err);
    } finally {
      setLoadingAssigned(false);
    }
  };

  useEffect(() => {
    if (activeTab === "assigned") {
      fetchAssignedWorkflows();
    } else {
      const status = activeTab === "all" ? undefined : activeTab;
      fetchWorkflows(status);
    }
  }, [activeTab, page]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(0); // Reset para a primeira página ao mudar a tab
  };

  const handleCreateWorkflow = () => {
    router.push("/workflows/create");
  };

  const handleViewTemplates = () => {
    router.push("/workflows/templates");
  };

  const handleViewStatusTemplates = () => {
    router.push("/workflows/status-templates");
  };

  const handleDashboard = () => {
    router.push("/workflows/dashboard");
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-6 px-4">
        <Breadcrumb items={[{ label: "Fluxos de Trabalho" }]} />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Fluxos de Trabalho</h1>
            <p className="text-gray-600">
              Gerencie e acompanhe seus fluxos de trabalho
            </p>
          </div>

          <div className="flex space-x-3">
            <CustomButton
              variant="primary"
              icon={Home}
              onClick={handleDashboard}>
              Dashboard
            </CustomButton>
            <CustomButton
              variant="primary"
              icon={Settings}
              onClick={handleViewTemplates}>
              Templates
            </CustomButton>
            <CustomButton
              variant="primary"
              icon={CircleEqualIcon}
              onClick={handleViewStatusTemplates}>
              Templates de Status
            </CustomButton>
            <CustomButton
              variant="primary"
              icon={Plus}
              onClick={handleCreateWorkflow}>
              Novo Fluxo
            </CustomButton>
          </div>
        </div>

        <Tabs defaultValue="all" className="py-2 px-4">
          <TabsList className="bg-white rounded-lg shadow-sm p-1 mb-4">
            <TabsTrigger
              value="all"
              className="py-2 px-4"
              onClick={() => handleTabChange("all")}>
              Todos
            </TabsTrigger>
            <TabsTrigger
              value="in_progress"
              className="py-2 px-4"
              onClick={() => handleTabChange("in_progress")}>
              Em Andamento
            </TabsTrigger>
            <TabsTrigger
              value="paused"
              className="py-2 px-4"
              onClick={() => handleTabChange("paused")}>
              Pausados
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="py-2 px-4"
              onClick={() => handleTabChange("completed")}>
              Concluídos
            </TabsTrigger>
            <TabsTrigger
              value="assigned"
              className="py-2 px-4"
              onClick={() => handleTabChange("assigned")}>
              Atribuídos a Mim
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderWorkflowList(workflows, loading, error)}
          </TabsContent>

          <TabsContent value="in_progress">
            {renderWorkflowList(workflows, loading, error)}
          </TabsContent>

          <TabsContent value="paused">
            {renderWorkflowList(workflows, loading, error)}
          </TabsContent>

          <TabsContent value="completed">
            {renderWorkflowList(workflows, loading, error)}
          </TabsContent>

          <TabsContent value="assigned">
            {loadingAssigned ? (
              <Loading
                size="medium"
                message="Carregando fluxos atribuídos..."
              />
            ) : assignedWorkflows.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedWorkflows.map((workflow) => (
                  <WorkflowCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum fluxo atribuído a você
                </h3>
                <p className="text-gray-600">
                  Você não possui fluxos de trabalho atribuídos no momento
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {totalPages > 1 && activeTab !== "assigned" && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className={`px-4 py-2 rounded ${
                  page === 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}>
                Anterior
              </button>

              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPage(index)}
                  className={`px-4 py-2 rounded ${
                    page === index
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}>
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className={`px-4 py-2 rounded ${
                  page === totalPages - 1
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}>
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  function renderWorkflowList(
    items: WorkflowSummaryDto[],
    isLoading: boolean,
    errorMessage: string | null
  ) {
    if (isLoading) {
      return <Loading size="medium" message="Carregando fluxos..." />;
    }

    if (errorMessage) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      );
    }

    if (items.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum fluxo encontrado</h3>
        <p className="text-gray-600 mb-6">
          Crie seu primeiro fluxo de trabalho para começar
        </p>
        <CustomButton
          variant="primary"
          icon={Plus}
          onClick={handleCreateWorkflow}>
          Criar Primeiro Fluxo
        </CustomButton>
      </div>
    );
  }
}
