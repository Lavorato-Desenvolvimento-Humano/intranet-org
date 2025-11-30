// src/hooks/useTicket.ts
import { useState, useCallback, useEffect, useRef } from "react";
import { ticketService } from "@/services/ticket";
import { Ticket, TicketInteraction } from "@/types/ticket";
import toast from "@/utils/toast";
import { useRouter } from "next/navigation";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "@/context/AuthContext";

export const useTicket = (ticketId: number) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [interactions, setInteractions] = useState<TicketInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  const stompClientRef = useRef<Client | null>(null);

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
      router.push("/tickets");
    } finally {
      setLoading(false);
    }
  }, [ticketId, router]);

  // Efeito de Carga Inicial
  useEffect(() => {
    if (ticketId) loadData();
  }, [loadData, ticketId]);

  useEffect(() => {
    if (!ticketId) return;

    let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:"
    ) {
      baseUrl = baseUrl.replace("http:", "https:");
    }

    const socketUrl = `${baseUrl}/ws`;

    console.log(`[WebSocket] Conectando em: ${socketUrl}`);

    const client = new Client({
      // A factory do SockJS lidará com a troca de http/https para ws/wss internamente
      webSocketFactory: () => new SockJS(socketUrl),

      // Reconectar automaticamente em caso de queda
      reconnectDelay: 5000,

      onConnect: () => {
        console.log("[WebSocket] Conectado!");

        // Inscreve-se no tópico específico do ticket
        client.subscribe(`/topic/tickets/${ticketId}`, (message) => {
          if (message.body) {
            try {
              const newInteraction: TicketInteraction = JSON.parse(
                message.body
              );

              // Atualiza a lista de interações em tempo real
              setInteractions((prev) => {
                // Evita duplicidade (caso o POST HTTP já tenha adicionado)
                if (prev.some((i) => i.id === newInteraction.id)) return prev;
                return [...prev, newInteraction];
              });

              // Se for log de sistema (mudança de status), atualiza o cabeçalho do ticket
              if (newInteraction.type === "SYSTEM_LOG") {
                ticketService.getById(ticketId).then(setTicket);
              }
            } catch (e) {
              console.error("Erro ao processar mensagem do WebSocket", e);
            }
          }
        });
      },
      onStompError: (frame) => {
        console.error(
          "[WebSocket] Erro no Broker: " + frame.headers["message"]
        );
      },
    });

    client.activate();
    stompClientRef.current = client;

    // Cleanup ao sair da página
    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [ticketId]);

  // Ações
  const addComment = async (content: string, file?: File | null) => {
    try {
      await ticketService.addComment(ticketId, content, file);

      return true;
    } catch (error) {
      toast.error("Erro ao enviar comentário");
      return false;
    }
  };

  const claimTicket = async () => {
    try {
      await ticketService.claim(ticketId);
      toast.success("Você assumiu este chamado!");
      // Atualização virá pelo WebSocket (System Log)
    } catch (error) {
      toast.error("Erro ao assumir chamado");
    }
  };

  const resolveTicket = async () => {
    try {
      await ticketService.resolve(ticketId);
      toast.success("Chamado resolvido!");
      // Atualização virá pelo WebSocket
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
