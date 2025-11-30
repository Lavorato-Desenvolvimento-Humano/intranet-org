// src/hooks/useTicket.ts
import { useState, useCallback, useEffect } from "react";
import { ticketService } from "@/services/ticket";
import { Ticket, TicketInteraction } from "@/types/ticket";
import toast from "@/utils/toast";
import { useRouter } from "next/navigation";

export const useTicket = (ticketId: number) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [interactions, setInteractions] = useState<TicketInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ticketData, timelineData] = await Promise.all([
        ticketService.getById(ticketId),
        ticketService.getTimeline(ticketId),
      ]);
      setTicket(ticketData);
      setInteractions(timelineData);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar detalhes do chamado");
      router.push("/tickets"); // Volta se não achar
    } finally {
      setLoading(false);
    }
  }, [ticketId, router]);

  useEffect(() => {
    if (ticketId) loadData();
  }, [loadData, ticketId]);

  // Ações
  const addComment = async (content: string) => {
    try {
      const newInteraction = await ticketService.addComment(ticketId, content);
      setInteractions((prev) => [...prev, newInteraction]);
      return true;
    } catch (error) {
      toast.error("Erro ao enviar comentário");
      return false;
    }
  };

  const claimTicket = async () => {
    try {
      const updatedTicket = await ticketService.claim(ticketId);
      setTicket(updatedTicket);
      toast.success("Você assumiu este chamado!");
      // Recarrega timeline para mostrar o log de sistema gerado
      const timeline = await ticketService.getTimeline(ticketId);
      setInteractions(timeline);
    } catch (error) {
      toast.error("Erro ao assumir chamado");
    }
  };

  const resolveTicket = async () => {
    try {
      await ticketService.resolve(ticketId);
      toast.success("Chamado resolvido!");
      loadData();
    } catch (error) {
      toast.error("Erro ao resolver chamado");
    }
  };

  return {
    ticket,
    interactions,
    loading,
    addComment,
    claimTicket,
    resolveTicket,
    refresh: loadData,
  };
};
