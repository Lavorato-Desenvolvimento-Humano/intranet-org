"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { SystemNotification } from "@/types/notification";
import { SystemModalWrapper } from "./SystemModalWrapper";
import { NewsContent } from "./modals/NewsContent";
import { AnnouncementContent } from "./modals/AnnouncementContent";
// Importar ChangelogContent quando criar

export function SystemNotificationManager() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<SystemNotification[]>([]);
  const [current, setCurrent] = useState<SystemNotification | null>(null);

  // 1. Buscar notificações pendentes ao logar
  useEffect(() => {
    if (user?.id) {
      api
        .get<SystemNotification[]>("/api/notifications/pending")
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setQueue(res.data);
          }
        })
        .catch((err) => console.error("Falha ao buscar notificações:", err));
    }
  }, [user]);

  // 2. Processar fila
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
    }
  }, [queue, current]);

  const handleDismiss = async () => {
    if (!current) return;

    try {
      // Marca como lido no backend
      await api.post(`/api/notifications/${current.id}/read`);

      // Remove da fila local e avança
      setQueue((prev) => prev.slice(1));
      setCurrent(null);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida", error);
    }
  };

  if (!current) return null;

  // 3. Renderizar o conteúdo correto
  let content = null;
  switch (current.type) {
    case "NEWS":
      content = <NewsContent data={current} onDismiss={handleDismiss} />;
      break;
    case "SYSTEM_ANNOUNCEMENT":
      content = (
        <AnnouncementContent data={current} onDismiss={handleDismiss} />
      );
      break;
    case "CHANGELOG":
      // content = <ChangelogContent data={current} onDismiss={handleDismiss} />;
      // Fallback temporário para NewsContent se Changelog não estiver pronto
      content = <NewsContent data={current} onDismiss={handleDismiss} />;
      break;
    default:
      return null;
  }

  return (
    <SystemModalWrapper onClose={handleDismiss} mandatory={current.mandatory}>
      {content}
    </SystemModalWrapper>
  );
}
