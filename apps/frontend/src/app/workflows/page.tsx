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
  Search,
  X,
} from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { CustomButton } from "@/components/ui/custom-button";
import WorkflowCard from "@/components/workflow/WorkflowCard";
import { Loading } from "@/components/ui/loading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import workflowService from "@/services/workflow";
import { WorkflowSummaryDto, WorkflowTemplateDto } from "@/types/workflow";
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

  // Estado para os templates e filtro de template
  const [templates, setTemplates] = useState<WorkflowTemplateDto[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Estado para pesquisa
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  // Função para buscar templates
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

  // Carregar templates ao iniciar a página
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchWorkflows = async (status?: string) => {
    try {
      setLoading(true);
      let response;

      // Se há termo de pesquisa, usar endpoint de pesquisa
      if (searchTerm.trim()) {
        setIsSearching(true);
        const searchStatus = status === "all" ? undefined : status;
        response = await workflowService.searchWorkflows(
          searchTerm.trim(),
          page,
          12,
          searchStatus,
          selectedTemplateId || undefined
        );
      } else {
        setIsSearching(false);
        // Lógica original sem pesquisa
        if (selectedTemplateId && status && status !== "all") {
          response = await workflowService.getWorkflowsByTemplateAndStatus(
            selectedTemplateId,
            status,
            page,
            12
          );
        } else if (selectedTemplateId) {
          response = await workflowService.getWorkflowsByTemplate(
            selectedTemplateId,
            page,
            12
          );
        } else if (status && status !== "all") {
          response = await workflowService.getWorkflowsByStatus(
            status,
            page,
            12
          );
        } else {
          response = await workflowService.getAllWorkflows(page, 12);
        }
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
      let data;

      // Se há termo de pesquisa, usar endpoint de pesquisa
      if (searchTerm.trim()) {
        data = await workflowService.searchAssignedWorkflows(
          searchTerm.trim(),
          selectedTemplateId || undefined
        );
      } else {
        // Lógica original sem pesquisa
        if (selectedTemplateId) {
          data =
            await workflowService.getAssignedWorkflowsByTemplate(
              selectedTemplateId
            );
        } else {
          data = await workflowService.getAssignedWorkflows();
        }
      }

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
  }, [activeTab, page, selectedTemplateId, searchTerm]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(0); // Reset para a primeira página ao mudar a tab
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplateId(e.target.value);
    setPage(0); // Reset para a primeira página ao aplicar filtro
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset para a primeira página ao pesquisar
  };

  const clearSearch = () => {
    setSearchTerm("");
    setPage(0);
  };

  const clearFilters = () => {
    setSelectedTemplateId("");
    setSearchTerm("");
    setPage(0);
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

  const getSelectedTemplateName = () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    return template ? template.name : "";
  };

  const hasActiveFilters = selectedTemplateId || searchTerm.trim();

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

        {/* Campo de Pesquisa */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar fluxos por título..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FilterIcon size={20} className="text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold">Filtros</h2>
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="text-sm text-primary hover:text-primary-dark">
              {isFilterOpen ? "Ocultar Filtros" : "Mostrar Filtros"}
            </button>
          </div>

          {isFilterOpen && (
            <div className="mb-4">
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
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Informação sobre filtros ativos */}
        {hasActiveFilters && (
          <div className="bg-blue-50 text-blue-800 p-3 rounded-md mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {searchTerm.trim() && (
                <span>Pesquisando: "{searchTerm.trim()}"</span>
              )}
              {selectedTemplateId && (
                <span>Template: {getSelectedTemplateName()}</span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 flex items-center">
              <X size={16} className="mr-1" />
              Limpar
            </button>
          </div>
        )}

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
                <p className="text-gray-600">{getEmptyStateMessage()}</p>
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
        <p className="text-gray-600 mb-6">{getEmptyStateMessage()}</p>
        {!hasActiveFilters && (
          <CustomButton
            variant="primary"
            icon={Plus}
            onClick={handleCreateWorkflow}>
            Criar Primeiro Fluxo
          </CustomButton>
        )}
      </div>
    );
  }

  // Função para gerar mensagem do estado vazio baseada nos filtros ativos
  function getEmptyStateMessage() {
    const parts = [];

    if (searchTerm.trim()) {
      parts.push(`com o termo "${searchTerm.trim()}"`);
    }

    if (selectedTemplateId) {
      parts.push(`do template "${getSelectedTemplateName()}"`);
    }

    if (activeTab !== "all" && activeTab !== "assigned") {
      parts.push(`com status "${getStatusDisplayName(activeTab)}"`);
    }

    if (activeTab === "assigned") {
      if (parts.length > 0) {
        return `Você não possui fluxos atribuídos ${parts.join(" e ")} no momento`;
      } else {
        return "Você não possui fluxos de trabalho atribuídos no momento";
      }
    }

    if (parts.length > 0) {
      return `Não existem fluxos ${parts.join(" e ")}`;
    } else {
      return "Crie seu primeiro fluxo de trabalho para começar";
    }
  }

  // Função auxiliar para obter nome legível do status
  function getStatusDisplayName(status: string) {
    switch (status) {
      case "in_progress":
        return "Em Andamento";
      case "paused":
        return "Pausado";
      case "completed":
        return "Concluído";
      case "canceled":
        return "Cancelado";
      case "archived":
        return "Arquivado";
      default:
        return status;
    }
  }
}
