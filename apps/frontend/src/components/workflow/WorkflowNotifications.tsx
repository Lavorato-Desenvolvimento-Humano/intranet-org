// src/components/workflow/WorkflowNotifications.tsx
import React from "react";
import { WorkflowNotificationDto } from "@/types/workflow";
import { Bell, CheckCircle, Calendar, RefreshCw, X } from "lucide-react";

interface WorkflowNotificationsProps {
  notifications: WorkflowNotificationDto[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  loading?: boolean;
}

const WorkflowNotifications: React.FC<WorkflowNotificationsProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  loading = false,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <RefreshCw size={16} className="text-blue-500" />;
      case "deadline":
        return <Calendar size={16} className="text-orange-500" />;
      case "status_change":
        return <CheckCircle size={16} className="text-green-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  // Truncar texto longo para evitar que estoure a largura
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-white rounded-lg shadow-md max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center p-3 border-b sticky top-0 bg-white z-10">
        <h3 className="text-lg font-semibold">Notificações</h3>
        <div className="flex items-center">
          {notifications.length > 0 && !loading && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-primary hover:text-primary-dark mr-2">
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            Carregando notificações...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nenhuma notificação disponível
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 hover:bg-gray-50 ${notification.read ? "opacity-75" : ""}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {truncateText(notification.title, 40)}
                      </p>
                      <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 break-words">
                      {truncateText(notification.message, 100)}
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <a
                        href={`/workflows/${notification.workflowId}`}
                        className="text-xs text-primary hover:text-primary-dark truncate max-w-[160px]">
                        Ver fluxo:{" "}
                        {truncateText(notification.workflowTitle, 30)}
                      </a>

                      {!notification.read && (
                        <button
                          onClick={() => onMarkAsRead(notification.id)}
                          className="text-xs text-gray-500 hover:text-primary whitespace-nowrap">
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowNotifications;
