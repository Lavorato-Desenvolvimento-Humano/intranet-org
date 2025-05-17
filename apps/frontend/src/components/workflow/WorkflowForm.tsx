// Modificações no src/components/workflow/WorkflowForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { CustomButton } from "@/components/ui/custom-button";
import Input from "@/components/ui/input";
import { Calendar, Clock, Users, EyeOff, Globe } from "lucide-react";
import { WorkflowCreateDto, WorkflowTemplateDto } from "@/types/workflow";
import workflowService from "@/services/workflow";
import userService from "@/services/user";
import { User } from "@/services/auth";

interface WorkflowFormProps {
  initialData?: Partial<WorkflowCreateDto>;
  onSubmit: (data: WorkflowCreateDto) => Promise<void>;
  isLoading: boolean;
  isEditing?: boolean; // Nova prop para indicar se estamos editando
}

const WorkflowForm: React.FC<WorkflowFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  isEditing = false, // Por padrão, é criação
}) => {
  const [formData, setFormData] = useState<WorkflowCreateDto>({
    templateId: initialData?.templateId || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    priority: initialData?.priority || "medium",
    visibility: initialData?.visibility || "public",
    deadline: initialData?.deadline || null,
    teamId: initialData?.teamId || null,
    assignToId: initialData?.assignToId || null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<WorkflowTemplateDto[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkflowTemplateDto | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSameUser, setIsSameUser] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const response = await workflowService.getAllTemplates(0, 100);
        setTemplates(response.content || []);
      } catch (error) {
        console.error("Erro ao buscar templates:", error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const usersData = await userService.getAllUsers();
        setUsers(usersData);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchTemplates();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (formData.templateId) {
      const template = templates.find((t) => t.id === formData.templateId);
      setSelectedTemplate(template || null);
    } else {
      setSelectedTemplate(null);
    }
  }, [formData.templateId, templates]);

  const handleChange = (
    e: React.ChangeEvent
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpar erro do campo
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      deadline: value ? new Date(value).toISOString() : null,
    }));

    // Limpar erro do campo
    if (errors.deadline) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.deadline;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.templateId) {
      newErrors.templateId = "Template é obrigatório";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Título é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Erro ao salvar fluxo:", error);
    }
  };

  // Formatar a data para o formato aceito pelo input type="date"
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Template *</label>
        {isLoadingTemplates ? (
          <div className="p-4 text-center">Carregando templates...</div>
        ) : (
          <select
            name="templateId"
            value={formData.templateId}
            onChange={handleChange}
            disabled={isEditing} // Desabilitar se estiver editando
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent ${
              isEditing ? "bg-gray-100" : ""
            }`}>
            <option value="">Selecione um template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.steps.length} etapas)
              </option>
            ))}
          </select>
        )}
        {errors.templateId && (
          <p className="mt-1 text-sm text-red-500">{errors.templateId}</p>
        )}

        {selectedTemplate && (
          <div className="mt-2 text-sm text-gray-600">
            {selectedTemplate.description}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Título *"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          placeholder="Ex: Análise de Proposta Cliente X"
          className="w-full"
        />

        <div>
          <label className="block text-sm font-medium mb-2">Prioridade *</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent">
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Prazo</label>
          <div className="relative">
            <input
              type="date"
              name="deadline"
              value={formatDateForInput(formData.deadline)}
              onChange={handleDateChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Visibilidade *
          </label>
          <div className="relative">
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent appearance-none">
              <option value="public">Público (visível para todos)</option>
              <option value="restricted">Restrito (apenas envolvidos)</option>
              <option value="team">Equipe (equipe e administradores)</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {formData.visibility === "public" && (
                <Globe size={20} className="text-gray-500" />
              )}
              {formData.visibility === "restricted" && (
                <EyeOff size={20} className="text-gray-500" />
              )}
              {formData.visibility === "team" && (
                <Users size={20} className="text-gray-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Descrição</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent resize-none"
          placeholder="Descreva o objetivo deste fluxo de trabalho"
        />
      </div>

      {!isEditing && (
        <div>
          <label className="flex items-center space-x-2 mb-3">
            <input
              type="checkbox"
              checked={isSameUser}
              onChange={() => setIsSameUser(!isSameUser)}
              className="w-4 h-4 text-primary"
            />
            <span>Começar este fluxo pessoalmente</span>
          </label>

          {!isSameUser && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Atribuir à:
              </label>
              {isLoadingUsers ? (
                <div className="p-2 text-center">Carregando usuários...</div>
              ) : (
                <select
                  name="assignToId"
                  value={formData.assignToId || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent">
                  <option value="">Selecione um usuário</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <CustomButton
          type="button"
          variant="primary"
          className="bg-red-600 hover:bg-red-700 text-white border-none"
          onClick={() => window.history.back()}>
          Cancelar
        </CustomButton>
        <CustomButton type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? (isEditing ? "Salvando..." : "Criando...") : isEditing ? "Salvar Alterações" : "Criar Fluxo"}
        </CustomButton>
      </div>
    </form>
  );
};

export default WorkflowForm;