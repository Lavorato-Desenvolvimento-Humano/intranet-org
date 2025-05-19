// Novo arquivo: apps/frontend/src/components/workflow/WorkflowFilters.tsx
import React, { useState, useEffect } from "react";
import { Filter, X, Check } from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";
import {
  WorkflowStatusTemplateDto,
  WorkflowTemplateDto,
} from "@/types/workflow";
import workflowService from "@/services/workflow";

interface WorkflowFiltersProps {
  onFilterChange: (filters: WorkflowFilters) => void;
}

export interface WorkflowFilters {
  status: string[];
  customStatus: string[];
  step: number | null;
  templateId: string | null;
  statusTemplateId: string | null;
  priority: string[];
}

const WorkflowFilters: React.FC<WorkflowFiltersProps> = ({
  onFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<WorkflowFilters>({
    status: [],
    customStatus: [],
    step: null,
    templateId: null,
    statusTemplateId: null,
    priority: [],
  });

  const [templates, setTemplates] = useState<WorkflowTemplateDto[]>([]);
  const [statusTemplates, setStatusTemplates] = useState<
    WorkflowStatusTemplateDto[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [templatesResponse, statusTemplatesResponse] = await Promise.all([
          workflowService.getAllTemplates(0, 100),
          workflowService.getAllStatusTemplates(0, 100),
        ]);

        setTemplates(templatesResponse.content || []);
        setStatusTemplates(statusTemplatesResponse.content || []);
      } catch (error) {
        console.error("Erro ao carregar filtros:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (key: keyof WorkflowFilters, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      onFilterChange(newFilters);
      return newFilters;
    });
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];

    handleFilterChange("status", newStatus);
  };

  const handleCustomStatusToggle = (statusId: string) => {
    const newCustomStatus = filters.customStatus.includes(statusId)
      ? filters.customStatus.filter((s) => s !== statusId)
      : [...filters.customStatus, statusId];

    handleFilterChange("customStatus", newCustomStatus);
  };

  const handlePriorityToggle = (priority: string) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];

    handleFilterChange("priority", newPriority);
  };

  const resetFilters = () => {
    const emptyFilters = {
      status: [],
      customStatus: [],
      step: null,
      templateId: null,
      statusTemplateId: null,
      priority: [],
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const getStatusItems = () => {
    if (!filters.statusTemplateId) return [];

    const template = statusTemplates.find(
      (t) => t.id === filters.statusTemplateId
    );
    return template?.statusItems || [];
  };

  const getTemplateSteps = () => {
    if (!filters.templateId) return [];

    const template = templates.find((t) => t.id === filters.templateId);
    return template?.steps || [];
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Filtros</h3>
        <div className="flex space-x-2">
          <CustomButton
            variant="primary"
            size="small"
            icon={Filter}
            onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? "Ocultar Filtros" : "Mostrar Filtros"}
          </CustomButton>

          {(filters.status.length > 0 ||
            filters.customStatus.length > 0 ||
            filters.step !== null ||
            filters.templateId !== null ||
            filters.statusTemplateId !== null ||
            filters.priority.length > 0) && (
            <CustomButton
              variant="primary"
              size="small"
              icon={X}
              onClick={resetFilters}>
              Limpar Filtros
            </CustomButton>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="bg-white rounded-lg shadow-md p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro por Status */}
          <div>
            <h4 className="font-medium mb-2">Status</h4>
            <div className="space-y-1">
              {[
                "in_progress",
                "paused",
                "completed",
                "canceled",
                "archived",
              ].map((status) => (
                <label
                  key={status}
                  className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                    className="sr-only"
                  />
                  <span
                    className={`flex items-center w-5 h-5 rounded mr-2 border ${
                      filters.status.includes(status)
                        ? "bg-primary border-primary text-white"
                        : "border-gray-300"
                    }`}>
                    {filters.status.includes(status) && (
                      <Check size={14} className="mx-auto" />
                    )}
                  </span>
                  <span>{getStatusDisplayName(status)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filtro por Prioridade */}
          <div>
            <h4 className="font-medium mb-2">Prioridade</h4>
            <div className="space-y-1">
              {["low", "medium", "high", "urgent"].map((priority) => (
                <label
                  key={priority}
                  className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(priority)}
                    onChange={() => handlePriorityToggle(priority)}
                    className="sr-only"
                  />
                  <span
                    className={`flex items-center w-5 h-5 rounded mr-2 border ${
                      filters.priority.includes(priority)
                        ? "bg-primary border-primary text-white"
                        : "border-gray-300"
                    }`}>
                    {filters.priority.includes(priority) && (
                      <Check size={14} className="mx-auto" />
                    )}
                  </span>
                  <span>{getPriorityDisplayName(priority)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filtro por Templates */}
          <div>
            <h4 className="font-medium mb-2">Template</h4>
            <select
              value={filters.templateId || ""}
              onChange={(e) =>
                handleFilterChange("templateId", e.target.value || null)
              }
              className="w-full px-3 py-2 border rounded-md">
              <option value="">Todos os templates</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Etapa */}
          <div>
            <h4 className="font-medium mb-2">Etapa</h4>
            <select
              value={filters.step || ""}
              onChange={(e) =>
                handleFilterChange(
                  "step",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 border rounded-md"
              disabled={!filters.templateId}>
              <option value="">Todas as etapas</option>
              {getTemplateSteps().map((step) => (
                <option key={step.id} value={step.stepOrder}>
                  {step.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Templates de Status */}
          <div>
            <h4 className="font-medium mb-2">Template de Status</h4>
            <select
              value={filters.statusTemplateId || ""}
              onChange={(e) =>
                handleFilterChange("statusTemplateId", e.target.value || null)
              }
              className="w-full px-3 py-2 border rounded-md">
              <option value="">Todos os templates de status</option>
              {statusTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Status Personalizado */}
          {filters.statusTemplateId && (
            <div>
              <h4 className="font-medium mb-2">Status Personalizado</h4>
              <div className="space-y-1">
                {getStatusItems().map((status) => (
                  <label
                    key={status.id}
                    className="flex items-center cursor-pointer"
                    style={{ color: status.color }}>
                    <input
                      type="checkbox"
                      checked={filters.customStatus.includes(status.id)}
                      onChange={() => handleCustomStatusToggle(status.id)}
                      className="sr-only"
                    />
                    <span
                      className={`flex items-center w-5 h-5 rounded mr-2 border ${
                        filters.customStatus.includes(status.id)
                          ? "border-current bg-current bg-opacity-20"
                          : "border-gray-300"
                      }`}
                      style={{
                        borderColor: status.color,
                        backgroundColor: filters.customStatus.includes(
                          status.id
                        )
                          ? `${status.color}20`
                          : "transparent",
                      }}>
                      {filters.customStatus.includes(status.id) && (
                        <Check size={14} className="mx-auto" />
                      )}
                    </span>
                    <span style={{ color: status.color }}>{status.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Funções auxiliares
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

const getPriorityDisplayName = (priority: string) => {
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
      return priority;
  }
};

export default WorkflowFilters;
