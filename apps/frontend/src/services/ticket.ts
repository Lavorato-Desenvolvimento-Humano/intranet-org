// src/services/ticket.ts
import toast from "react-hot-toast";
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
    content: string,
    file?: File | null
  ): Promise<TicketInteraction> => {
    const formData = new FormData();

    // O backend espera o JSON dentro de uma parte chamada "data"
    const jsonBlob = new Blob([JSON.stringify({ content })], {
      type: "application/json",
    });
    formData.append("data", jsonBlob);

    if (file) {
      formData.append("file", file);
    }

    const response = await api.post<TicketInteraction>(
      `/tickets/${ticketId}/interactions/comments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // ...

  // --- DASHBOARD E HELPERS ---

  getDashboardStats: async (teamId?: string): Promise<DashboardStatsDto> => {
    const params: any = {};
    if (teamId) params.teamId = teamId;

    const response = await api.get<DashboardStatsDto>(
      "/tickets/dashboard-stats",
      { params }
    );
    return response.data;
  },

  downloadAttachment: async (path: string, filename: string) => {
    try {
      const response = await api.get("/files/download", {
        params: { path },
        responseType: "blob", // Importante para arquivos binários
      });

      // Cria um link temporário para iniciar o download no browser
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Limpeza
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      toast.error("Erro ao baixar anexo");
      throw error;
    }
  },
};
