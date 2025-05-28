// src/components/workflow/WorkflowGroupedView.tsx
"use client";

import React from "react";
import { WorkflowSummaryDto } from "@/types/workflow";
import WorkflowCard from "./WorkflowCard";
import Pagination from "@/components/ui/pagination";
import {
  PlayCircle,
  PauseCircle,
  CheckCircle,
  XCircle,
  Archive,
} from "lucide-react";

interface WorkflowGroupedViewProps {
  workflows: WorkflowSummaryDto[];
  loading: boolean;
  error: string | null;
  // Novas props para paginação
  currentPage: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}

interface StatusGroup {
  key: string;
  name: string;
  color: string;
  icon: React.ReactNode;
  workflows: WorkflowSummaryDto[];
  isCustomStatus: boolean;
}

const WorkflowGroupedView: React.FC<WorkflowGroupedViewProps> = ({
  workflows,
  loading,
  error,
  currentPage,
  totalPages,
  totalElements,
  onPageChange,
  pageSize = 12,
}) => {
  // Criar grupos de status considerando status personalizados e padrão
  const createStatusGroups = (): StatusGroup[] => {
    const groups: Record<string, StatusGroup> = {};

    workflows.forEach((workflow) => {
      let groupKey: string;
      let groupName: string;
      let groupColor: string;
      let isCustomStatus = false;

      // Verificar se o workflow tem status personalizado
      if (
        workflow.customStatusId &&
        workflow.customStatusName &&
        workflow.customStatusColor
      ) {
        // Usar status personalizado
        groupKey = workflow.customStatusId;
        groupName = workflow.customStatusName;
        groupColor = workflow.customStatusColor;
        isCustomStatus = true;
      } else {
        // Usar status padrão
        groupKey = workflow.status || "unknown";
        groupName = getDefaultStatusDisplayName(workflow.status || "unknown");
        groupColor = getDefaultStatusColor(workflow.status || "unknown");
        isCustomStatus = false;
      }

      // Criar ou atualizar o grupo
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          name: groupName,
          color: groupColor,
          icon: isCustomStatus
            ? null
            : getDefaultStatusIcon(workflow.status || "unknown"),
          workflows: [],
          isCustomStatus,
        };
      }

      groups[groupKey].workflows.push(workflow);
    });

    // Converter para array e ordenar
    const groupsArray = Object.values(groups);

    // Ordenar grupos: status personalizados primeiro (por orderIndex se disponível), depois status padrão
    return groupsArray.sort((a, b) => {
      // Se ambos são personalizados, manter ordem original (já vem ordenado do backend)
      if (a.isCustomStatus && b.isCustomStatus) {
        return 0;
      }

      // Se um é personalizado e outro padrão, personalizado vem primeiro
      if (a.isCustomStatus && !b.isCustomStatus) {
        return -1;
      }
      if (!a.isCustomStatus && b.isCustomStatus) {
        return 1;
      }

      // Se ambos são padrão, usar ordem definida
      const statusOrder = [
        "in_progress",
        "paused",
        "completed",
        "canceled",
        "archived",
      ];
      const aIndex = statusOrder.indexOf(a.key);
      const bIndex = statusOrder.indexOf(b.key);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  };

  // Função para obter o nome legível do status padrão
  const getDefaultStatusDisplayName = (status: string) => {
    switch (status) {
      case "in_progress":
        return "Em Andamento";
      case "paused":
        return "Pausados";
      case "completed":
        return "Concluídos";
      case "canceled":
        return "Cancelados";
      case "archived":
        return "Arquivados";
      default:
        return status;
    }
  };

  // Função para obter a cor do status padrão
  const getDefaultStatusColor = (status: string) => {
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

  // Função para obter o ícone do status padrão
  const getDefaultStatusIcon = (status: string) => {
    switch (status) {
      case "in_progress":
        return <PlayCircle size={20} className="text-blue-500" />;
      case "paused":
        return <PauseCircle size={20} className="text-orange-500" />;
      case "completed":
        return <CheckCircle size={20} className="text-green-500" />;
      case "canceled":
        return <XCircle size={20} className="text-red-500" />;
      case "archived":
        return <Archive size={20} className="text-gray-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Carregando fluxos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-gray-400 mb-4">
          <PlayCircle size={48} className="mx-auto" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Nenhum fluxo encontrado</h3>
        <p className="text-gray-600">
          Não há fluxos de trabalho para exibir no momento.
        </p>
      </div>
    );
  }

  const statusGroups = createStatusGroups();

  return (
    <div className="space-y-8">
      {/* Informações de paginação no topo */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Página {currentPage} de {totalPages} • {totalElements} fluxos no
            total
          </div>
          <div className="text-sm text-gray-500">
            Mostrando {workflows.length} fluxos nesta página
          </div>
        </div>
      </div>

      {/* Grupos de status */}
      {statusGroups.map((group) => {
        return (
          <div
            key={group.key}
            className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Cabeçalho do grupo de status */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {group.isCustomStatus ? (
                    // Para status personalizado, usar um círculo colorido simples
                    <div
                      className="w-5 h-5 rounded-full mr-2"
                      style={{ backgroundColor: group.color }}></div>
                  ) : (
                    // Para status padrão, usar o ícone
                    group.icon
                  )}
                  <h2 className="text-lg font-semibold ml-2">{group.name}</h2>
                  {group.isCustomStatus && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Status Personalizado
                    </span>
                  )}
                </div>
                <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {group.workflows.length}{" "}
                  {group.workflows.length === 1 ? "fluxo" : "fluxos"}
                </span>
              </div>
            </div>

            {/* Grid de workflows para este status */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.workflows.map((workflow) => (
                  <WorkflowCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Componente de paginação */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        totalItems={totalElements}
        pageSize={pageSize}
      />
    </div>
  );
};

export default WorkflowGroupedView;
