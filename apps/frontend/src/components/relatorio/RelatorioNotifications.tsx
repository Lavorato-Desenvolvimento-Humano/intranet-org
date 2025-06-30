import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Download,
  Eye,
  X,
  FileBarChart,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";
import relatorioService from "@/services/relatorio";
import { RelatorioSummaryDto, StatusRelatorioEnum } from "@/types/relatorio";
import { formatDateTime } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

interface NotificationItem {
  id: string;
  type: "completed" | "error" | "shared";
  relatorio: RelatorioSummaryDto;
  timestamp: string;
  read: boolean;
}

interface RelatorioNotificationsProps {
  className?: string;
}

export const RelatorioNotifications: React.FC<RelatorioNotificationsProps> = ({
  className = "",
}) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Buscar notificações quando componente montar
  useEffect(() => {
    loadNotifications();

    // Polling para novas notificações a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const relatoriosData = await relatorioService.getMeusRelatorios(0, 10);

      const compartilhamentosData =
        await relatorioService.getCompartilhamentosRecebidos(0, 5);

      const newNotifications: NotificationItem[] = [];

      // Adicionar notificações de relatórios concluídos/com erro nas últimas 24h
      const agora = new Date();
      const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

      relatoriosData.content.forEach((relatorio) => {
        const dataAtualizacao = new Date(
          relatorio.updatedAt || relatorio.createdAt
        );

        if (dataAtualizacao > umDiaAtras) {
          if (relatorio.statusRelatorio === StatusRelatorioEnum.CONCLUIDO) {
            newNotifications.push({
              id: `completed-${relatorio.id}`,
              type: "completed",
              relatorio,
              timestamp: relatorio.updatedAt || relatorio.createdAt,
              read: false,
            });
          } else if (relatorio.statusRelatorio === StatusRelatorioEnum.ERRO) {
            newNotifications.push({
              id: `error-${relatorio.id}`,
              type: "error",
              relatorio,
              timestamp: relatorio.updatedAt || relatorio.createdAt,
              read: false,
            });
          }
        }
      });

      // Adicionar notificações de compartilhamentos não visualizados
      compartilhamentosData.content
        .filter((comp) => !comp.visualizado)
        .forEach((compartilhamento) => {
          // Criar um objeto RelatorioSummaryDto a partir do compartilhamento
          const relatorioSummary: RelatorioSummaryDto = {
            id: compartilhamento.relatorioId,
            titulo: compartilhamento.relatorioTitulo,
            usuarioGeradorNome: compartilhamento.usuarioOrigemNome,
            periodoInicio: "", // Não disponível no compartilhamento
            periodoFim: "", // Não disponível no compartilhamento
            totalRegistros: 0, // Não disponível no compartilhamento
            statusRelatorio: StatusRelatorioEnum.CONCLUIDO, // Assumir concluído se foi compartilhado
            createdAt: compartilhamento.dataCompartilhamento,
            possuiCompartilhamento: true,
            updatedAt: "",
          };

          newNotifications.push({
            id: `shared-${compartilhamento.id}`,
            type: "shared",
            relatorio: relatorioSummary,
            timestamp: compartilhamento.dataCompartilhamento,
            read: false,
          });
        });

      // Ordenar por timestamp (mais recente primeiro)
      newNotifications.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setNotifications(newNotifications);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id);

    if (notification.type === "shared") {
      // Para compartilhamentos, marcar como visualizado no backend
      const compartilhamentoId = notification.id.replace("shared-", "");
      relatorioService
        .marcarCompartilhamentoComoVisualizado(compartilhamentoId)
        .catch((err) =>
          console.error(
            "Erro ao marcar compartilhamento como visualizado:",
            err
          )
        );
    }

    router.push(`/relatorios/${notification.relatorio.id}`);
    setIsOpen(false);
  };

  const handleDownload = async (
    notification: NotificationItem,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      const blob = await relatorioService.baixarRelatorioPDF(
        notification.relatorio.id
      );
      const filename = `relatorio-${notification.relatorio.titulo.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
      relatorioService.downloadFile(blob, filename);
      toastUtil.success("Download iniciado!");
    } catch (error) {
      toastUtil.error("Erro ao baixar relatório");
    }
  };

  const removeNotification = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "shared":
        return <FileBarChart className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationMessage = (notification: NotificationItem) => {
    switch (notification.type) {
      case "completed":
        return `Relatório "${notification.relatorio.titulo}" foi concluído com sucesso`;
      case "error":
        return `Erro ao processar relatório "${notification.relatorio.titulo}"`;
      case "shared":
        return `Novo relatório compartilhado: "${notification.relatorio.titulo}"`;
      default:
        return `Atualização no relatório "${notification.relatorio.titulo}"`;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botão de notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full">
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificações
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} nova{unreadCount !== 1 ? "s" : ""} notificação
                {unreadCount !== 1 ? "ões" : ""}
              </p>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Carregando...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${!notification.read ? "font-medium text-gray-900" : "text-gray-700"}`}>
                          {getNotificationMessage(notification)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDateTime(notification.timestamp)}
                        </p>

                        {notification.type === "shared" && (
                          <p className="text-xs text-blue-600 mt-1">
                            Compartilhado por{" "}
                            {notification.relatorio.usuarioGeradorNome}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex items-center space-x-1">
                        {notification.type === "completed" && (
                          <button
                            onClick={(e) => handleDownload(notification, e)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Baixar PDF">
                            <Download className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={(e) =>
                            removeNotification(notification.id, e)
                          }
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Remover notificação">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {!notification.read && (
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma notificação</p>
                <p className="text-sm text-gray-500 mt-1">
                  Você será notificado quando relatórios forem concluídos ou
                  compartilhados
                </p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <CustomButton
                variant="primary"
                size="small"
                onClick={() => {
                  router.push("/relatorios");
                  setIsOpen(false);
                }}
                className="w-full">
                <FileBarChart className="h-4 w-4 mr-2" />
                Ver Todos os Relatórios
              </CustomButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
