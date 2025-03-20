// components/admin/AdminUsersTab.tsx
import React, { useState, useEffect } from "react";
import { User } from "@/services/auth";
import adminService from "@/services/admin";
import roleService from "@/services/role";
import { Role } from "@/services/role";
import {
  Loader2,
  Search,
  UserPlus,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";

export default function AdminUsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isManagingRoles, setIsManagingRoles] = useState(false);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  // Carregar usuários e roles
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersData, rolesData] = await Promise.all([
          adminService.getAllUsers(),
          roleService.getAllRoles(),
        ]);
        setUsers(usersData);
        setRoles(rolesData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toastUtil.error("Erro ao carregar lista de usuários ou cargos.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar usuários com base no termo de pesquisa
  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal de gerenciamento de roles
  const handleManageRoles = (user: User) => {
    setSelectedUser(user);
    setIsManagingRoles(true);
  };

  // Fechar modal de gerenciamento de roles
  const handleCloseModal = () => {
    setSelectedUser(null);
    setIsManagingRoles(false);
    setSelectedRole("");
  };

  // Adicionar role ao usuário
  const handleAddRole = async () => {
    if (!selectedUser || !selectedRole) {
      toastUtil.error("Selecione um cargo para adicionar ao usuário.");
      return;
    }

    try {
      setProcessingUser(selectedUser.id);
      const updatedUser = await adminService.addRoleToUser(
        selectedUser.id,
        selectedRole
      );

      // Atualizar a lista de usuários
      setUsers((prev) =>
        prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );

      setSelectedUser(updatedUser);
      toastUtil.success(`Cargo ${selectedRole} adicionado com sucesso.`);
      setSelectedRole("");
    } catch (error) {
      console.error("Erro ao adicionar cargo:", error);
      toastUtil.error("Erro ao adicionar cargo ao usuário.");
    } finally {
      setProcessingUser(null);
    }
  };

  // Remover role do usuário
  const handleRemoveRole = async (userId: string, roleName: string) => {
    try {
      setProcessingUser(userId);
      const updatedUser = await adminService.removeRoleFromUser(
        userId,
        roleName
      );

      // Atualizar a lista de usuários
      setUsers((prev) =>
        prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );

      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(updatedUser);
      }

      toastUtil.success(`Cargo ${roleName} removido com sucesso.`);
    } catch (error) {
      console.error("Erro ao remover cargo:", error);
      toastUtil.error("Erro ao remover cargo do usuário.");
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

  const getProfileImageUrl = (
    profileImage: string | null | undefined
  ): string => {
    if (!profileImage) return "";

    if (profileImage.startsWith("http")) return profileImage;

    // Obter a URL base da API
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://dev.lavorato.app.br";

    // Construir a URL completa
    return `${apiBaseUrl}/api/profile-images/${profileImage}`;
  };

  // Renderizar o conteúdo principal
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
      <div className="mb-6 flex items-center">
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar usuários por nome ou email..."
            className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>
      </div>

      {/* Tabela de usuários */}
      <div className="overflow-x-auto">
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
                Cargos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data de registro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {user.profileImage ? (
                          <img
                            src={getProfileImageUrl(user.profileImage)}
                            alt={user.fullName}
                            className="h-10 w-10 rounded-full"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`;
                            }}
                          />
                        ) : (
                          user.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.fullName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">
                      {user.emailVerified ? (
                        <span className="text-green-500 flex items-center">
                          <Check size={12} className="mr-1" /> Verificado
                        </span>
                      ) : (
                        <span className="text-orange-500 flex items-center">
                          <AlertTriangle size={12} className="mr-1" /> Não
                          verificado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full ${
                              role === "ROLE_ADMIN"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}>
                            {role.replace("ROLE_", "")}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs">
                          Sem cargos
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt
                      ? formatDate(user.createdAt.toString())
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <CustomButton
                      variant="primary"
                      size="small"
                      className="text-white"
                      onClick={() => handleManageRoles(user)}>
                      Gerenciar Cargos
                    </CustomButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de gerenciamento de roles */}
      {isManagingRoles && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Gerenciar Cargos</h2>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm mb-1">Usuário:</p>
              <div className="flex items-center p-2 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  {selectedUser.profileImage ? (
                    <img
                      src={selectedUser.profileImage}
                      alt={selectedUser.fullName}
                      className="h-10 w-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.fullName)}&background=random`;
                      }}
                    />
                  ) : (
                    selectedUser.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="ml-4">
                  <div className="font-medium">{selectedUser.fullName}</div>
                  <div className="text-sm text-gray-500">
                    {selectedUser.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm mb-2">Cargos atuais:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedUser.roles && selectedUser.roles.length > 0 ? (
                  selectedUser.roles.map((role, index) => (
                    <div
                      key={index}
                      className={`flex items-center px-3 py-1 rounded-full ${
                        role === "ROLE_ADMIN" ? "bg-red-100" : "bg-blue-100"
                      }`}>
                      <span
                        className={`text-sm ${
                          role === "ROLE_ADMIN"
                            ? "text-red-800"
                            : "text-blue-800"
                        }`}>
                        {role.replace("ROLE_", "")}
                      </span>
                      <button
                        onClick={() => handleRemoveRole(selectedUser.id, role)}
                        disabled={processingUser === selectedUser.id}
                        className="ml-2 text-gray-500 hover:text-gray-700 disabled:opacity-50">
                        <X size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">
                    Nenhum cargo atribuído
                  </span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adicionar cargo:
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Selecione um cargo</option>
                  {roles.map((role) => (
                    <option
                      key={role.id}
                      value={role.name}
                      disabled={
                        selectedUser.roles?.includes(`ROLE_${role.name}`) ||
                        selectedUser.roles?.includes(role.name)
                      }>
                      {role.name}
                    </option>
                  ))}
                </select>
                <CustomButton
                  variant="primary"
                  onClick={handleAddRole}
                  disabled={!selectedRole || processingUser === selectedUser.id}
                  className="min-w-20">
                  {processingUser === selectedUser.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Adicionar"
                  )}
                </CustomButton>
              </div>
            </div>

            <div className="flex justify-end">
              <CustomButton
                variant="secondary"
                onClick={handleCloseModal}
                className="border border-gray-300">
                Fechar
              </CustomButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
