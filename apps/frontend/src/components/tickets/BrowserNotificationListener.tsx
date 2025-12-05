"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export default function BrowserNotificationListener() {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/i_phone__toquecelular.com_.mp3");

    // 2. Solicitar permissão do navegador ao carregar
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // 3. Configurar conexão WebSocket
    const socket = new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws`);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        // 4. Inscrever no tópico pessoal do usuário definido no backend
        stompClient.subscribe(
          `/topic/user/${user.id}/notifications`,
          (message) => {
            const notification = JSON.parse(message.body);
            handleNewNotification(notification);
          }
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
    // A. Tocar Som
    if (audioRef.current) {
      audioRef.current
        .play()
        .catch((e) => console.error("Erro ao tocar som:", e));
    }

    // B. Mostrar Notificação do Navegador (System Notification)
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(data.title, {
        body: data.message,
        icon: "/icon.png", // Ícone da sua aplicação
        tag: `ticket-${data.ticketId}`, // Evita spam de notificações duplicadas
      });

      notification.onclick = () => {
        window.focus();
        // Redirecionar para o ticket, se necessário
        window.location.href = `/tickets/${data.ticketId}`;
      };
    }
  };

  return null;
}
