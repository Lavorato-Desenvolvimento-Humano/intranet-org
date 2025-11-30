import { useState, useEffect, useCallback } from "react";
import { ticketService } from "@/services/ticket";
import { Ticket, TicketStatus, TicketPriority } from "@/types/ticket";
import toast from "@/utils/toast";

export type TicketViewType = "my_assignments" | "team_queue" | "created_by_me";

export const useTickets = (initialView: TicketViewType = "my_assignments") => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<TicketViewType>(initialView);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data: Ticket[] = [];

      // O Service já trata o retorno da API, entregando sempre um array de Ticket[]
      // Não precisamos verificar .content aqui novamente
      switch (viewType) {
        case "my_assignments":
          data = await ticketService.getAll({
            assigneeId: "me",
            status: "OPEN,IN_PROGRESS",
          });
          break;
        case "team_queue":
          // Busca tickets sem dono da minha equipe
          data = await ticketService.getAll({
            assigneeId: "null",
            status: "OPEN",
          });
          break;
        case "created_by_me":
          data = await ticketService.getAll({
            requesterId: "me",
          });
          break;
      }

      setTickets(data);
    } catch (err) {
      console.error("Erro ao carregar tickets:", err);
      setError("Não foi possível carregar a lista de chamados.");
      toast.error("Erro ao carregar tickets");
    } finally {
      setLoading(false);
    }
  }, [viewType]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // --- Helpers de UI (Cores e Textos) ---

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.CRITICAL:
        return "bg-red-100 text-red-800 border-red-200";
      case TicketPriority.HIGH:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case TicketPriority.MEDIUM:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case TicketPriority.LOW:
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityLabel = (priority: TicketPriority) => {
    const map = {
      [TicketPriority.LOW]: "Baixa",
      [TicketPriority.MEDIUM]: "Média",
      [TicketPriority.HIGH]: "Alta",
      [TicketPriority.CRITICAL]: "Crítica",
    };
    return map[priority] || priority;
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return "bg-blue-100 text-blue-800";
      case TicketStatus.IN_PROGRESS:
        return "bg-purple-100 text-purple-800";
      case TicketStatus.WAITING:
        return "bg-yellow-100 text-yellow-800";
      case TicketStatus.RESOLVED:
        return "bg-green-100 text-green-800";
      case TicketStatus.CLOSED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: TicketStatus) => {
    const map = {
      [TicketStatus.OPEN]: "Aberto",
      [TicketStatus.IN_PROGRESS]: "Em Andamento",
      [TicketStatus.WAITING]: "Aguardando",
      [TicketStatus.RESOLVED]: "Resolvido",
      [TicketStatus.CLOSED]: "Fechado",
    };
    return map[status] || status;
  };

  return {
    tickets,
    loading,
    error,
    viewType,
    setViewType,
    refreshTickets: loadTickets,
    getPriorityColor,
    getPriorityLabel,
    getStatusColor,
    getStatusLabel,
  };
};
