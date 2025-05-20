"use client";

import React, { useEffect } from "react"; // Adicionando useEffect para debug
import { ChevronRight, Calendar, Clock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { WorkflowSummaryDto } from "@/types/workflow";

interface WorkflowCardProps {
  workflow: WorkflowSummaryDto;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow }) => {
  const router = useRouter();

  // Debug: verificar se os dados de status personalizado estão chegando
  useEffect(() => {
    console.log("Workflow recebido:", workflow);
    if (workflow.customStatusId) {
      console.log("Status personalizado detectado:", {
        customStatusId: workflow.customStatusId,
        customStatusName: workflow.customStatusName,
        customStatusColor: workflow.customStatusColor,
      });
    } else {
      console.log("Nenhum status personalizado detectado para este workflow");
    }
  }, [workflow]);

  // Verificar se workflow está definido
  if (!workflow || !workflow.id) {
    return null;
  }

  // Valores seguros com fallbacks
  const title = workflow.title || "Sem título";
  const templateName = workflow.templateName || "Template não disponível";
  const status = workflow.status || "in_progress";
  const priority = workflow.priority || "medium";
  const deadline = workflow.deadline || null;
  const currentStep = workflow.currentStep || 1;
  const totalSteps = workflow.totalSteps || 1;
  const progressPercentage = workflow.progressPercentage || 0;
  const isOverdue = workflow.isOverdue || false;
  const isNearDeadline = workflow.isNearDeadline || false;
  const daysRemaining = workflow.daysRemaining || 0;
  const currentAssigneeName = workflow.currentAssigneeName || "";

  // Verificar se há status personalizado
  const hasCustomStatus = workflow.customStatusId && workflow.customStatusName;
  console.log("hasCustomStatus:", hasCustomStatus);

  const getStatusColor = () => {
    // Se tiver status customizado, usar a cor dele
    if (hasCustomStatus && workflow.customStatusColor) {
      return workflow.customStatusColor;
    }

    // Caso contrário, usar as cores padrão
    switch (status) {
      case "in_progress":
        return "#3498db"; // Azul
      case "paused":
        return "#f39c12"; // Laranja
      case "completed":
        return "#2ecc71"; // Verde
      case "canceled":
        return "#e74c3c"; // Vermelho
      case "archived":
        return "#95a5a6"; // Cinza
      default:
        return "#808080"; // Cinza padrão
    }
  };

  const getPriorityColor = () => {
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

  const getPriorityDisplayName = (priority?: string) => {
    if (!priority) return "Média";

    switch (priority) {
      case "low":
        return "Baixa";
      case "medium":
        return "Média";
      case "high":
        return "Alta";
      case "urgent":
        return "Urgente";
      default:
        return "Média";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Sem prazo";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const handleClick = () => {
    router.push(`/workflows/${workflow.id}`);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs ${getPriorityColor()}`}>
            {getPriorityDisplayName(priority)}
          </span>

          {/* Status personalizado exibido como um badge ao lado da prioridade */}
          {hasCustomStatus && (
            <div
              className="px-2 py-1 rounded-full flex items-center text-xs"
              style={{
                backgroundColor: workflow.customStatusColor
                  ? `${workflow.customStatusColor}20`
                  : "#f0f0f0",
                color: workflow.customStatusColor || "#666",
              }}>
              <div
                className="h-2 w-2 rounded-full mr-1"
                style={{
                  backgroundColor: workflow.customStatusColor || "#666",
                }}></div>
              <span>{workflow.customStatusName}</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-3">Template: {templateName}</p>

      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar size={16} className="mr-1" />
          <span>{formatDate(deadline)}</span>
        </div>

        {/* Sempre mostrar o status padrão */}
        <div className="flex items-center">
          <div className="flex items-center text-gray-500 text-sm">
            <div
              className="h-3 w-3 rounded-full mr-1"
              style={{
                backgroundColor: hasCustomStatus ? "#808080" : getStatusColor(),
              }}></div>
            <span>{getStatusDisplayName(status)}</span>
          </div>

          {isOverdue && (
            <div className="flex items-center text-red-500 text-sm ml-3">
              <AlertTriangle size={16} className="mr-1" />
              <span>Atrasado ({Math.abs(daysRemaining)} dias)</span>
            </div>
          )}

          {isNearDeadline && !isOverdue && (
            <div className="flex items-center text-orange-500 text-sm ml-3">
              <Clock size={16} className="mr-1" />
              <span>Prazo próximo ({daysRemaining} dias)</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
          <div
            className="h-2 rounded-full"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: getStatusColor(),
            }}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            Etapa {currentStep} de {totalSteps}
          </span>
          <span>{progressPercentage}% concluído</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 text-sm">
        <div>
          {currentAssigneeName ? (
            <span>Atribuído a: {currentAssigneeName}</span>
          ) : (
            <span>Sem atribuição</span>
          )}
        </div>

        <div className="flex items-center text-primary">
          <span>Detalhes</span>
          <ChevronRight size={16} className="ml-1" />
        </div>
      </div>
    </div>
  );
};

// Função auxiliar para obter o nome mais legível do status
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

export default WorkflowCard;
