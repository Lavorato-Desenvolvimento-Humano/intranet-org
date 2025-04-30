// Em apps/frontend/src/components/admin/AdminPendingUsersTab.tsx

import React, { useState, useEffect } from "react";
import { User } from "@/services/auth";
import adminService from "@/services/admin";
import {
  Loader2,
  CheckCircle,
  XCircle,
  UserX,
  UserCheck,
  AlertTriangle,
  Search,
} from "lucide-react";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";

export default function AdminPendingUsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  // Carregar usuários
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const usersData = await adminService.getAllUsers();
        // Filtrar apenas usuários com email verificado mas não aprovados pelo admin
        const pendingUsers = usersData.filter(
          (user) => user.emailVerified && !user.adminApproved
        );
        setUsers(pendingUsers);
        setFilteredUsers(pendingUsers);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toastUtil.error("Erro ao carregar lista de usuários pendentes.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar usuários quando o termo de pesquisa mudar
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Aprovar usuário
  const handleApproveUser = async (userId: string) => {
    try {
      setProcessingUser(userId);
      await adminService.updateUserApproval(userId, true);

      // Atualizar a lista local
      setUsers((prev) => prev.filter((user) => user.id !== userId));

      toastUtil.success("Usuário aprovado com sucesso!");
    } catch (error: any) {
      toastUtil.error("Erro ao aprovar usuário. Tente novamente.");
    } finally {
      setProcessingUser(null);
    }
  };

  // Rejeitar usuário (desativar conta)
  const handleRejectUser = async (userId: string) => {
    try {
      setProcessingUser(userId);
      // Primeiro desativar a conta
      await adminService.updateUserStatus(userId, false);
      // Depois marcar como não aprovado
      await adminService.updateUserApproval(userId, false);

      // Atualizar a lista local
      setUsers((prev) => prev.filter((user) => user.id !== userId));

      toastUtil.success("Usuário rejeitado com sucesso!");
    } catch (error: any) {
      toastUtil.error("Erro ao rejeitar usuário. Tente novamente.");
    } finally {
      setProcessingUser(null);
    }
  };

  // Formatar a data de criação
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={36} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Barra de pesquisa */}
      <div className="mb-6 flex justify-between items-center">
        <div className="relative flex-grow max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar usuários pendentes..."
            className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-green-800 mb-2">
            Nenhum usuário pendente de aprovação!
          </h3>
          <p className="text-green-600">
            Todos os usuários verificados já foram aprovados no sistema.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800">
                  Usuários pendentes de aprovação
                </h3>
                <p className="text-yellow-700 text-sm">
                  Estes usuários já verificaram o email, mas aguardam aprovação
                  para acessar o sistema.
                </p>
              </div>
            </div>
          </div>

          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.fullName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleApproveUser(user.id)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Aprovar usuário"
                        disabled={processingUser === user.id}>
                        {processingUser === user.id ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <UserCheck size={20} />
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectUser(user.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Rejeitar usuário"
                        disabled={processingUser === user.id}>
                        <UserX size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
