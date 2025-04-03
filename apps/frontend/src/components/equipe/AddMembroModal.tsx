// apps/frontend/src/components/equipe/AddMembroModal.tsx
import React, { useState, useEffect } from "react";
import { UserPlus, X, Search } from "lucide-react";
import { UserDto } from "@/services/user";
import {
  buildProfileImageUrl,
  getPlaceholderImageUrl,
} from "@/utils/imageUtils";

interface AddMembroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userId: string) => Promise<void>;
  availableUsers: UserDto[];
  isLoading: boolean;
}

export const AddMembroModal: React.FC<AddMembroModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  availableUsers,
  isLoading,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedUserPreview, setSelectedUserPreview] =
    useState<UserDto | null>(null);

  // Filtrar usuários com base na pesquisa
  const filteredUsers = availableUsers.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Atualizar preview quando o usuário selecionado mudar
  useEffect(() => {
    if (selectedUserId) {
      const user = availableUsers.find((u) => u.id === selectedUserId);
      setSelectedUserPreview(user || null);
    } else {
      setSelectedUserPreview(null);
    }
  }, [selectedUserId, availableUsers]);

  // Função para lidar com a adição do membro
  const handleAddMembro = async () => {
    if (!selectedUserId) return;

    setIsSubmitting(true);
    try {
      await onAdd(selectedUserId);
      setSelectedUserId("");
      setSelectedUserPreview(null);
      setSearchTerm("");
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para obter URL da imagem de perfil ou placeholder
  const getProfileImageUrl = (user: UserDto) => {
    if (user.profileImage) {
      return buildProfileImageUrl(user.profileImage);
    }
    return getPlaceholderImageUrl(user.fullName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Adicionar Membro à Equipe</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-middle"></div>
            <p className="mt-2 text-gray-600">Carregando usuários...</p>
          </div>
        ) : availableUsers.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-600">
              Não há usuários disponíveis para adicionar.
            </p>
          </div>
        ) : (
          <>
            {/* Barra de pesquisa */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Pesquisar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>

            {/* Lista de usuários */}
            <div className="max-h-60 overflow-y-auto mb-4 border border-gray-200 rounded-md">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Nenhum usuário encontrado com esse termo.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 flex items-center cursor-pointer hover:bg-gray-50 ${
                      selectedUserId === user.id
                        ? "bg-blue-50 border-l-4 border-primary"
                        : ""
                    }`}
                    onClick={() => setSelectedUserId(user.id)}>
                    <img
                      src={getProfileImageUrl(user)}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-200"
                      onError={(e) => {
                        // Fallback para avatar gerado se a imagem falhar
                        (e.target as HTMLImageElement).src =
                          getPlaceholderImageUrl(user.fullName);
                      }}
                    />
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {user.fullName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Preview do usuário selecionado */}
            {selectedUserPreview && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500 mb-2">
                  Usuário selecionado:
                </p>
                <div className="flex items-center">
                  <img
                    src={getProfileImageUrl(selectedUserPreview)}
                    alt={selectedUserPreview.fullName}
                    className="w-12 h-12 rounded-full mr-3 object-cover border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        getPlaceholderImageUrl(selectedUserPreview.fullName);
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-800">
                      {selectedUserPreview.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedUserPreview.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                disabled={isSubmitting}>
                Cancelar
              </button>
              <button
                onClick={handleAddMembro}
                disabled={!selectedUserId || isSubmitting}
                className={`px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors flex items-center ${
                  !selectedUserId || isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}>
                <UserPlus size={18} className="mr-2" />
                {isSubmitting ? "Adicionando..." : "Adicionar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddMembroModal;
