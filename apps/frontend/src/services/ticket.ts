// src/services/ticket.ts
import api from "./api";
import {
  Ticket,
  TicketCreateData,
  TicketInteraction,
  DashboardStatsDto,
} from "@/types/ticket";

export const ticketService = {
  // --- CORE: CRUD e Listagem ---

  // Cria um ticket com suporte a Upload de Arquivo
  create: async (data: TicketCreateData): Promise<Ticket> => {
    const formData = new FormData();

    // Serializa o DTO JSON em uma parte 'data' para o @RequestPart do Java
    const ticketJson = JSON.stringify({
      title: data.title,
      description: data.description,
      priority: data.priority,
      targetTeamId: data.targetTeamId,
    });

    formData.append(
      "data",
      new Blob([ticketJson], { type: "application/json" })
    );

    if (data.file) {
      formData.append("file", data.file);
    }

    const response = await api.post<Ticket>("/tickets", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getAll: async (params?: any): Promise<Ticket[]> => {
    // Se o backend usar paginação padrão Spring (Page<T>), use response.data.content
    // Aqui assumo retorno direto de lista ou array filtrado
    const response = await api.get("/tickets", { params });
    return response.data.content || response.data;
  },

  getById: async (id: number): Promise<Ticket> => {
    const response = await api.get<Ticket>(`/tickets/${id}`);
    return response.data;
  },

  // --- AÇÕES DO FLUXO (WORKFLOW) ---

  // Técnico "puxa" o chamado para si
  claim: async (id: number): Promise<Ticket> => {
    const response = await api.post<Ticket>(`/tickets/${id}/claim`);
    return response.data;
  },

  // Técnico resolve o chamado
  resolve: async (id: number): Promise<Ticket> => {
    // Endpoint PATCH que criamos
    const response = await api.patch<Ticket>(`/tickets/${id}/resolve`);
    return response.data;
  },

  // Usuário avalia (CSAT) e fecha definitivamente
  rate: async (
    id: number,
    rating: number,
    comment?: string
  ): Promise<Ticket> => {
    const response = await api.patch<Ticket>(`/tickets/${id}/rate`, {
      rating,
      comment,
    });
    return response.data;
  },

  // --- INTERAÇÕES (CHAT/TIMELINE) ---

  getTimeline: async (ticketId: number): Promise<TicketInteraction[]> => {
    const response = await api.get<TicketInteraction[]>(
      `/tickets/${ticketId}/interactions`
    );
    return response.data;
  },

  addComment: async (
    ticketId: number,
    content: string
  ): Promise<TicketInteraction> => {
    const response = await api.post<TicketInteraction>(
      `/tickets/${ticketId}/interactions/comments`,
      {
        content,
      }
    );
    return response.data;
  },

  // --- DASHBOARD E HELPERS ---

  getDashboardStats: async (): Promise<DashboardStatsDto> => {
    const response = await api.get<DashboardStatsDto>(
      "/tickets/dashboard-stats"
    );
    return response.data;
  },

  downloadAttachment: async (path: string, filename: string) => {
    try {
      const response = await api.get("/files/download", {
        params: { path },
        responseType: "blob", // Importante: diz ao axios que é um arquivo binário
      });

      // Cria um link temporário no navegador para forçar o download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename); // Nome que aparecerá para o usuário
      document.body.appendChild(link);
      link.click();

      // Limpeza
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      throw error;
    }
  },
};
