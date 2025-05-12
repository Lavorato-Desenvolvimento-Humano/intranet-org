// src/components/workflow/TemplateForm.tsx
"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Globe,
  Users,
  EyeOff,
} from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";
import Input from "@/components/ui/input";
import {
  WorkflowTemplateCreateDto,
  WorkflowTemplateStepCreateDto,
} from "@/types/workflow";

interface TemplateFormProps {
  initialData?: WorkflowTemplateCreateDto;
  onSubmit: (data: WorkflowTemplateCreateDto) => Promise<void>;
  isLoading: boolean;
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState<WorkflowTemplateCreateDto>(
    initialData || {
      name: "",
      description: "",
      visibility: "public",
      steps: [{ name: "", description: "", stepOrder: 1 }],
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
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

  const handleStepChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [name]: value };

    setFormData((prev) => ({ ...prev, steps: newSteps }));

    // Limpar erro do campo
    const errorKey = `steps[${index}].${name}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const addStep = () => {
    const newSteps = [...formData.steps];
    newSteps.push({
      name: "",
      description: "",
      stepOrder: newSteps.length + 1,
    });

    setFormData((prev) => ({ ...prev, steps: newSteps }));
  };

  const removeStep = (index: number) => {
    if (formData.steps.length <= 1) {
      setErrors((prev) => ({
        ...prev,
        steps: "O template deve ter pelo menos uma etapa",
      }));
      return;
    }

    const newSteps = [...formData.steps];
    newSteps.splice(index, 1);

    // Reordenar os passos
    newSteps.forEach((step, i) => {
      step.stepOrder = i + 1;
    });

    setFormData((prev) => ({ ...prev, steps: newSteps }));

    // Limpar erros relacionados ao passo removido
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach((key) => {
      if (key.startsWith(`steps[${index}]`)) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === formData.steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...formData.steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Trocar posições
    [newSteps[index], newSteps[targetIndex]] = [
      newSteps[targetIndex],
      newSteps[index],
    ];

    // Atualizar stepOrder
    newSteps.forEach((step, i) => {
      step.stepOrder = i + 1;
    });

    setFormData((prev) => ({ ...prev, steps: newSteps }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    formData.steps.forEach((step, index) => {
      if (!step.name.trim()) {
        newErrors[`steps[${index}].name`] = "Nome da etapa é obrigatório";
      }
    });

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
      console.error("Erro ao salvar template:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Nome do Template *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Ex: Processo de Aprovação"
            className="w-full"
          />
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
          placeholder="Descreva o propósito deste template de fluxo"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Etapas do Fluxo</h3>
          <CustomButton
            type="button"
            variant="secondary"
            size="small"
            onClick={addStep}
            icon={Plus}>
            Adicionar Etapa
          </CustomButton>
        </div>

        {errors.steps && (
          <p className="text-red-500 text-sm mb-2">{errors.steps}</p>
        )}

        <div className="space-y-4">
          {formData.steps.map((step, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Etapa {index + 1}</h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => moveStep(index, "up")}
                    disabled={index === 0}
                    className={`p-1 rounded-full ${
                      index === 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}>
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(index, "down")}
                    disabled={index === formData.steps.length - 1}
                    className={`p-1 rounded-full ${
                      index === formData.steps.length - 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}>
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="p-1 rounded-full text-red-500 hover:bg-red-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  label="Nome da Etapa *"
                  name="name"
                  value={step.name}
                  onChange={(e) => handleStepChange(index, e)}
                  error={errors[`steps[${index}].name`]}
                  placeholder="Ex: Análise Inicial"
                  className="w-full"
                />

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Descrição da Etapa
                  </label>
                  <textarea
                    name="description"
                    value={step.description}
                    onChange={(e) => handleStepChange(index, e)}
                    rows={2}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent resize-none"
                    placeholder="Descreva o que deve ser feito nesta etapa"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <CustomButton
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}>
          Cancelar
        </CustomButton>
        <CustomButton type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Template"}
        </CustomButton>
      </div>
    </form>
  );
};

export default TemplateForm;
