"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Edit,
  Trash,
  ArrowLeft,
  Clock,
  Calendar,
  User,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Breadcrumb from "@/components/ui/breadcrumb";
import DemandaBadge from "@/components/ui/demanda-badge";
import DemandaAuditLog from "@/components/ui/demanda-audit";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loading } from "@/components/ui/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomButton } from "@/components/ui/custom-button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import toastUtil from "@/utils/toast";
import demandaService from "@/services/demanda";
import {
  Demanda,
  DemandaAudit,
  isDemandaAtrasada,
  isDemandaProximaAVencer,
} from "@/types/demanda";

interface DemandasViewPageProps {
  params: {
    id: string;
  };
}

export default function DemandasViewPage({ params }: DemandasViewPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = params;

  // Estados
  const [demanda, setDemanda] = useState<Demanda | null>(null);
  const [auditLog, setAuditLog] = useState<DemandaAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditLoading, setIsAuditLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmStatusOpen, setIsConfirmStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verificar permissões do usuário
  const isAdmin = user?.roles.includes("ADMIN") || false;
  const isSupervisor = user?.roles.includes("SUPERVISOR") || false;

  // Funções auxiliares
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Determinar se o usuário pode editar esta demanda
  const canEdit = () => {
    if (!demanda || !user) return false;

    // Admins e supervisores podem editar qualquer demanda
    if (isAdmin || isSupervisor) return true;

    // Criador pode editar sua própria demanda
    return demanda.criadoPorId === user.id;
  };

  // Determinar se o usuário pode excluir esta demanda
  const canDelete = () => {
    if (!demanda || !user) return false;

    // Apenas admins e supervisores podem excluir
    if (isAdmin || isSupervisor) return true;

    // Criador pode excluir sua própria demanda apenas se estiver pendente
    return demanda.criadoPorId === user.id && demanda.status === "pendente";
  };

  // Determinar se o usuário pode alterar o status
  const canChangeStatus = () => {
    if (!demanda || !user) return false;

    // Se já está concluída, ninguém pode mudar (exceto admins e supervisores)
    if (demanda.status === "concluida" && !(isAdmin || isSupervisor))
      return false;

    // Atribuído pode mudar o status
    if (demanda.atribuidoParaId === user.id) return true;

    // Admins e supervisores podem mudar qualquer status
    return isAdmin || isSupervisor;
  };

  // Carregar dados da demanda
  const loadDemanda = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await demandaService.getDemandaById(id);
      setDemanda(data);
    } catch (error) {
      console.error("Erro ao carregar demanda:", error);
      setError("Não foi possível carregar os detalhes da demanda.");
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar histórico de auditoria
  const loadAuditLog = async () => {
    try {
      setIsAuditLoading(true);
      const data = await demandaService.getDemandaAudit(id);
      setAuditLog(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      // Não exibir erro para o usuário, apenas log
    } finally {
      setIsAuditLoading(false);
    }
  };

  // Efeito para carregar os dados iniciais
  useEffect(() => {
    if (id) {
      loadDemanda();
      loadAuditLog();
    }
  }, [id]);

  // Navegar para a página de edição
  const handleEdit = () => {
    router.push(`/demandas/${id}/editar`);
  };

  // Abrir confirmação de exclusão
  const handleDeleteClick = () => {
    setIsConfirmDeleteOpen(true);
  };

  // Confirmar exclusão
  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await demandaService.deleteDemanda(id);
      toastUtil.success("Demanda excluída com sucesso!");
      router.push("/demandas");
    } catch (error) {
      console.error("Erro ao excluir demanda:", error);
      toastUtil.error("Não foi possível excluir a demanda.");
      setIsConfirmDeleteOpen(false);
      setIsDeleting(false);
    }
  };

  // Preparar mudança de status
  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    setIsConfirmStatusOpen(true);
  };

  // Confirmar mudança de status
  const confirmStatusChange = async () => {
    if (!newStatus) return;

    try {
      setIsStatusUpdating(true);
      await demandaService.updateDemandaStatus(id, newStatus);

      // Recarregar dados
      await loadDemanda();
      await loadAuditLog();

      toastUtil.success(
        `Status da demanda alterado para ${
          newStatus === "pendente"
            ? "Pendente"
            : newStatus === "em_andamento"
              ? "Em Andamento"
              : "Concluída"
        } com sucesso!`
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toastUtil.error("Não foi possível atualizar o status da demanda.");
    } finally {
      setIsStatusUpdating(false);
      setIsConfirmStatusOpen(false);
      setNewStatus(null);
    }
  };

  // Voltar para a página anterior
  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Loading size="large" message="Carregando detalhes da demanda..." />
      </div>
    );
  }

  if (error || !demanda) {
    return (
      <div className="container py-8">
        <Alert variant="error" className="mb-6">
          <AlertDescription>
            {error || "Não foi possível carregar os detalhes da demanda."}
          </AlertDescription>
        </Alert>
        <CustomButton onClick={handleBack} variant="primary">
          Voltar
        </CustomButton>
      </div>
    );
  }

  const isAtrasada = isDemandaAtrasada(demanda);
  const isProximaAVencer = isDemandaProximaAVencer(demanda);

  return (
    <div className="container py-8">
      <Breadcrumb
        items={[
          { label: "Demandas", href: "/demandas" },
          { label: demanda.titulo },
        ]}
        showHome={true}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-3 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{demanda.titulo}</h1>
        </div>
        <div className="flex items-center space-x-3">
          {canEdit() && (
            <CustomButton
              onClick={handleEdit}
              variant="secondary"
              icon={Edit}
              size="small">
              Editar
            </CustomButton>
          )}
          {canDelete() && (
            <CustomButton
              onClick={handleDeleteClick}
              variant="primary"
              icon={Trash}
              size="small"
              className="bg-red-500 hover:bg-red-600">
              Excluir
            </CustomButton>
          )}
        </div>
      </div>

      {/* Alertas de status */}
      {isAtrasada && (
        <Alert variant="error" className="mb-6">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <AlertDescription>
            Esta demanda está atrasada! A data de término era{" "}
            {formatDate(demanda.dataFim)}.
          </AlertDescription>
        </Alert>
      )}

      {!isAtrasada && isProximaAVencer && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <AlertDescription>
            Esta demanda está próxima de vencer! A data de término é{" "}
            {formatDate(demanda.dataFim)}.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <div className="flex items-center space-x-2 mb-2 md:mb-0">
              <DemandaBadge type="status" value={demanda.status} />
              <DemandaBadge type="prioridade" value={demanda.prioridade} />
            </div>

            {/* Botões de ação de status */}
            {canChangeStatus() && (
              <div className="flex space-x-2">
                {demanda.status === "pendente" && (
                  <button
                    onClick={() => handleStatusChange("em_andamento")}
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    Iniciar
                  </button>
                )}
                {demanda.status === "em_andamento" && (
                  <button
                    onClick={() => handleStatusChange("concluida")}
                    className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600">
                    Concluir
                  </button>
                )}
                {demanda.status === "concluida" &&
                  (isAdmin || isSupervisor) && (
                    <button
                      onClick={() => handleStatusChange("em_andamento")}
                      className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600">
                      Reabrir
                    </button>
                  )}
              </div>
            )}
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">
              {demanda.descricao}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-gray-500">Atribuído para</p>
                <p className="font-medium">{demanda.atribuidoParaNome}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-gray-500">Período</p>
                <p className="font-medium">
                  {formatDate(demanda.dataInicio)} a{" "}
                  {formatDate(demanda.dataFim)}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-gray-500">Criado em</p>
                <p className="font-medium">
                  {formatDate(demanda.criadaEm)} por {demanda.criadoPorNome}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Abas para histórico */}
      <Tabs defaultValue="historico">
        <TabsList className="mb-6">
          <TabsTrigger value="historico">Histórico de Alterações</TabsTrigger>
        </TabsList>
        <TabsContent value="historico">
          <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
            <DemandaAuditLog audits={auditLog} loading={isAuditLoading} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmação de exclusão */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        title="Excluir Demanda"
        message={`Tem certeza que deseja excluir a demanda "${demanda.titulo}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Diálogo de confirmação de mudança de status */}
      <ConfirmDialog
        isOpen={isConfirmStatusOpen}
        title={
          newStatus === "pendente"
            ? "Marcar como Pendente"
            : newStatus === "em_andamento"
              ? "Iniciar Demanda"
              : "Concluir Demanda"
        }
        message={
          newStatus === "pendente"
            ? `Tem certeza que deseja marcar a demanda "${demanda.titulo}" como pendente?`
            : newStatus === "em_andamento"
              ? `Tem certeza que deseja iniciar/reabrir a demanda "${demanda.titulo}"?`
              : `Tem certeza que deseja concluir a demanda "${demanda.titulo}"?`
        }
        confirmText={
          newStatus === "pendente"
            ? "Marcar como Pendente"
            : newStatus === "em_andamento"
              ? "Iniciar"
              : "Concluir"
        }
        onConfirm={confirmStatusChange}
        onCancel={() => {
          setIsConfirmStatusOpen(false);
          setNewStatus(null);
        }}
        variant={
          newStatus === "pendente"
            ? "warning"
            : newStatus === "em_andamento"
              ? "info"
              : "success"
        }
        isLoading={isStatusUpdating}
      />
    </div>
  );
}
