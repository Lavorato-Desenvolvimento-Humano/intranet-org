"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Flag,
  CheckCircle,
} from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";
import Input from "@/components/ui/input";
import ColorPicker from "@/components/ui/color-picker";
import {
  WorkflowStatusTemplateCreateDto,
  WorkflowStatusItemCreateDto,
} from "@/types/workflow";

interface StatusTemplateFormProps {
  initialData?: WorkflowStatusTemplateCreateDto;
  onSubmit: (data: WorkflowStatusTemplateCreateDto) => Promise<void>;
  isLoading: boolean;
}

const StatusTemplateForm: React.FC<StatusTemplateFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState<WorkflowStatusTemplateCreateDto>(
    initialData || {
      name: "",
      description: "",
      isDefault: false,
      statusItems: [
        {
          name: "Novo",
          description: "Status inicial",
          color: "#3498db", // Azul
          orderIndex: 1,
          isInitial: true,
          isFinal: false,
        },
        {
          name: "Em Andamento",
          description: "Status intermediário",
          color: "#f39c12", // Laranja
          orderIndex: 2,
          isInitial: false,
          isFinal: false,
        },
        {
          name: "Concluído",
          description: "Status final",
          color: "#2ecc71", // Verde
          orderIndex: 3,
          isInitial: false,
          isFinal: true,
        },
      ],
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleStatusChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const newStatusItems = [...formData.statusItems];
    newStatusItems[index] = { ...newStatusItems[index], [name]: value };

    setFormData((prev) => ({ ...prev, statusItems: newStatusItems }));

    // Limpar erro do campo
    const errorKey = `statusItems[${index}].${name}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleStatusFlagChange = (
    index: number,
    flagName: "isInitial" | "isFinal",
    value: boolean
  ) => {
    const newStatusItems = [...formData.statusItems];

    // Se estiver definindo um status como inicial, remover o flag de outros itens
    if (flagName === "isInitial" && value) {
      newStatusItems.forEach((item, i) => {
        if (i !== index) {
          item.isInitial = false;
        }
      });
    }

    newStatusItems[index] = { ...newStatusItems[index], [flagName]: value };
    setFormData((prev) => ({ ...prev, statusItems: newStatusItems }));
  };

  const handleColorChange = (index: number, color: string) => {
    const newStatusItems = [...formData.statusItems];
    newStatusItems[index] = { ...newStatusItems[index], color };

    setFormData((prev) => ({ ...prev, statusItems: newStatusItems }));
  };

  const addStatusItem = () => {
    const newStatusItems = [...formData.statusItems];
    newStatusItems.push({
      name: "",
      description: "",
      color: "#808080", // Cinza como cor padrão
      orderIndex: newStatusItems.length + 1,
      isInitial: newStatusItems.length === 0, // Primeiro item é inicial por padrão
      isFinal: false,
    });

    setFormData((prev) => ({ ...prev, statusItems: newStatusItems }));
  };

  const removeStatusItem = (index: number) => {
    if (formData.statusItems.length <= 1) {
      setErrors((prev) => ({
        ...prev,
        statusItems: "O template deve ter pelo menos um status",
      }));
      return;
    }

    const newStatusItems = [...formData.statusItems];
    const removedItem = newStatusItems.splice(index, 1)[0];

    // Se o item removido era inicial, definir o primeiro item como inicial
    if (removedItem.isInitial && newStatusItems.length > 0) {
      newStatusItems[0].isInitial = true;
    }

    // Reordenar os índices
    newStatusItems.forEach((item, i) => {
      item.orderIndex = i + 1;
    });

    setFormData((prev) => ({ ...prev, statusItems: newStatusItems }));

    // Limpar erros relacionados ao item removido
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach((key) => {
      if (key.startsWith(`statusItems[${index}]`)) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const moveStatusItem = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === formData.statusItems.length - 1)
    ) {
      return;
    }

    const newStatusItems = [...formData.statusItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Trocar posições
    [newStatusItems[index], newStatusItems[targetIndex]] = [
      newStatusItems[targetIndex],
      newStatusItems[index],
    ];

    // Atualizar orderIndex
    newStatusItems.forEach((item, i) => {
      item.orderIndex = i + 1;
    });

    setFormData((prev) => ({ ...prev, statusItems: newStatusItems }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    formData.statusItems.forEach((item, index) => {
      if (!item.name.trim()) {
        newErrors[`statusItems[${index}].name`] =
          "Nome do status é obrigatório";
      }
    });

    // Verificar se pelo menos um status é inicial
    const hasInitial = formData.statusItems.some((item) => item.isInitial);
    if (!hasInitial) {
      newErrors.initialStatus =
        "Pelo menos um status deve ser marcado como inicial";
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
      console.error("Erro ao salvar template de status:", error);
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
            placeholder="Ex: Status de Aprovação"
            className="w-full"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-primary rounded"
            />
            <span className="text-sm">Definir como template padrão</span>
          </label>
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
          placeholder="Descreva o propósito deste template de status"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Status</h3>
          <CustomButton
            type="button"
            variant="primary"
            size="small"
            onClick={addStatusItem}
            icon={Plus}>
            Adicionar Status
          </CustomButton>
        </div>

        {errors.statusItems && (
          <p className="text-red-500 text-sm mb-2">{errors.statusItems}</p>
        )}

        {errors.initialStatus && (
          <p className="text-red-500 text-sm mb-2">{errors.initialStatus}</p>
        )}

        <div className="space-y-4">
          {formData.statusItems.map((status, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 bg-gray-50"
              style={{ borderLeftWidth: "4px", borderLeftColor: status.color }}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: status.color }}></div>
                  <h4 className="font-medium">Status {index + 1}</h4>
                </div>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => moveStatusItem(index, "up")}
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
                    onClick={() => moveStatusItem(index, "down")}
                    disabled={index === formData.statusItems.length - 1}
                    className={`p-1 rounded-full ${
                      index === formData.statusItems.length - 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}>
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStatusItem(index)}
                    className="p-1 rounded-full text-red-500 hover:bg-red-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <Input
                  label="Nome do Status *"
                  name="name"
                  value={status.name}
                  onChange={(e) => handleStatusChange(index, e)}
                  error={errors[`statusItems[${index}].name`]}
                  placeholder="Ex: Em Análise"
                  className="w-full"
                />

                <ColorPicker
                  label="Cor"
                  color={status.color}
                  onChange={(color) => handleColorChange(index, color)}
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-2">
                  Descrição do Status
                </label>
                <textarea
                  name="description"
                  value={status.description}
                  onChange={(e) => handleStatusChange(index, e)}
                  rows={2}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent resize-none"
                  placeholder="Descreva este status"
                />
              </div>

              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={status.isInitial}
                    onChange={(e) =>
                      handleStatusFlagChange(
                        index,
                        "isInitial",
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm flex items-center">
                    <Flag size={16} className="mr-1 text-blue-600" /> Status
                    Inicial
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={status.isFinal}
                    onChange={(e) =>
                      handleStatusFlagChange(index, "isFinal", e.target.checked)
                    }
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm flex items-center">
                    <CheckCircle size={16} className="mr-1 text-green-600" />{" "}
                    Status Final
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <CustomButton
          type="button"
          variant="primary"
          className="bg-red-600 hover:bg-red-700 text-white border-none"
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

export default StatusTemplateForm;
