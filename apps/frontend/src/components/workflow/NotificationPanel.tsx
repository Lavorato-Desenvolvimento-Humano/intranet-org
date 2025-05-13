// src/components/workflow/NotificationPanel.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { WorkflowNotificationDto } from "@/types/workflow";
import WorkflowNotifications from "@/components/workflow/WorkflowNotifications";
import workflowService from "@/services/workflow";
import toastUtil from "@/utils/toast";

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<WorkflowNotificationDto[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await workflowService.getNotifications(0, 20);
      setNotifications(response.content || []);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      toastUtil.error("Não foi possível carregar as notificações");
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
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
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

      // Remover a notificação da lista
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));

      // Recalcular contagem
      fetchUnreadCount();

      // Adicionar feedback visual
      toastUtil.success("Notificação marcada como lida");
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      toastUtil.error("Erro ao marcar notificação como lida");
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
      toastUtil.success("Todas as notificações foram marcadas como lidas");
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
      toastUtil.error("Erro ao marcar todas as notificações como lidas");
    }
  };

  // Adicionando verificação para determinar o lado de abertura do dropdown
  const getDropdownPosition = () => {
    if (!buttonRef.current) return { right: 0 };

    const buttonRect = buttonRef.current.getBoundingClientRect();
    // Se estiver muito à esquerda na tela, abrir para a direita
    if (buttonRect.left < 200) {
      return { left: 0 };
    }
    // Caso contrário, abrir para a esquerda
    return { right: 0 };
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        ref={buttonRef}
        onClick={handleTogglePanel}
        className="relative p-2 text-white hover:text-gray-200 rounded-full hover:bg-[#259AAC]"
        aria-label="Notificações">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute mt-2 w-96 z-50 notification-dropdown"
          style={getDropdownPosition()}>
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
