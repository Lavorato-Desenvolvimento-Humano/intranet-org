import { useState, useCallback, useEffect, useRef } from "react";
import { ticketService } from "@/services/ticket";
import { Ticket, TicketInteraction } from "@/types/ticket";
import toast from "@/utils/toast";
import { useRouter } from "next/navigation";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export const useTicket = (ticketId: number) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [interactions, setInteractions] = useState<TicketInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Ref para o cliente STOMP
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
    if (!ticketId) return;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    const socketUrl = `${baseUrl}/ws`;

    const client = new Client({
      // Usamos a factory do SockJS para compatibilidade
      webSocketFactory: () => new SockJS(socketUrl),

      // Headers opcionais de conexão (ex: token JWT)
      connectHeaders: {
        // 'Authorization': `Bearer ${token}`
      },

      onConnect: () => {
        console.log("WebSocket Conectado! ");

        // Inscreve-se no tópico específico do ticket
        client.subscribe(`/topic/tickets/${ticketId}`, (message) => {
          if (message.body) {
            const newInteraction: TicketInteraction = JSON.parse(message.body);

            // Adiciona a nova interação na lista imediatamente
            setInteractions((prev) => {
              // Evita duplicatas se o ID já existir (caso o envio HTTP retorne antes do WS)
              if (prev.some((i) => i.id === newInteraction.id)) return prev;
              return [...prev, newInteraction];
            });

            if (newInteraction.type === "SYSTEM_LOG") {
              ticketService.getById(ticketId).then(setTicket);
            }
          }
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
      },
    });

    client.activate();
    stompClientRef.current = client;

    // Cleanup ao desmontar o componente
    return () => {
      client.deactivate();
    };
  }, [ticketId]);

  // Ações
  const addComment = async (content: string, file?: File | null) => {
    try {
      // Fazemos a requisição HTTP POST normal
      // O backend salvará e emitirá o evento WebSocket
      await ticketService.addComment(ticketId, content, file);

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
      // O log de sistema virá pelo WebSocket
    } catch (error) {
      toast.error("Erro ao assumir chamado");
    }
  };

  const resolveTicket = async () => {
    try {
      await ticketService.resolve(ticketId);
      toast.success("Chamado resolvido!");
      // Atualiza dados do ticket (cabeçalho)
      const updatedTicket = await ticketService.getById(ticketId);
      setTicket(updatedTicket);
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
