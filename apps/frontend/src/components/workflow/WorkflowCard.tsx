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

  const getStatusColor = () => {
    switch (workflow.status) {
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
    switch (workflow.priority) {
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
        <h3 className="text-lg font-semibold">{workflow.title}</h3>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs ${getPriorityColor()}`}>
            {workflow.priority.charAt(0).toUpperCase() +
              workflow.priority.slice(1)}
          </span>
          <span className={`w-3 h-3 rounded-full ${getStatusColor()}`}></span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-3">
        Template: {workflow.templateName}
      </p>

      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar size={16} className="mr-1" />
          <span>{formatDate(workflow.deadline)}</span>
        </div>

        {workflow.isOverdue && (
          <div className="flex items-center text-red-500 text-sm">
            <AlertTriangle size={16} className="mr-1" />
            <span>Atrasado ({Math.abs(workflow.daysRemaining)} dias)</span>
          </div>
        )}

        {workflow.isNearDeadline && !workflow.isOverdue && (
          <div className="flex items-center text-orange-500 text-sm">
            <Clock size={16} className="mr-1" />
            <span>Prazo próximo ({workflow.daysRemaining} dias)</span>
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
          <div
            className="bg-primary h-2 rounded-full"
            style={{ width: `${workflow.progressPercentage}%` }}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            Etapa {workflow.currentStep} de {workflow.totalSteps}
          </span>
          <span>{workflow.progressPercentage}% concluído</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 text-sm">
        <div>
          {workflow.currentAssigneeName ? (
            <span>Atribuído a: {workflow.currentAssigneeName}</span>
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
