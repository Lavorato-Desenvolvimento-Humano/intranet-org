// components/admin/AdminRolesTab.tsx
import React, { useState, useEffect } from "react";
import roleService from "@/services/role";
import permissionService from "@/services/permission";
import { Role, Permission } from "@/services/role";
import {
  Loader2,
  Search,
  Plus,
  Trash,
  Edit,
  X,
  Check,
  Info,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";

export default function AdminRolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [processingRoleId, setProcessingRoleId] = useState<number | null>(null);

  // Formulário
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Carregar roles e permissões
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadingError(null);
      setError(null);

      try {
        // Usar Promise.allSettled para processar ambas as requisições separadamente
        const results = await Promise.allSettled([
          roleService.getAllRoles(),
          permissionService.getAllPermissions(),
        ]);

        // Processar resultados das roles
        if (results[0].status === "fulfilled") {
          setRoles(results[0].value);
        } else {
          console.error("Erro ao carregar roles:", results[0].reason);
          setLoadingError(
            "Não foi possível carregar os cargos. O servidor pode estar indisponível ou você não tem permissões suficientes."
          );
        }

        // Processar resultados das permissões
        if (results[1].status === "fulfilled") {
          setPermissions(results[1].value);
        } else {
          console.error("Erro ao carregar permissões:", results[1].reason);
          if (!loadingError) {
            setLoadingError(
              "Não foi possível carregar as permissões. O servidor pode estar indisponível ou você não tem permissões suficientes."
            );
          }
        }
      } catch (error: any) {
        console.error("Erro ao carregar dados:", error);

        // Mensagens de erro detalhadas baseadas no tipo de erro
        if (error.response?.status === 403) {
          setLoadingError(
            "Acesso negado. Você não tem permissões suficientes para visualizar cargos e permissões."
          );
        } else if (error.response?.status === 401) {
          setLoadingError(
            "Sua sessão expirou. Por favor, faça login novamente."
          );
          // Poderia redirecionar para página de login aqui
        } else if (error.message === "Network Error") {
          setLoadingError(
            "Erro de conexão com o servidor. Verifique sua internet e tente novamente."
          );
        } else {
          setLoadingError(
            "Ocorreu um erro ao carregar os dados. Por favor, tente novamente mais tarde."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Tentar carregar os dados novamente
  const handleRetry = () => {
    // Simular um novo carregamento ao incrementar a contagem de tentativas
    setRoles([]);
    setPermissions([]);

    const fetchData = async () => {
      setLoading(true);
      setLoadingError(null);

      try {
        const [rolesData, permissionsData] = await Promise.all([
          roleService.getAllRoles(),
          permissionService.getAllPermissions(),
        ]);

        setRoles(rolesData);
        setPermissions(permissionsData);
        toastUtil.success("Dados carregados com sucesso!");
      } catch (error: any) {
        console.error("Erro ao recarregar dados:", error);
        if (error.response?.status === 403) {
          setLoadingError(
            "Acesso negado. Você não tem permissões suficientes."
          );
        } else {
          setLoadingError(
            "Não foi possível carregar os dados. Tente novamente mais tarde."
          );
        }
        toastUtil.error("Falha ao recarregar dados");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  };

  // Filtrar roles com base no termo de pesquisa
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description &&
        role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Abrir modal de criação de role
  const handleOpenCreateModal = () => {
    setIsCreatingRole(true);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setError(null);
  };

  // Abrir modal de edição de role
  const handleOpenEditModal = (role: Role) => {
    setSelectedRole(role);
    setIsEditingRole(true);
    setRoleDescription(role.description || "");
    setSelectedPermissions(role.permissions.map((p) => p.id));
    setError(null);
  };

  // Fechar modais
  const handleCloseModal = () => {
    setIsCreatingRole(false);
    setIsEditingRole(false);
    setSelectedRole(null);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setError(null);
  };

  // Toggle seleção de permissão
  const togglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Criar nova role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!roleName) {
      setError("O nome do cargo é obrigatório.");
      return;
    }

    // Validar formato do nome (apenas maiúsculas, números e underscores)
    if (!/^[A-Z0-9_]+$/.test(roleName)) {
      setError(
        "O nome do cargo deve conter apenas letras maiúsculas, números e underscores."
      );
      return;
    }

    try {
      setProcessingRoleId(-1); // -1 indica criação
      const newRole = await roleService.createRole({
        name: roleName,
        description: roleDescription,
        permissionIds:
          selectedPermissions.length > 0 ? selectedPermissions : undefined,
      });

      setRoles((prev) => [...prev, newRole]);
      toastUtil.success(`Cargo ${newRole.name} criado com sucesso.`);
      handleCloseModal();
    } catch (error: any) {
      console.error("Erro ao criar cargo:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Erro ao criar cargo. Tente novamente.");
      }
    } finally {
      setProcessingRoleId(null);
    }
  };

  // Atualizar role existente
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRole) {
      return;
    }

    try {
      setProcessingRoleId(selectedRole.id);
      const updatedRole = await roleService.updateRole(selectedRole.id, {
        description: roleDescription,
        permissionIds: selectedPermissions,
      });

      setRoles((prev) =>
        prev.map((role) => {
          if (role.id === updatedRole.id) {
            // Garantir que o objeto updatedRole tenha todas as propriedades necessárias
            return {
              ...role,
              ...updatedRole,
              permissions: updatedRole.permissions || [],
            };
          }
          return role;
        })
      );

      toastUtil.success(`Cargo ${updatedRole.name} atualizado com sucesso.`);
      handleCloseModal();

      // Recarregar roles para garantir dados atualizados
      const refreshedRoles = await roleService.getAllRoles();
      setRoles(refreshedRoles);
    } catch (error: any) {
      console.error("Erro ao atualizar cargo:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Erro ao atualizar cargo. Tente novamente.");
      }
    } finally {
      setProcessingRoleId(null);
    }
  };

  // Excluir role
  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("Tem certeza que deseja excluir este cargo?")) {
      return;
    }

    try {
      setProcessingRoleId(roleId);
      await roleService.deleteRole(roleId);

      setRoles((prev) => prev.filter((role) => role.id !== roleId));
      toastUtil.success("Cargo excluído com sucesso.");
    } catch (error: any) {
      console.error("Erro ao excluir cargo:", error);

      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("usuários vinculados")
      ) {
        toastUtil.error(
          "Não é possível excluir este cargo porque existem usuários vinculados a ele."
        );
      } else {
        toastUtil.error("Erro ao excluir cargo. Tente novamente.");
      }
    } finally {
      setProcessingRoleId(null);
    }
  };

  // Renderizar estado de erro ou carregamento
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={36} className="animate-spin text-primary" />
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <AlertTriangle className="mx-auto text-red-500 mb-4" size={36} />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Erro ao carregar dados
        </h3>
        <p className="text-red-700 mb-6">{loadingError}</p>
        <CustomButton
          onClick={handleRetry}
          icon={RefreshCw}
          className="mx-auto">
          Tentar novamente
        </CustomButton>
      </div>
    );
  }

  if (roles.length === 0 && !loadingError) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <Info className="mx-auto text-yellow-500 mb-4" size={36} />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Nenhum cargo encontrado
        </h3>
        <p className="text-yellow-700 mb-6">
          Não há cargos cadastrados no sistema ou houve um problema ao carregar
          os dados.
        </p>
        <div className="flex justify-center gap-4">
          <CustomButton onClick={handleRetry} icon={RefreshCw}>
            Recarregar
          </CustomButton>
          <CustomButton
            onClick={handleOpenCreateModal}
            icon={Plus}
            variant="primary">
            Criar primeiro cargo
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="text-yellow-500 mr-2 mt-0.5" size={18} />
            <p className="text-yellow-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Barra de pesquisa e botão de criar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar cargos..."
            className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>

        <CustomButton
          variant="primary"
          icon={Plus}
          onClick={handleOpenCreateModal}>
          Novo Cargo
        </CustomButton>
      </div>

      {/* Tabela de roles */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permissões
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuários
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRoles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Nenhum cargo encontrado
                </td>
              </tr>
            ) : (
              filteredRoles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {role.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {role.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions && role.permissions.length > 0 ? (
                        role.permissions
                          .slice(0, 3)
                          .map((permission, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full"
                              title={permission.description || permission.name}>
                              {permission.name}
                            </span>
                          ))
                      ) : (
                        <span className="text-gray-500 text-xs">
                          Sem permissões
                        </span>
                      )}
                      {role.permissions && role.permissions.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          +{role.permissions.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {role.userCount > 0
                        ? `${role.userCount} usuário(s)`
                        : "Nenhum usuário"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(role)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar cargo">
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className={`text-red-600 hover:text-red-900 ${
                          role.userCount > 0
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        title={
                          role.userCount > 0
                            ? "Não é possível excluir cargos com usuários"
                            : "Excluir cargo"
                        }
                        disabled={
                          role.userCount > 0 || processingRoleId === role.id
                        }>
                        {processingRoleId === role.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de criação de role */}
      {isCreatingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Criar Novo Cargo</h2>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateRole}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cargo *
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value.toUpperCase())}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: ADMIN, MANAGER, USER"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use apenas letras maiúsculas, números e underscores (_)
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Descreva este cargo"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permissões
                </label>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {permissions.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">
                      Nenhuma permissão disponível
                    </p>
                  ) : (
                    permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start p-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          id={`permission-${permission.id}`}
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1 mr-2"
                        />
                        <label
                          htmlFor={`permission-${permission.id}`}
                          className="text-sm cursor-pointer">
                          <div className="font-medium">{permission.name}</div>
                          {permission.description && (
                            <div className="text-xs text-gray-500">
                              {permission.description}
                            </div>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <CustomButton
                  type="button"
                  variant="secondary"
                  onClick={handleCloseModal}
                  className="border border-gray-300">
                  Cancelar
                </CustomButton>
                <CustomButton
                  type="submit"
                  variant="primary"
                  disabled={processingRoleId === -1}>
                  {processingRoleId === -1 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Cargo"
                  )}
                </CustomButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de edição de role */}
      {isEditingRole && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Editar Cargo</h2>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700 mb-1">Nome do Cargo:</p>
              <p className="text-base font-medium">{selectedRole.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                O nome do cargo não pode ser alterado
              </p>
            </div>

            <form onSubmit={handleUpdateRole}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Descreva este cargo"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permissões
                </label>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {permissions.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">
                      Nenhuma permissão disponível
                    </p>
                  ) : (
                    permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start p-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          id={`permission-edit-${permission.id}`}
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1 mr-2"
                        />
                        <label
                          htmlFor={`permission-edit-${permission.id}`}
                          className="text-sm cursor-pointer">
                          <div className="font-medium">{permission.name}</div>
                          {permission.description && (
                            <div className="text-xs text-gray-500">
                              {permission.description}
                            </div>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <CustomButton
                  type="button"
                  variant="secondary"
                  onClick={handleCloseModal}
                  className="border border-gray-300">
                  Cancelar
                </CustomButton>
                <CustomButton
                  type="submit"
                  variant="primary"
                  disabled={processingRoleId === selectedRole.id}>
                  {processingRoleId === selectedRole.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </CustomButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
