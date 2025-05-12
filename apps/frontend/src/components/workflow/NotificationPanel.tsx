// src/components/workflow/NotificationPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { WorkflowNotificationDto } from "@/types/workflow";
import WorkflowNotifications from "@/components/workflow/WorkflowNotifications";
import workflowService from "@/services/workflow";

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<WorkflowNotificationDto[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const response = await workflowService.getNotifications(0, 20);
      setNotifications(response.content || []);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await workflowService.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Erro ao buscar contagem de notificações:", error);
    }
  };

  useEffect(() => {
    // Carregar dados iniciais
    fetchUnreadCount();

    // Verificar novas notificações a cada minuto
    const interval = setInterval(fetchUnreadCount, 60000);

    // Adicionar event listener para fechar o painel ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Carregar notificações quando o painel for aberto
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleTogglePanel = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await workflowService.markNotificationAsRead(id);

      // Atualizar estado localmente
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );

      // Recalcular contagem
      fetchUnreadCount();
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await workflowService.markAllNotificationsAsRead();

      // Atualizar estado localmente
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );

      // Recalcular contagem
      setUnreadCount(0);
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleTogglePanel}
        className="relative p-2 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100"
        aria-label="Notificações">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 z-50">
          <WorkflowNotifications
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
