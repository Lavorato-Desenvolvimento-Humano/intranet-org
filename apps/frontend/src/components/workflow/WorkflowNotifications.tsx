// src/components/workflow/WorkflowNotifications.tsx
import React from "react";
import { WorkflowNotificationDto } from "@/types/workflow";
import { Bell, CheckCircle, Calendar, RefreshCw } from "lucide-react";
import workflowService from "@/services/workflow";

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

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold">Notificações</h3>
        {notifications.length > 0 && !loading && (
          <button
            onClick={onMarkAllAsRead}
            className="text-sm text-primary hover:text-primary-dark">
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
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
                className={`p-4 hover:bg-gray-50 ${notification.read ? "opacity-75" : ""}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <a
                        href={`/workflows/${notification.workflowId}`}
                        className="text-xs text-primary hover:text-primary-dark">
                        Ver fluxo: {notification.workflowTitle}
                      </a>

                      {!notification.read && (
                        <button
                          onClick={() => onMarkAsRead(notification.id)}
                          className="text-xs text-gray-500 hover:text-primary">
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
