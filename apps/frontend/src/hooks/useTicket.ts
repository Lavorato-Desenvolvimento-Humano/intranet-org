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

  // --- WEBSOCKET CONNECTION ---
  useEffect(() => {
    if (typeof window === "undefined" || !ticketId) return;

    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    const host = window.location.host; // Inclui domínio e porta (ex: dev.lavorato.app.br ou localhost:3000)

    let socketUrl = `${protocol}//${host}/ws`;

    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      socketUrl = "http://localhost:8080/ws";
    }

    console.log(`[WebSocket] Tentando conectar em: ${socketUrl}`);

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),

      reconnectDelay: 5000,

      onConnect: () => {
        console.log("[WebSocket] Conectado com sucesso!");

        client.subscribe(`/topic/tickets/${ticketId}`, (message) => {
          if (message.body) {
            try {
              const newInteraction: TicketInteraction = JSON.parse(
                message.body
              );

              setInteractions((prev) => {
                if (prev.some((i) => i.id === newInteraction.id)) return prev;
                return [...prev, newInteraction];
              });

              if (newInteraction.type === "SYSTEM_LOG") {
                ticketService.getById(ticketId).then(setTicket);
              }
            } catch (e) {
              console.error(
                "[WebSocket] Erro ao processar mensagem recebida:",
                e
              );
            }
          }
        });
      },

      onStompError: (frame) => {
        console.error(
          "[WebSocket] Erro no Broker: " + frame.headers["message"]
        );
        console.error("[WebSocket] Detalhes: " + frame.body);
      },

      onWebSocketClose: () => {
        console.log("[WebSocket] Conexão fechada.");
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client.active) {
        console.log("[WebSocket] Desconectando...");
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
