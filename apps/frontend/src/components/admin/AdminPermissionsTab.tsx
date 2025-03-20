// components/admin/AdminPermissionsTab.tsx
import React, { useState, useEffect } from "react";
import permissionService from "@/services/permission";
import { Permission } from "@/services/role";
import { Loader2, Search, Plus, Trash, Edit, X, Info } from "lucide-react";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";

export default function AdminPermissionsTab() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingPermission, setIsCreatingPermission] = useState(false);
  const [isEditingPermission, setIsEditingPermission] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [processingPermissionId, setProcessingPermissionId] = useState<
    number | null
  >(null);

  // Formulário
  const [permissionName, setPermissionName] = useState("");
  const [permissionDescription, setPermissionDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Carregar permissões
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const permissionsData = await permissionService.getAllPermissions();
        setPermissions(permissionsData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toastUtil.error("Erro ao carregar lista de permissões.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar permissões com base no termo de pesquisa
  const filteredPermissions = permissions.filter(
    (permission) =>
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (permission.description &&
        permission.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Abrir modal de criação de permissão
  const handleOpenCreateModal = () => {
    setIsCreatingPermission(true);
    setPermissionName("");
    setPermissionDescription("");
    setError(null);
  };

  // Abrir modal de edição de permissão
  const handleOpenEditModal = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsEditingPermission(true);
    setPermissionName(permission.name);
    setPermissionDescription(permission.description || "");
    setError(null);
  };

  // Fechar modais
  const handleCloseModal = () => {
    setIsCreatingPermission(false);
    setIsEditingPermission(false);
    setSelectedPermission(null);
    setPermissionName("");
    setPermissionDescription("");
    setError(null);
  };

  // Criar nova permissão
  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!permissionName) {
      setError("O nome da permissão é obrigatório.");
      return;
    }

    // Validar formato do nome (apenas minúsculas, números e dois pontos)
    if (!/^[a-z0-9:]+$/.test(permissionName)) {
      setError(
        "O nome da permissão deve conter apenas letras minúsculas, números e dois pontos (:)."
      );
      return;
    }

    try {
      setProcessingPermissionId(-1); // -1 indica criação
      const newPermission = await permissionService.createPermission({
        name: permissionName,
        description: permissionDescription,
      });

      setPermissions((prev) => [...prev, newPermission]);
      toastUtil.success(`Permissão ${newPermission.name} criada com sucesso.`);
      handleCloseModal();
    } catch (error: any) {
      console.error("Erro ao criar permissão:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Erro ao criar permissão. Tente novamente.");
      }
    } finally {
      setProcessingPermissionId(null);
    }
  };

  // Atualizar permissão existente
  const handleUpdatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPermission) {
      return;
    }

    if (!permissionName) {
      setError("O nome da permissão é obrigatório.");
      return;
    }

    // Validar formato do nome (apenas minúsculas, números e dois pontos)
    if (!/^[a-z0-9:]+$/.test(permissionName)) {
      setError(
        "O nome da permissão deve conter apenas letras minúsculas, números e dois pontos (:)."
      );
      return;
    }

    try {
      setProcessingPermissionId(selectedPermission.id);
      const updatedPermission = await permissionService.updatePermission(
        selectedPermission.id,
        {
          name: permissionName,
          description: permissionDescription,
        }
      );

      setPermissions((prev) =>
        prev.map((permission) =>
          permission.id === updatedPermission.id
            ? updatedPermission
            : permission
        )
      );

      toastUtil.success(
        `Permissão ${updatedPermission.name} atualizada com sucesso.`
      );
      handleCloseModal();
    } catch (error: any) {
      console.error("Erro ao atualizar permissão:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Erro ao atualizar permissão. Tente novamente.");
      }
    } finally {
      setProcessingPermissionId(null);
    }
  };

  // Excluir permissão
  const handleDeletePermission = async (permissionId: number) => {
    if (!confirm("Tem certeza que deseja excluir esta permissão?")) {
      return;
    }

    try {
      setProcessingPermissionId(permissionId);
      await permissionService.deletePermission(permissionId);

      setPermissions((prev) =>
        prev.filter((permission) => permission.id !== permissionId)
      );
      toastUtil.success("Permissão excluída com sucesso.");
    } catch (error: any) {
      console.error("Erro ao excluir permissão:", error);

      if (error.response?.data?.message?.includes("sendo usada")) {
        toastUtil.error(
          "Não é possível excluir esta permissão porque está sendo usada por um ou mais cargos."
        );
      } else {
        toastUtil.error("Erro ao excluir permissão. Tente novamente.");
      }
    } finally {
      setProcessingPermissionId(null);
    }
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
      {/* Barra de pesquisa e botão de criar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar permissões..."
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
          Nova Permissão
        </CustomButton>
      </div>

      {/* Tabela de permissões */}
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
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPermissions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  Nenhuma permissão encontrada
                </td>
              </tr>
            ) : (
              filteredPermissions.map((permission) => (
                <tr key={permission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {permission.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {permission.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(permission)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar permissão">
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeletePermission(permission.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir permissão"
                        disabled={processingPermissionId === permission.id}>
                        {processingPermissionId === permission.id ? (
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

      {/* Modal de criação de permissão */}
      {isCreatingPermission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Criar Nova Permissão</h2>
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

            <form onSubmit={handleCreatePermission}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Permissão *
                </label>
                <input
                  type="text"
                  value={permissionName}
                  onChange={(e) =>
                    setPermissionName(e.target.value.toLowerCase())
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: user:read, user:write"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use apenas letras minúsculas, números e dois pontos. Exemplo:
                  resource:action
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={permissionDescription}
                  onChange={(e) => setPermissionDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Descreva esta permissão"
                  rows={3}
                />
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
                  disabled={processingPermissionId === -1}>
                  {processingPermissionId === -1 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Permissão"
                  )}
                </CustomButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de edição de permissão */}
      {isEditingPermission && selectedPermission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Editar Permissão</h2>
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

            <form onSubmit={handleUpdatePermission}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Permissão *
                </label>
                <input
                  type="text"
                  value={permissionName}
                  onChange={(e) =>
                    setPermissionName(e.target.value.toLowerCase())
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: user:read, user:write"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use apenas letras minúsculas, números e dois pontos. Exemplo:
                  resource:action
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={permissionDescription}
                  onChange={(e) => setPermissionDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Descreva esta permissão"
                  rows={3}
                />
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
                  disabled={processingPermissionId === selectedPermission.id}>
                  {processingPermissionId === selectedPermission.id ? (
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
