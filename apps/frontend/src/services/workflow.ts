// src/services/workflow.ts
import api from "./api";
import {
  WorkflowDto,
  WorkflowSummaryDto,
  WorkflowCreateDto,
  WorkflowTemplateDto,
  WorkflowTemplateCreateDto,
  WorkflowAssignmentDto,
  WorkflowTransitionDto,
  WorkflowStatsDto,
  UserWorkloadDto,
  WorkflowNotificationDto,
  WorkflowStatusTemplateDto,
  WorkflowStatusTemplateCreateDto,
  WorkflowStatusItemDto,
} from "@/types/workflow";

const workflowService = {
  // Templates
  getAllTemplates: async (page = 0, size = 10) => {
    try {
      const response = await api.get<{
        content: WorkflowTemplateDto[];
        totalElements: number;
      }>(`/api/workflow-templates?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar templates:", error);
      throw error;
    }
  },

  getTemplateById: async (id: string) => {
    try {
      const response = await api.get<WorkflowTemplateDto>(
        `/api/workflow-templates/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar template ${id}:`, error);
      throw error;
    }
  },

  createTemplate: async (template: WorkflowTemplateCreateDto) => {
    try {
      const response = await api.post<WorkflowTemplateDto>(
        "/api/workflow-templates",
        template
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao criar template:", error);
      throw error;
    }
  },

  updateTemplate: async (id: string, template: WorkflowTemplateCreateDto) => {
    try {
      const response = await api.put<WorkflowTemplateDto>(
        `/api/workflow-templates/${id}`,
        template
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar template ${id}:`, error);
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    try {
      await api.delete(`/api/workflow-templates/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir template ${id}:`, error);
      throw error;
    }
  },

  // Workflows
  getAllWorkflows: async (page = 0, size = 10) => {
    try {
      const response = await api.get<{
        content: WorkflowSummaryDto[];
        totalElements: number;
      }>(`/api/workflows?page=${page}&size=${size}`);

      // Debug: verificar se os dados incluem status personalizado
      console.log("Response dos workflows:", response.data);
      if (response.data.content && response.data.content.length > 0) {
        console.log("Primeiro workflow:", response.data.content[0]);
      }

      return response.data;
    } catch (error) {
      console.error("Erro ao buscar fluxos:", error);
      throw error;
    }
  },

  getWorkflowById: async (id: string) => {
    try {
      const response = await api.get<WorkflowDto>(`/api/workflows/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar fluxo ${id}:`, error);
      throw error;
    }
  },

  createWorkflow: async (workflow: WorkflowCreateDto) => {
    try {
      const response = await api.post<WorkflowDto>("/api/workflows", workflow);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar fluxo:", error);
      throw error;
    }
  },

  updateWorkflow: async (id: string, workflow: WorkflowCreateDto) => {
    try {
      const response = await api.put<WorkflowDto>(
        `/api/workflows/${id}`,
        workflow
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar fluxo ${id}:`, error);
      throw error;
    }
  },

  // Ações de workflow
  advanceToNextStep: async (
    id: string,
    assignToId: string,
    comments?: string
  ) => {
    try {
      const response = await api.post<WorkflowDto>(
        `/api/workflows/${id}/next-step?assignToId=${assignToId}${comments ? `&comments=${encodeURIComponent(comments)}` : ""}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao avançar fluxo ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (id: string, newStatus: string, comments?: string) => {
    try {
      const response = await api.post<WorkflowDto>(
        `/api/workflows/${id}/status?newStatus=${newStatus}${comments ? `&comments=${encodeURIComponent(comments)}` : ""}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar status do fluxo ${id}:`, error);
      throw error;
    }
  },

  assignStep: async (
    id: string,
    stepNumber: number,
    assignToId: string,
    comments?: string
  ) => {
    try {
      const response = await api.post<WorkflowAssignmentDto>(
        `/api/workflows/${id}/assign?stepNumber=${stepNumber}&assignToId=${assignToId}${comments ? `&comments=${encodeURIComponent(comments)}` : ""}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atribuir etapa do fluxo ${id}:`, error);
      throw error;
    }
  },

  completeStep: async (id: string, stepNumber: number, comments?: string) => {
    try {
      const response = await api.post<WorkflowAssignmentDto>(
        `/api/workflows/${id}/complete-step?stepNumber=${stepNumber}${comments ? `&comments=${encodeURIComponent(comments)}` : ""}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao concluir etapa do fluxo ${id}:`, error);
      throw error;
    }
  },

  archiveWorkflow: async (id: string) => {
    try {
      const response = await api.post<WorkflowDto>(
        `/api/workflows/${id}/archive`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao arquivar fluxo ${id}:`, error);
      throw error;
    }
  },

  restoreWorkflow: async (id: string) => {
    try {
      const response = await api.post<WorkflowDto>(
        `/api/workflows/${id}/restore`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao restaurar fluxo ${id}:`, error);
      throw error;
    }
  },

  // Estatísticas e informações
  getWorkflowTransitions: async (id: string) => {
    try {
      const response = await api.get<WorkflowTransitionDto[]>(
        `/api/workflows/${id}/transitions`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar transições do fluxo ${id}:`, error);
      throw error;
    }
  },

  getGeneralStats: async () => {
    try {
      const response = await api.get<WorkflowStatsDto>("/api/workflows/stats");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar estatísticas gerais:", error);
      throw error;
    }
  },

  getUserStats: async () => {
    try {
      const response = await api.get<WorkflowStatsDto>(
        "/api/workflows/stats/my"
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar estatísticas do usuário:", error);
      throw error;
    }
  },

  getUsersWorkload: async () => {
    try {
      const response = await api.get<UserWorkloadDto[]>(
        "/api/workflows/users-workload"
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar carga de trabalho dos usuários:", error);
      throw error;
    }
  },

  getAssignedWorkflows: async () => {
    try {
      const response = await api.get<WorkflowSummaryDto[]>(
        "/api/workflows/assigned-to-me"
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar fluxos atribuídos:", error);
      throw error;
    }
  },

  // Notificações
  getUnreadNotificationCount: async () => {
    try {
      const response = await api.get<number>(
        "/api/workflow-notifications/count-unread"
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar contagem de notificações:", error);
      return 0;
    }
  },

  markNotificationAsRead: async (id: string) => {
    try {
      await api.post(`/api/workflow-notifications/${id}/mark-read`);
    } catch (error) {
      console.error(`Erro ao marcar notificação ${id} como lida:`, error);
      throw error;
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      await api.post("/api/workflow-notifications/mark-all-read");
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
      throw error;
    }
  },

  getNotifications: async (page = 0, size = 10, unreadOnly = true) => {
    try {
      const response = await api.get<{
        content: WorkflowNotificationDto[];
        totalElements: number;
      }>(
        `/api/workflow-notifications?page=${page}&size=${size}${unreadOnly ? "&unreadOnly=true" : ""}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      return { content: [], totalElements: 0 };
    }
  },

  findOverdueWorkflows: async () => {
    try {
      const response = await api.get<WorkflowSummaryDto[]>(
        "/api/workflows/overdue"
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar fluxos atrasados:", error);
      return [];
    }
  },

  findWorkflowsNearDeadline: async (daysThreshold: number = 3) => {
    try {
      const response = await api.get<WorkflowSummaryDto[]>(
        `/api/workflows/near-deadline?daysThreshold=${daysThreshold}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar fluxos com prazo próximo:", error);
      return [];
    }
  },

  getWorkflowsByStatus: async (status: string, page = 0, size = 10) => {
    try {
      const response = await api.get<{
        content: WorkflowSummaryDto[];
        totalElements: number;
      }>(`/api/workflows/status/${status}?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar fluxos com status ${status}:`, error);
      throw error;
    }
  },

  getAllStatusTemplates: async (page = 0, size = 10) => {
    try {
      const response = await api.get<{
        content: WorkflowStatusTemplateDto[];
        totalElements: number;
      }>(`/api/workflow-status-templates?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar templates de status:", error);
      throw error;
    }
  },

  getStatusTemplateById: async (id: string) => {
    try {
      const response = await api.get<WorkflowStatusTemplateDto>(
        `/api/workflow-status-templates/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar template de status ${id}:`, error);
      throw error;
    }
  },

  createStatusTemplate: async (template: WorkflowStatusTemplateCreateDto) => {
    try {
      const response = await api.post<WorkflowStatusTemplateDto>(
        "/api/workflow-status-templates",
        template
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao criar template de status:", error);
      throw error;
    }
  },

  updateStatusTemplate: async (
    id: string,
    template: WorkflowStatusTemplateCreateDto
  ) => {
    try {
      const response = await api.put<WorkflowStatusTemplateDto>(
        `/api/workflow-status-templates/${id}`,
        template
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar template de status ${id}:`, error);
      throw error;
    }
  },

  deleteStatusTemplate: async (id: string) => {
    try {
      await api.delete(`/api/workflow-status-templates/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir template de status ${id}:`, error);
      throw error;
    }
  },

  getStatusItems: async (templateId: string) => {
    try {
      const response = await api.get<WorkflowStatusItemDto[]>(
        `/api/workflow-status-templates/${templateId}/items`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar status do template ${templateId}:`, error);
      throw error;
    }
  },

  getInitialStatus: async (templateId: string) => {
    try {
      const response = await api.get<WorkflowStatusItemDto>(
        `/api/workflow-status-templates/${templateId}/initial-status`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao buscar status inicial do template ${templateId}:`,
        error
      );
      throw error;
    }
  },

  // Atualizar o status customizado de um workflow
  updateWorkflowCustomStatus: async (
    workflowId: string,
    statusId: string,
    comments?: string
  ) => {
    try {
      const response = await api.post<WorkflowDto>(
        `/api/workflows/${workflowId}/custom-status?statusId=${statusId}${comments ? `&comments=${encodeURIComponent(comments)}` : ""}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao atualizar status customizado do fluxo ${workflowId}:`,
        error
      );
      throw error;
    }
  },

  // Filtrar workflows por status customizado
  getWorkflowsByCustomStatus: async (statusId: string, page = 0, size = 10) => {
    try {
      const response = await api.get<{
        content: WorkflowSummaryDto[];
        totalElements: number;
      }>(`/api/workflows/custom-status/${statusId}?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao buscar fluxos com status customizado ${statusId}:`,
        error
      );
      throw error;
    }
  },

  // Filtrar workflows por etapa
  getWorkflowsByStepNumber: async (stepNumber: number, page = 0, size = 10) => {
    try {
      const response = await api.get<{
        content: WorkflowSummaryDto[];
        totalElements: number;
      }>(`/api/workflows/step/${stepNumber}?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar fluxos na etapa ${stepNumber}:`, error);
      throw error;
    }
  },

  getStatsByTemplate: async (templateId: string) => {
    try {
      const response = await api.get<WorkflowStatsDto>(
        `/api/workflows/stats/template/${templateId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao buscar estatísticas por template ${templateId}:`,
        error
      );
      throw error;
    }
  },

  getStatsByStatusTemplate: async (statusTemplateId: string) => {
    try {
      const response = await api.get<WorkflowStatsDto>(
        `/api/workflows/stats/status-template/${statusTemplateId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao buscar estatísticas por template de status ${statusTemplateId}:`,
        error
      );
      throw error;
    }
  },

  getWorkflowsByTemplate: async (templateId: string, page = 0, size = 10) => {
    try {
      const response = await api.get<{
        content: WorkflowSummaryDto[];
        totalElements: number;
      }>(`/api/workflows/template/${templateId}?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar fluxos do template ${templateId}:`, error);
      throw error;
    }
  },

  getWorkflowsByTemplateAndStatus: async (
    templateId: string,
    status: string,
    page = 0,
    size = 10
  ) => {
    try {
      const response = await api.get<{
        content: WorkflowSummaryDto[];
        totalElements: number;
      }>(
        `/api/workflows/template/${templateId}/status/${status}?page=${page}&size=${size}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao buscar fluxos do template ${templateId} com status ${status}:`,
        error
      );
      throw error;
    }
  },

  getAssignedWorkflowsByTemplate: async (templateId: string) => {
    try {
      const response = await api.get<WorkflowSummaryDto[]>(
        `/api/workflows/assigned-to-me/template/${templateId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao buscar fluxos atribuídos do template ${templateId}:`,
        error
      );
      return [];
    }
  },

  searchWorkflows: async (
    searchTerm: string,
    page = 0,
    size = 10,
    status?: string,
    templateId?: string
  ) => {
    try {
      const params = new URLSearchParams({
        searchTerm,
        page: page.toString(),
        size: size.toString(),
      });

      if (status) {
        params.append("status", status);
      }

      if (templateId) {
        params.append("templateId", templateId);
      }

      const response = await api.get<{
        content: WorkflowSummaryDto[];
        totalElements: number;
      }>(`/api/workflows/search?${params.toString()}`);

      return response.data;
    } catch (error) {
      console.error("Erro ao pesquisar fluxos:", error);
      throw error;
    }
  },

  searchAssignedWorkflows: async (searchTerm: string, templateId?: string) => {
    try {
      const params = new URLSearchParams({
        searchTerm,
      });

      if (templateId) {
        params.append("templateId", templateId);
      }

      const response = await api.get<WorkflowSummaryDto[]>(
        `/api/workflows/search/assigned-to-me?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao pesquisar fluxos atribuídos:", error);
      throw error;
    }
  },

  getAllWorkflowsGroupedByStatus: async (page = 0, size = 10) => {
    try {
      const response = await api.get<{
        content: WorkflowSummaryDto[];
        totalElements: number;
      }>(`/api/workflows/grouped-by-status?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar fluxos agrupados por status:", error);
      throw error;
    }
  },

  getWorkflowsByTemplateGroupedByStatus: async (
    templateId: string,
    page = 0,
    size = 10
  ) => {
    try {
      const response = await api.get<{
        content: WorkflowSummaryDto[];
        totalElements: number;
      }>(
        `/api/workflows/template/${templateId}/grouped-by-status?page=${page}&size=${size}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erro ao buscar fluxos do template ${templateId} agrupados por status:`,
        error
      );
      throw error;
    }
  },

  searchWorkflowsGroupedByStatus: async (
    searchTerm: string,
    page = 0,
    size = 10,
    templateId?: string
  ) => {
    try {
      const params = new URLSearchParams({
        searchTerm,
        page: page.toString(),
        size: size.toString(),
      });

      if (templateId) {
        params.append("templateId", templateId);
      }

      const response = await api.get<{
        content: WorkflowSummaryDto[];
        totalElements: number;
      }>(`/api/workflows/search/grouped-by-status?${params.toString()}`);

      return response.data;
    } catch (error) {
      console.error("Erro ao pesquisar fluxos agrupados por status:", error);
      throw error;
    }
  },
};

export default workflowService;
