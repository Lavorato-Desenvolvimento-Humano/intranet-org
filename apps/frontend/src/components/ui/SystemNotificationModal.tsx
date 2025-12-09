"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, Info, AlertTriangle, CheckCircle } from "lucide-react";
import Button from "@/components/ui/custom-button";
import {
  getPendingNotifications,
  markNotificationAsRead,
  SystemNotification,
} from "@/services/notification";
import { useAuth } from "@/context/AuthContext";

export function SystemNotificationModal() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentNotification, setCurrentNotification] =
    useState<SystemNotification | null>(null);
  const [loading, setLoading] = useState(false);

  // Busca notificações ao carregar ou mudar de usuário
  useEffect(() => {
    if (user) {
      getPendingNotifications()
        .then((data) => {
          if (data && data.length > 0) {
            setNotifications(data);
            setCurrentNotification(data[0]);
            setIsOpen(true);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  const handleNext = async () => {
    if (!currentNotification) return;

    setLoading(true);
    try {
      // Marca como lida no backend
      await markNotificationAsRead(currentNotification.id);

      // Remove da lista local
      const remaining = notifications.slice(1);

      if (remaining.length > 0) {
        setNotifications(remaining);
        setCurrentNotification(remaining[0]);
      } else {
        setIsOpen(false);
        setNotifications([]);
        setCurrentNotification(null);
      }
    } catch (error) {
      console.error("Erro ao marcar notificação", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !currentNotification) return null;

  // Definição de cores e ícones baseados no tipo (similar ao seu ConfirmDialog)
  const typeStyles = {
    critical: {
      bg: "bg-red-500",
      text: "text-red-600",
      icon: <AlertCircle className="h-6 w-6 text-white" />,
    },
    warning: {
      bg: "bg-amber-500",
      text: "text-amber-600",
      icon: <AlertTriangle className="h-6 w-6 text-white" />,
    },
    info: {
      bg: "bg-blue-500",
      text: "text-blue-600",
      icon: <Info className="h-6 w-6 text-white" />,
    },
    success: {
      // Caso adicione no futuro
      bg: "bg-green-500",
      text: "text-green-600",
      icon: <CheckCircle className="h-6 w-6 text-white" />,
    },
  };

  const currentStyle =
    typeStyles[currentNotification.type as keyof typeof typeStyles] ||
    typeStyles.info;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div
          className={`p-4 rounded-t-lg flex items-center justify-between ${currentStyle.bg}`}>
          <div className="flex items-center gap-2">
            {currentStyle.icon}
            <h3 className="text-lg font-bold text-white">
              {currentNotification.title || "Aviso do Sistema"}
            </h3>
          </div>
          {/* Só mostra botão de fechar se NÃO for obrigatório */}
          {!currentNotification.mandatory && (
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-white/80 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {currentNotification.imageUrl && (
            <div className="mb-4">
              <img
                src={currentNotification.imageUrl}
                alt="Imagem do aviso"
                className="w-full h-auto max-h-64 object-contain rounded-md border border-gray-100"
              />
            </div>
          )}

          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {currentNotification.content}
          </div>

          {currentNotification.actionUrl && (
            <div className="mt-4 pt-2 border-t border-gray-100">
              <a
                href={currentNotification.actionUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium inline-flex items-center gap-1">
                Saiba mais
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-between items-center border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium">
            {notifications.length > 1
              ? `${notifications.length - 1} aviso(s) restante(s)`
              : ""}
          </span>

          <button
            onClick={handleNext}
            disabled={loading}
            className={`px-6 py-2 rounded-md font-medium text-white transition-all shadow-sm
                ${loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-md hover:brightness-110"}
                ${currentStyle.bg}
              `}>
            {loading
              ? "Processando..."
              : notifications.length > 1
                ? "Próximo"
                : "Entendido"}
          </button>
        </div>
      </div>
    </div>
  );
}
