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

  getNotifications: async (page = 0, size = 10) => {
    try {
      const response = await api.get<{
        content: WorkflowNotificationDto[];
        totalElements: number;
      }>(`/api/workflow-notifications?page=${page}&size=${size}`);
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
};

export default workflowService;
