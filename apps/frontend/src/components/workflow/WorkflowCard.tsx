// src/components/workflow/WorkflowCard.tsx
"use client";

import React from "react";
import { ChevronRight, Calendar, Clock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { WorkflowSummaryDto } from "@/types/workflow";

interface WorkflowCardProps {
  workflow: WorkflowSummaryDto;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow }) => {
  const router = useRouter();

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

  const getStatusColor = () => {
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
          <span className={`w-3 h-3 rounded-full ${getStatusColor()}`}></span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-3">Template: {templateName}</p>

      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar size={16} className="mr-1" />
          <span>{formatDate(deadline)}</span>
        </div>

        {isOverdue && (
          <div className="flex items-center text-red-500 text-sm">
            <AlertTriangle size={16} className="mr-1" />
            <span>Atrasado ({Math.abs(daysRemaining)} dias)</span>
          </div>
        )}

        {isNearDeadline && !isOverdue && (
          <div className="flex items-center text-orange-500 text-sm">
            <Clock size={16} className="mr-1" />
            <span>Prazo próximo ({daysRemaining} dias)</span>
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
          <div
            className="bg-primary h-2 rounded-full"
            style={{ width: `${progressPercentage}%` }}></div>
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

export default WorkflowCard;
