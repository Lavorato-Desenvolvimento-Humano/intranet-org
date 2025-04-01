// src/app/equipes/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Edit,
  Trash,
  ArrowLeft,
  User,
  UserPlus,
  UserX,
  FileText,
  Users,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useAuth } from "@/context/AuthContext";
import equipeService, { EquipeDto } from "@/services/equipe";
import postagemService, { PostagemSummaryDto } from "@/services/postagem";
import userService, { UserDto } from "@/services/user";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import DataTable from "@/components/ui/data-table";

export default function EquipeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [equipe, setEquipe] = useState<EquipeDto | null>(null);
  const [membros, setMembros] = useState<UserDto[]>([]);
  const [postagens, setPostagens] = useState<PostagemSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    isDeleting: false,
  });
  const [confirmRemoveMembro, setConfirmRemoveMembro] = useState<{
    show: boolean;
    membroId: string;
    membroName: string;
    isRemoving: boolean;
  } | null>(null);

  const [showAddMembroModal, setShowAddMembroModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserDto[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const equipeId = params?.id as string;

  // Verificar permissões
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const canEditEquipe = isAdmin || isEditor;

  // Buscar dados da equipe, membros e postagens
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Carregar dados em paralelo
        const [equipeData, membrosEquipeData, postagensData] =
          await Promise.all([
            equipeService.getEquipeById(equipeId),
            equipeService.getMembrosEquipe(equipeId),
            postagemService.getPostagensByEquipeId(equipeId),
          ]);

        console.log("Dados da equipe:", equipeData);
        console.log("Dados dos membros brutos:", membrosEquipeData);

        setEquipe(equipeData);

        // Como o backend já está retornando objetos UserDto formatados,
        // podemos usar diretamente sem precisar mapear novamente
        if (Array.isArray(membrosEquipeData)) {
          // Garantir que cada membro tem um ID válido
          const membrosValidados = membrosEquipeData.filter(
            (membro) => membro && membro.id
          );
          console.log("Membros validados:", membrosValidados);
          setMembros(membrosValidados);
        } else {
          console.log(
            "Formato inesperado de dados de membros:",
            membrosEquipeData
          );
          setMembros([]);
        }

        setPostagens(postagensData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError(
          "Não foi possível carregar os dados da equipe. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    if (equipeId) {
      fetchData();
    }
  }, [equipeId]);

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleRemoveMemberConfirmation = (membro: UserDto) => {
    // Verificação de segurança para não passar undefined como ID
    if (!membro.id) {
      toastUtil.error("ID do membro inválido. Não é possível remover.");
      return;
    }

    setConfirmRemoveMembro({
      show: true,
      membroId: membro.id,
      membroName: membro.fullName || "Membro",
      isRemoving: false,
    });
  };

  // Excluir equipe
  const handleDeleteEquipe = async () => {
    setConfirmDelete({ ...confirmDelete, isDeleting: true });
    try {
      await equipeService.deleteEquipe(equipeId);
      toastUtil.success("Equipe excluída com sucesso!");
      router.push("/equipes");
    } catch (err) {
      console.error("Erro ao excluir equipe:", err);
      toastUtil.error("Erro ao excluir equipe. Tente novamente mais tarde.");
      setConfirmDelete({ show: false, isDeleting: false });
    }
  };

  // Remover membro
  const handleRemoveMembro = async () => {
    if (!confirmRemoveMembro) return;

    const { membroId } = confirmRemoveMembro;

    // Verificação adicional para garantir que o ID do membro é válido
    if (!membroId || membroId === "undefined") {
      toastUtil.error("ID do membro inválido. Não é possível remover.");
      setConfirmRemoveMembro(null);
      return;
    }

    setConfirmRemoveMembro({ ...confirmRemoveMembro, isRemoving: true });

    try {
      await equipeService.removeMembro(equipeId, membroId);
      toastUtil.success("Membro removido com sucesso!");

      // Atualizar lista de membros
      setMembros(membros.filter((m) => m.id !== membroId));

      // Atualizar contador de membros da equipe
      if (equipe) {
        setEquipe({
          ...equipe,
          membroCount: equipe.membroCount - 1,
        });
      }

      setConfirmRemoveMembro(null);
    } catch (err) {
      console.error("Erro ao remover membro:", err);
      toastUtil.error("Erro ao remover membro. Tente novamente.");
      setConfirmRemoveMembro(null);
    }
  };

  // Carregar usuários disponíveis para adicionar
  const loadAvailableUsers = async () => {
    try {
      // Obter todos os usuários
      const allUsers = await userService.getAllUsers();

      // Filtrar usuários que já são membros
      const membroIds = membros.map((m) => m.id);
      const filtered = allUsers.filter(
        (u: { id: any }) => !membroIds.includes(u.id)
      );

      setAvailableUsers(filtered);
    } catch (err) {
      console.error("Erro ao carregar usuários disponíveis:", err);
      toastUtil.error("Erro ao carregar usuários disponíveis.");
    }
  };

  // Adicionar membro
  const handleAddMembro = async () => {
    if (!selectedUserId) {
      toastUtil.warning("Selecione um usuário para adicionar.");
      return;
    }

    try {
      const updatedEquipe = await equipeService.addMembro(
        equipeId,
        selectedUserId
      );

      // Buscar informações do usuário adicionado
      const addedUser = availableUsers.find((u) => u.id === selectedUserId);

      if (addedUser) {
        // Atualizar lista de membros
        setMembros([...membros, addedUser]);

        // Atualizar contador de membros da equipe
        setEquipe(updatedEquipe);
      }

      toastUtil.success("Membro adicionado com sucesso!");
      setShowAddMembroModal(false);
      setSelectedUserId("");
    } catch (err) {
      console.error("Erro ao adicionar membro:", err);
      toastUtil.error("Erro ao adicionar membro. Tente novamente.");
    }
  };

  // Definição das colunas da tabela de membros
  const membroColumns = [
    {
      key: "fullName",
      header: "Nome",
      width: "40%",
      render: (value: string, record: UserDto) => (
        <div className="flex items-center">
          <User size={16} className="mr-2 text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      width: "50%",
    },
    {
      key: "roles",
      header: "Função",
      width: "10%",
      render: (value: string[]) => (
        <div className="text-xs bg-gray-100 px-2 py-1 rounded text-center">
          {value.map((role) => role.replace("ROLE_", "")).join(", ")}
        </div>
      ),
    },
  ];

  // Definição das colunas da tabela de postagens
  const postagemColumns = [
    {
      key: "title",
      header: "Título",
      width: "50%",
      render: (value: string) => (
        <div className="font-medium text-primary hover:text-primary-dark">
          {value}
        </div>
      ),
    },
    {
      key: "createdByName",
      header: "Autor",
      width: "25%",
    },
    {
      key: "createdAt",
      header: "Data",
      width: "25%",
      render: (value: string) => (
        <div className="text-gray-600">{formatDate(value)}</div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando dados da equipe..." />
        </main>
      </div>
    );
  }

  if (error || !equipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            {error || "Equipe não encontrada."}
          </div>
          <button
            onClick={() => router.push("/equipes")}
            className="flex items-center text-primary hover:text-primary-dark transition-colors">
            <ArrowLeft size={16} className="mr-1" />
            Voltar para a lista de equipes
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto p-6">
        <Breadcrumb
          items={[
            { label: "Equipes", href: "/equipes" },
            { label: equipe.nome },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{equipe.nome}</h1>
          {canEditEquipe && (
            <div className="flex space-x-2">
              <CustomButton
                variant="primary"
                icon={Edit}
                onClick={() => router.push(`/equipes/${equipeId}/editar`)}>
                Editar
              </CustomButton>
              {isAdmin && (
                <CustomButton
                  variant="primary"
                  icon={Trash}
                  onClick={() =>
                    setConfirmDelete({ show: true, isDeleting: false })
                  }
                  className="bg-red-600 hover:bg-red-700 text-white border-none">
                  Excluir
                </CustomButton>
              )}
            </div>
          )}
        </div>

        {/* Card de informações da equipe */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Informações da Equipe
          </h2>

          <div className="flex flex-col md:flex-row md:items-center mb-4">
            <div className="md:w-1/2 mb-2 md:mb-0">
              <p className="text-sm text-gray-500">Nome:</p>
              <p className="text-gray-800">{equipe.nome}</p>
            </div>
            <div className="md:w-1/2">
              <p className="text-sm text-gray-500">Data de Criação:</p>
              <p className="text-gray-800">{formatDate(equipe.createdAt)}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500">Descrição:</p>
            <p className="text-gray-800">
              {equipe.descricao || "Sem descrição"}
            </p>
          </div>

          <div className="flex items-center">
            <div className="bg-blue-50 rounded-full px-3 py-1 text-blue-700 text-sm flex items-center">
              <Users size={14} className="mr-1" />
              {equipe.membroCount} membro{equipe.membroCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Seção de membros */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Membros da Equipe
            </h2>
            {canEditEquipe && (
              <CustomButton
                variant="primary"
                icon={UserPlus}
                onClick={() => {
                  loadAvailableUsers();
                  setShowAddMembroModal(true);
                }}>
                Adicionar Membro
              </CustomButton>
            )}
          </div>

          {membros.length === 0 ? (
            <div className="bg-gray-50 p-8 text-center rounded-lg shadow-sm">
              <User size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Esta equipe não possui membros.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <DataTable
                data={membros}
                columns={membroColumns}
                keyExtractor={(item) => item.id}
                showHeader={true}
                showActions={canEditEquipe}
                onDelete={
                  canEditEquipe
                    ? (membro) => handleRemoveMemberConfirmation(membro)
                    : undefined
                }
              />
            </div>
          )}
        </div>

        {/* Seção de postagens da equipe */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Postagens da Equipe
            </h2>
            {canEditEquipe && (
              <CustomButton
                variant="primary"
                icon={FileText}
                onClick={() =>
                  router.push(
                    `/postagens/nova?tipoDestino=equipe&equipeId=${equipeId}`
                  )
                }>
                Nova Postagem
              </CustomButton>
            )}
          </div>

          {postagens.length === 0 ? (
            <div className="bg-gray-50 p-8 text-center rounded-lg shadow-sm">
              <FileText size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">
                Ainda não há postagens para esta equipe.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <DataTable
                data={postagens}
                columns={postagemColumns}
                keyExtractor={(item) => item.id}
                showHeader={true}
                onRowClick={(postagem) =>
                  router.push(`/postagens/${postagem.id}`)
                }
              />
            </div>
          )}
        </div>
      </main>

      {/* Modal para adicionar membro */}
      {showAddMembroModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">
              Adicionar Membro à Equipe
            </h3>

            {availableUsers.length === 0 ? (
              <p className="text-gray-600 mb-4">
                Não há usuários disponíveis para adicionar.
              </p>
            ) : (
              <>
                <div className="mb-4">
                  <label
                    htmlFor="userId"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    Selecione um usuário:
                  </label>
                  <select
                    id="userId"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option value="">Selecione um usuário</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowAddMembroModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md">
                Cancelar
              </button>
              <button
                onClick={handleAddMembro}
                disabled={availableUsers.length === 0 || !selectedUserId}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de confirmação para exclusão de equipe */}
      {confirmDelete.show && (
        <ConfirmDialog
          isOpen={true}
          title="Excluir Equipe"
          message={`Tem certeza que deseja excluir a equipe "${equipe.nome}"? Esta ação não pode ser desfeita e todas as postagens associadas a ela serão afetadas.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={handleDeleteEquipe}
          onCancel={() => setConfirmDelete({ show: false, isDeleting: false })}
          isLoading={confirmDelete.isDeleting}
          variant="danger"
        />
      )}

      {/* Diálogo de confirmação para remoção de membro */}
      {confirmRemoveMembro && (
        <ConfirmDialog
          isOpen={true}
          title="Remover Membro"
          message={`Tem certeza que deseja remover ${confirmRemoveMembro.membroName} desta equipe?`}
          confirmText="Remover"
          cancelText="Cancelar"
          onConfirm={handleRemoveMembro}
          onCancel={() => setConfirmRemoveMembro(null)}
          isLoading={confirmRemoveMembro.isRemoving}
          variant="warning"
        />
      )}
    </div>
  );
}
