// src/app/workflows/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/breadcrumb";
import { CustomButton } from "@/components/ui/custom-button";
import { Loading } from "@/components/ui/loading";
import WorkflowProgress from "@/components/workflow/WorkflowProgress";
import WorkflowHistory from "@/components/workflow/WorkflowHistory";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  ArrowLeft,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
  ArchiveIcon,
  RotateCcw,
  ArrowRight,
  UserPlus,
  Calendar,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";
import {
  WorkflowDto,
  WorkflowAssignmentDto,
  WorkflowTransitionDto,
} from "@/types/workflow";
import workflowService from "@/services/workflow";
import userService from "@/services/user";
import { User } from "@/services/auth";
import toastUtil from "@/utils/toast";
import Navbar from "@/components/layout/Navbar";

interface WorkflowPageProps {
  params: {
    id: string;
  };
}

export default function WorkflowPage({ params }: WorkflowPageProps) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // States para diálogos de confirmação
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignToId, setAssignToId] = useState("");
  const [assignComment, setAssignComment] = useState("");

  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [advanceToId, setAdvanceToId] = useState("");
  const [advanceComment, setAdvanceComment] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getWorkflowById(params.id);
      setWorkflow(data);
    } catch (err) {
      console.error("Erro ao carregar fluxo:", err);
      setError(
        "Não foi possível carregar o fluxo. Tente novamente mais tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
    fetchUsers();
  }, [params.id]);

  const handleUpdateStatus = async () => {
    try {
      setIsSubmitting(true);
      await workflowService.updateStatus(params.id, newStatus, statusComment);
      toastUtil.success(
        `Status atualizado para ${getStatusDisplayName(newStatus)}`
      );
      fetchWorkflow();
      setShowStatusDialog(false);
      setStatusComment("");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toastUtil.error("Não foi possível atualizar o status. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignStep = async () => {
    try {
      setIsSubmitting(true);

      if (!workflow) return;

      await workflowService.assignStep(
        params.id,
        workflow.currentStep,
        assignToId,
        assignComment
      );

      toastUtil.success("Etapa atribuída com sucesso");
      fetchWorkflow();
      setShowAssignDialog(false);
      setAssignComment("");
    } catch (error) {
      console.error("Erro ao atribuir etapa:", error);
      toastUtil.error("Não foi possível atribuir a etapa. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceStep = async () => {
    try {
      setIsSubmitting(true);
      await workflowService.advanceToNextStep(
        params.id,
        advanceToId,
        advanceComment
      );

      toastUtil.success("Fluxo avançado para a próxima etapa");
      fetchWorkflow();
      setShowAdvanceDialog(false);
      setAdvanceComment("");
    } catch (error) {
      console.error("Erro ao avançar fluxo:", error);
      toastUtil.error("Não foi possível avançar o fluxo. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveWorkflow = async () => {
    try {
      setIsSubmitting(true);
      await workflowService.archiveWorkflow(params.id);
      toastUtil.success("Fluxo arquivado com sucesso");
      fetchWorkflow();
    } catch (error) {
      console.error("Erro ao arquivar fluxo:", error);
      toastUtil.error("Não foi possível arquivar o fluxo. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreWorkflow = async () => {
    try {
      setIsSubmitting(true);
      await workflowService.restoreWorkflow(params.id);
      toastUtil.success("Fluxo restaurado com sucesso");
      fetchWorkflow();
    } catch (error) {
      console.error("Erro ao restaurar fluxo:", error);
      toastUtil.error("Não foi possível restaurar o fluxo. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para obter o nome mais legível do status
  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "in_progress":
        return "Em Andamento";
      case "paused":
        return "Pausado";
      case "completed":
        return "Concluído";
      case "canceled":
        return "Cancelado";
      case "archived":
        return "Arquivado";
      default:
        return status;
    }
  };

  // Funções para obter ícones e cores
  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-300";

    switch (status) {
      case "in_progress":
        return "bg-blue-500";
      case "paused":
        return "bg-orange-500";
      case "completed":
        return "bg-green-500";
      case "canceled":
        return "bg-red-500";
      case "archived":
        return "bg-gray-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case "in_progress":
        return <PlayCircle className="text-blue-500" />;
      case "paused":
        return <PauseCircle className="text-orange-500" />;
      case "completed":
        return <CheckCircle className="text-green-500" />;
      case "canceled":
        return <XCircle className="text-red-500" />;
      case "archived":
        return <ArchiveIcon className="text-gray-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return "bg-gray-100 text-gray-800";

    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVisibilityIcon = () => {
    if (!workflow) return null;

    switch (workflow.visibility) {
      case "public":
        return <Eye size={16} className="text-green-500 mr-1" />;
      case "restricted":
        return <EyeOff size={16} className="text-orange-500 mr-1" />;
      case "team":
        return <Users size={16} className="text-blue-500 mr-1" />;
      default:
        return null;
    }
  };

  const getVisibilityText = () => {
    if (!workflow) return "";

    switch (workflow.visibility) {
      case "public":
        return "Público";
      case "restricted":
        return "Restrito";
      case "team":
        return "Equipe";
      default:
        return workflow.visibility;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Sem prazo";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Obter a atribuição atual
  const getCurrentAssignment = (): WorkflowAssignmentDto | undefined => {
    if (!workflow) return undefined;

    return workflow.assignments.find(
      (assignment) => assignment.stepNumber === workflow.currentStep
    );
  };

  // Verificar se existem mais etapas
  const hasMoreSteps = () => {
    if (!workflow) return false;
    return workflow.currentStep < workflow.totalSteps;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Loading size="medium" message="Carregando fluxo de trabalho..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <CustomButton
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => router.push("/workflows")}>
          Voltar
        </CustomButton>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Fluxo não encontrado
        </div>
        <CustomButton
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => router.push("/workflows")}>
          Voltar
        </CustomButton>
      </div>
    );
  }

  const currentAssignment = getCurrentAssignment();

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-6 px-4">
        <Breadcrumb
          items={[
            { label: "Fluxos de Trabalho", href: "/workflows" },
            { label: workflow.title },
          ]}
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{workflow.title}</h1>
              <span
                className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(workflow.priority)}`}>
                {workflow.priority.charAt(0).toUpperCase() +
                  workflow.priority.slice(1)}
              </span>
              <span
                className={`w-3 h-3 rounded-full ${getStatusColor(workflow.status)}`}></span>
              <span className="text-gray-600">
                {getStatusDisplayName(workflow.status)}
              </span>
            </div>
            <div className="flex items-center text-gray-600 mt-1">
              <span className="mr-4">Baseado em: {workflow.templateName}</span>
              {getVisibilityIcon()}
              <span>{getVisibilityText()}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {workflow.status === "in_progress" && (
              <>
                <CustomButton
                  variant="secondary"
                  size="small"
                  icon={UserPlus}
                  onClick={() => {
                    setAssignToId(currentAssignment?.assignedToId || "");
                    setShowAssignDialog(true);
                  }}>
                  Atribuir
                </CustomButton>

                {hasMoreSteps() && (
                  <CustomButton
                    variant="primary"
                    size="small"
                    icon={ArrowRight}
                    onClick={() => setShowAdvanceDialog(true)}>
                    Avançar
                  </CustomButton>
                )}

                <CustomButton
                  variant="secondary"
                  size="small"
                  icon={PauseCircle}
                  onClick={() => {
                    setNewStatus("paused");
                    setShowStatusDialog(true);
                  }}>
                  Pausar
                </CustomButton>

                <CustomButton
                  variant="secondary"
                  size="small"
                  icon={CheckCircle}
                  onClick={() => {
                    setNewStatus("completed");
                    setShowStatusDialog(true);
                  }}>
                  Concluir
                </CustomButton>

                <CustomButton
                  variant="secondary"
                  size="small"
                  icon={XCircle}
                  onClick={() => {
                    setNewStatus("canceled");
                    setShowStatusDialog(true);
                  }}>
                  Cancelar
                </CustomButton>
              </>
            )}

            {workflow.status === "paused" && (
              <CustomButton
                variant="primary"
                size="small"
                icon={PlayCircle}
                onClick={() => {
                  setNewStatus("in_progress");
                  setShowStatusDialog(true);
                }}>
                Retomar
              </CustomButton>
            )}

            {(workflow.status === "completed" ||
              workflow.status === "canceled") && (
              <CustomButton
                variant="secondary"
                size="small"
                icon={ArchiveIcon}
                onClick={handleArchiveWorkflow}>
                Arquivar
              </CustomButton>
            )}

            {workflow.status === "archived" && (
              <CustomButton
                variant="primary"
                size="small"
                icon={RotateCcw}
                onClick={handleRestoreWorkflow}>
                Restaurar
              </CustomButton>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <WorkflowProgress
            currentStep={workflow.currentStep}
            totalSteps={workflow.totalSteps}
            steps={workflow.assignments.map((a) => ({
              name: a.stepName,
              status: a.status,
            }))}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Detalhes do Fluxo</h2>

            {workflow.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Descrição
                </h3>
                <p className="text-gray-700">{workflow.description}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Etapa Atual
              </h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">
                      {currentAssignment?.stepName ||
                        `Etapa ${workflow.currentStep}`}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Atribuído a:{" "}
                      {currentAssignment?.assignedToName || "Não atribuído"}
                    </p>

                    {currentAssignment?.startDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Iniciado em:{" "}
                        {new Date(currentAssignment.startDate).toLocaleString(
                          "pt-BR"
                        )}
                      </p>
                    )}
                  </div>

                  <div
                    className={`px-2 py-1 rounded-full text-xs ${
                      currentAssignment?.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : currentAssignment?.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}>
                    {currentAssignment?.status === "completed"
                      ? "Concluído"
                      : currentAssignment?.status === "in_progress"
                        ? "Em andamento"
                        : "Pendente"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Histórico de Atividades
              </h3>
              <WorkflowHistory transitions={workflow.transitions} />
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Informações</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Criado por
                  </h3>
                  <p>{workflow.createdByName}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Data de Criação
                  </h3>
                  <p>{new Date(workflow.createdAt).toLocaleString("pt-BR")}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Última Atualização
                  </h3>
                  <p>{new Date(workflow.updatedAt).toLocaleString("pt-BR")}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Prazo</h3>
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-500 mr-1" />
                    <p>{formatDate(workflow.deadline)}</p>
                  </div>

                  {workflow.isOverdue && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <AlertTriangle size={16} className="mr-1" />
                      <span>
                        Atrasado ({Math.abs(workflow.daysRemaining)} dias)
                      </span>
                    </div>
                  )}

                  {workflow.isNearDeadline && !workflow.isOverdue && (
                    <div className="flex items-center text-orange-500 text-sm mt-1">
                      <Clock size={16} className="mr-1" />
                      <span>Prazo próximo ({workflow.daysRemaining} dias)</span>
                    </div>
                  )}
                </div>

                {workflow.teamName && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Equipe
                    </h3>
                    <p>{workflow.teamName}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Progresso</h2>

              <div className="w-full h-4 bg-gray-200 rounded-full mb-2">
                <div
                  className="h-4 bg-primary rounded-full"
                  style={{ width: `${workflow.progressPercentage}%` }}></div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                {workflow.progressPercentage}% concluído
              </p>

              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span>Etapas concluídas:</span>
                  <span>
                    {
                      workflow.assignments.filter(
                        (a) => a.status === "completed"
                      ).length
                    }{" "}
                    / {workflow.totalSteps}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Etapa atual:</span>
                  <span>
                    {workflow.currentStep} de {workflow.totalSteps}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Diálogos de Confirmação */}
        <ConfirmDialog
          isOpen={showStatusDialog}
          title={`${
            newStatus === "completed"
              ? "Concluir"
              : newStatus === "paused"
                ? "Pausar"
                : newStatus === "canceled"
                  ? "Cancelar"
                  : "Retomar"
          } Fluxo`}
          message={
            <>
              <p className="mb-4">
                {newStatus === "completed"
                  ? "Tem certeza que deseja marcar este fluxo como concluído?"
                  : newStatus === "paused"
                    ? "Tem certeza que deseja pausar este fluxo?"
                    : newStatus === "canceled"
                      ? "Tem certeza que deseja cancelar este fluxo?"
                      : "Tem certeza que deseja retomar este fluxo?"}
              </p>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Comentário (opcional)
                </label>
                <textarea
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded-md"
                  placeholder="Adicione um comentário sobre esta mudança..."
                />
              </div>
            </>
          }
          confirmText={
            newStatus === "completed"
              ? "Concluir"
              : newStatus === "paused"
                ? "Pausar"
                : newStatus === "canceled"
                  ? "Cancelar"
                  : "Retomar"
          }
          cancelText="Cancelar"
          onConfirm={handleUpdateStatus}
          onCancel={() => {
            setShowStatusDialog(false);
            setStatusComment("");
          }}
          variant={newStatus === "canceled" ? "danger" : "warning"}
          isLoading={isSubmitting}
        />

        <ConfirmDialog
          isOpen={showAssignDialog}
          title="Atribuir Etapa"
          message={
            <>
              <p className="mb-4">
                Selecione o usuário responsável pela etapa atual:
              </p>
              <div className="mb-4">
                <select
                  value={assignToId}
                  onChange={(e) => setAssignToId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={loadingUsers}>
                  <option value="">Selecione um usuário</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Comentário (opcional)
                </label>
                <textarea
                  value={assignComment}
                  onChange={(e) => setAssignComment(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded-md"
                  placeholder="Adicione um comentário sobre esta atribuição..."
                />
              </div>
            </>
          }
          confirmText="Atribuir"
          cancelText="Cancelar"
          onConfirm={handleAssignStep}
          onCancel={() => {
            setShowAssignDialog(false);
            setAssignComment("");
          }}
          variant="info"
          isLoading={isSubmitting}
        />

        <ConfirmDialog
          isOpen={showAdvanceDialog}
          title="Avançar para Próxima Etapa"
          message={
            <>
              <p className="mb-4">
                Ao avançar, a etapa atual será marcada como concluída e o fluxo
                passará para a próxima etapa.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Atribuir próxima etapa para:
                </label>
                <select
                  value={advanceToId}
                  onChange={(e) => setAdvanceToId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={loadingUsers}>
                  <option value="">Selecione um usuário</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Comentário (opcional)
                </label>
                <textarea
                  value={advanceComment}
                  onChange={(e) => setAdvanceComment(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded-md"
                  placeholder="Adicione um comentário sobre esta transição..."
                />
              </div>
            </>
          }
          confirmText="Avançar"
          cancelText="Cancelar"
          onConfirm={handleAdvanceStep}
          onCancel={() => {
            setShowAdvanceDialog(false);
            setAdvanceComment("");
          }}
          variant="info"
          isLoading={isSubmitting}
        />
      </div>
    </>
  );
}
