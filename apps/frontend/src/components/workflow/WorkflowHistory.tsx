// src/components/workflow/WorkflowHistory.tsx
import React from "react";
import {
  ArrowUpRight,
  UserPlus,
  Check,
  AlertCircle,
  Pause,
  Play,
  Archive,
  RotateCcw,
} from "lucide-react";
import { WorkflowTransitionDto } from "@/types/workflow";

interface WorkflowHistoryProps {
  transitions: WorkflowTransitionDto[];
}

const WorkflowHistory: React.FC<WorkflowHistoryProps> = ({ transitions }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR");
  };

  const getTransitionIcon = (transition: WorkflowTransitionDto) => {
    switch (transition.transitionType) {
      case "creation":
        return <ArrowUpRight className="text-blue-500" />;
      case "assignment":
        return <UserPlus className="text-purple-500" />;
      case "step_change":
        return <Check className="text-green-500" />;
      case "status_change":
        switch (transition.toStatus) {
          case "completed":
            return <Check className="text-green-500" />;
          case "canceled":
            return <AlertCircle className="text-red-500" />;
          case "paused":
            return <Pause className="text-orange-500" />;
          case "in_progress":
            return <Play className="text-blue-500" />;
          case "archived":
            return <Archive className="text-gray-500" />;
          default:
            return <RotateCcw className="text-gray-500" />;
        }
      default:
        return <ArrowUpRight className="text-gray-500" />;
    }
  };

  const getTransitionText = (transition: WorkflowTransitionDto) => {
    switch (transition.transitionType) {
      case "creation":
        return "Fluxo criado";
      case "assignment":
        return `Etapa ${transition.fromStep || ""} atribuída de ${transition.fromUserName || "Não atribuído"} para ${transition.toUserName}`;
      case "step_change":
        return `Avanço da etapa ${transition.fromStep} (${transition.fromStepName}) para etapa ${transition.toStep} (${transition.toStepName})`;
      case "status_change":
        return `Status alterado de ${getStatusDisplayName(transition.fromStatus)} para ${getStatusDisplayName(transition.toStatus)}`;
      default:
        return "Transição";
    }
  };

  const getStatusDisplayName = (status: string | null) => {
    if (!status) return "Não definido";

    switch (status) {
      case "in_progress":
        return "Em andamento";
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

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-4">Histórico de Atividades</h3>
      <div className="space-y-4">
        {transitions.map((transition, index) => (
          <div
            key={transition.id}
            className="flex items-start p-3 bg-gray-50 rounded-lg">
            <div className="mr-3 mt-1">{getTransitionIcon(transition)}</div>
            <div className="flex-grow">
              <div className="flex justify-between">
                <p className="font-medium">{getTransitionText(transition)}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(transition.createdAt)}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Por: {transition.createdByName}
              </p>
              {transition.comments && (
                <p className="mt-2 text-sm italic">{transition.comments}</p>
              )}
            </div>
          </div>
        ))}

        {transitions.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            Nenhum histórico disponível
          </p>
        )}
      </div>
    </div>
  );
};

export default WorkflowHistory;
