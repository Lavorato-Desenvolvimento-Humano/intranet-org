import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Button from "@/components/ui/custom-button";
import {
  SystemNotification,
  getAllNotifications,
} from "@/services/notification";
import toast from "@/utils/toast";
import { formatDate } from "@/utils/dateUtils";

export default function AdminAvisosTab() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await getAllNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Erro ao buscar avisos:", error);
      toast.error("Erro ao carregar avisos.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "critical":
        return (
          <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-medium">
            Crítico
          </span>
        );
      case "warning":
        return (
          <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs font-medium">
            Atenção
          </span>
        );
      default:
        return (
          <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs font-medium">
            Informação
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Gerenciar Notificações
          </h3>
          <p className="text-sm text-gray-500">
            Visualize o histórico e status dos avisos do sistema.
          </p>
        </div>
        <Link href="/admin/avisos/novo">
          <Button variant="primary" size="small">
            <Plus className="mr-2 h-4 w-4" /> Novo Aviso
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Carregando avisos...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
            <Info className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nenhum aviso cadastrado</p>
            <Link href="/admin/avisos/novo" className="mt-4">
              <Button variant="primary" size="small">
                Criar Primeiro Aviso
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-medium border-b">
                <tr>
                  <th className="px-6 py-3 w-12">Tipo</th>
                  <th className="px-6 py-3">Título</th>
                  <th className="px-6 py-3">Público</th>
                  <th className="px-6 py-3 text-center">Obrigatório</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <tr
                    key={notification.id}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(notification.type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {notification.title}
                      <div className="mt-1">
                        {getTypeLabel(notification.type)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {notification.targetRoles ? (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                          {notification.targetRoles}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Todos</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {notification.mandatory ? (
                        <span className="text-red-600 font-bold text-xs">
                          SIM
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">NÃO</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {notification.active ? (
                        <div className="flex items-center justify-center text-green-600 gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-gray-400 gap-1">
                          <XCircle className="h-4 w-4" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {notification.createdAt
                        ? formatDate(notification.createdAt)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
