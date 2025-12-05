"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function BrowserNotificationListener() {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Inicializa o áudio, mas não tenta tocar automaticamente sem interação
    audioRef.current = new Audio("/sounds/i_phone__toquecelular.com_.mp3");

    // Se já tiver permissão (você já concedeu), ótimo.
    // Se não, deixamos quieto para não bloquear o navegador com prompts automáticos.
    if ("Notification" in window && Notification.permission === "default") {
      // Opcional: Você pode tentar pedir aqui, mas o ideal é via botão como conversamos.
      // Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;

    // --- Lógica robusta de URL (igual ao useTicket) ---
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    const host = window.location.host;
    let socketUrl = `${protocol}//${host}/ws`;

    // Ajuste específico para desenvolvimento local (se o backend roda na 8080)
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      socketUrl = "http://localhost:8080/ws";
    }

    console.log(`[NotificationListener] Conectando em: ${socketUrl}`);

    const socket = new SockJS(socketUrl);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(`[NotificationListener Debug] ${str}`),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("[NotificationListener] Conectado e ouvindo notificações.");

        stompClient.subscribe(
          `/topic/user/${user.id}/notifications`,
          (message) => {
            if (message.body) {
              const notification = JSON.parse(message.body);
              handleNewNotification(notification);
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error(
          "[NotificationListener] Erro no Broker: " + frame.headers["message"]
        );
      },
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [user]);

  const handleNewNotification = (data: {
    title: string;
    message: string;
    ticketId: number;
  }) => {
    console.log("Recebendo notificação:", data);

    // A. Tocar Som
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Auto-play policy pode bloquear se o usuário não interagiu com a página ainda
          console.log("Autoplay de áudio bloqueado:", error);
        });
      }
    }

    // B. Mostrar Notificação do Navegador
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(data.title, {
        body: data.message,
        icon: "/icon.png",
        tag: `ticket-${data.ticketId}`,
      });

      notification.onclick = () => {
        window.focus();
        // Ajuste o caminho conforme sua rota real
        window.location.href = `/tickets/${data.ticketId}`;
      };
    }
  };

  return null;
}
