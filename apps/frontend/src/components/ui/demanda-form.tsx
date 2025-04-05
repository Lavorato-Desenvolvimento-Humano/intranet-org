// src/components/ui/demanda-form.tsx
import React, { useState, useEffect } from "react";
import { UserDto } from "@/services/user";
import { Demanda, DemandaCreateDto, DemandaUpdateDto } from "@/types/demanda";
import { CustomButton } from "@/components/ui/custom-button";
import { Calendar, Clock } from "lucide-react";

interface DemandaFormProps {
  onSubmit: (demanda: DemandaCreateDto | DemandaUpdateDto) => void;
  demanda?: Demanda;
  usuarios: UserDto[];
  isLoading?: boolean;
  editMode?: boolean;
  podeAtribuir?: boolean;
}

const DemandaForm: React.FC<DemandaFormProps> = ({
  onSubmit,
  demanda,
  usuarios,
  isLoading = false,
  editMode = false,
  podeAtribuir = true,
}) => {
  // Estado inicial do formulário
  const [formData, setFormData] = useState<
    Partial<DemandaCreateDto | DemandaUpdateDto>
  >({
    titulo: "",
    descricao: "",
    dataInicio: new Date().toISOString().split("T")[0],
    dataFim: new Date(new Date().setDate(new Date().getDate() + 7))
      .toISOString()
      .split("T")[0], // Data padrão 7 dias à frente
    atribuidoParaId: "",
    prioridade: "media",
  });

  // Estado para controle de validação
  const [errors, setErrors] = useState<{
    titulo?: string;
    descricao?: string;
    dataInicio?: string;
    dataFim?: string;
    atribuidoParaId?: string;
  }>({});

  // Preencher dados do formulário se estiver em modo de edição
  useEffect(() => {
    if (demanda && editMode) {
      setFormData({
        id: demanda.id,
        titulo: demanda.titulo,
        descricao: demanda.descricao,
        dataInicio: demanda.dataInicio.split("T")[0],
        dataFim: demanda.dataFim.split("T")[0],
        atribuidoParaId: demanda.atribuidoParaId,
        status: demanda.status,
        prioridade: demanda.prioridade,
      });
    }
  }, [demanda, editMode]);

  // Lidar com mudanças nos campos
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpar erro quando o campo for preenchido
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: {
      titulo?: string;
      descricao?: string;
      dataInicio?: string;
      dataFim?: string;
      atribuidoParaId?: string;
    } = {};

    if (!formData.titulo) {
      newErrors.titulo = "O título é obrigatório";
    }

    if (!formData.descricao) {
      newErrors.descricao = "A descrição é obrigatória";
    }

    if (!formData.dataInicio) {
      newErrors.dataInicio = "A data de início é obrigatória";
    }

    if (!formData.dataFim) {
      newErrors.dataFim = "A data de término é obrigatória";
    } else if (
      formData.dataInicio &&
      new Date(formData.dataFim) < new Date(formData.dataInicio)
    ) {
      newErrors.dataFim = "A data de término deve ser depois da data de início";
    }

    if (!formData.atribuidoParaId) {
      newErrors.atribuidoParaId = "O responsável é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Se estiver em modo de edição, garantimos que o ID está presente
      if (editMode && demanda) {
        onSubmit({
          ...formData,
          id: demanda.id,
        } as DemandaUpdateDto);
      } else {
        // Garantimos que os campos obrigatórios estão presentes para criação
        if (formData.titulo && formData.descricao && formData.atribuidoParaId) {
          onSubmit({
            titulo: formData.titulo,
            descricao: formData.descricao,
            dataInicio: formData.dataInicio as string,
            dataFim: formData.dataFim as string,
            atribuidoParaId: formData.atribuidoParaId,
            prioridade: (formData.prioridade as any) || "media",
          } as DemandaCreateDto);
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="titulo"
          className="block text-sm font-medium text-gray-700">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="titulo"
          name="titulo"
          value={formData.titulo || ""}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
            errors.titulo ? "border-red-500" : ""
          }`}
          disabled={isLoading}
          placeholder="Digite o título da demanda"
        />
        {errors.titulo && (
          <p className="mt-1 text-sm text-red-500">{errors.titulo}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="descricao"
          className="block text-sm font-medium text-gray-700">
          Descrição <span className="text-red-500">*</span>
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          value={formData.descricao || ""}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
            errors.descricao ? "border-red-500" : ""
          }`}
          disabled={isLoading}
          placeholder="Descreva os detalhes da demanda"
        />
        {errors.descricao && (
          <p className="mt-1 text-sm text-red-500">{errors.descricao}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="dataInicio"
            className="block text-sm font-medium text-gray-700">
            Data de Início <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              id="dataInicio"
              name="dataInicio"
              value={formData.dataInicio || ""}
              onChange={handleChange}
              className={`pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                errors.dataInicio ? "border-red-500" : ""
              }`}
              disabled={isLoading}
            />
          </div>
          {errors.dataInicio && (
            <p className="mt-1 text-sm text-red-500">{errors.dataInicio}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="dataFim"
            className="block text-sm font-medium text-gray-700">
            Data de Término <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              id="dataFim"
              name="dataFim"
              value={formData.dataFim || ""}
              onChange={handleChange}
              className={`pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                errors.dataFim ? "border-red-500" : ""
              }`}
              disabled={isLoading}
            />
          </div>
          {errors.dataFim && (
            <p className="mt-1 text-sm text-red-500">{errors.dataFim}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="prioridade"
            className="block text-sm font-medium text-gray-700">
            Prioridade <span className="text-red-500">*</span>
          </label>
          <select
            id="prioridade"
            name="prioridade"
            value={formData.prioridade || "media"}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            disabled={isLoading}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        {editMode && demanda && (
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={demanda.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              disabled={isLoading}>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>
        )}

        <div className={!editMode || !demanda ? "md:col-span-2" : ""}>
          <label
            htmlFor="atribuidoParaId"
            className="block text-sm font-medium text-gray-700">
            Atribuir para <span className="text-red-500">*</span>
          </label>
          <select
            id="atribuidoParaId"
            name="atribuidoParaId"
            value={formData.atribuidoParaId || ""}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
              errors.atribuidoParaId ? "border-red-500" : ""
            }`}
            disabled={isLoading || !podeAtribuir}>
            <option value="">Selecione um responsável</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.fullName}
              </option>
            ))}
          </select>
          {errors.atribuidoParaId && (
            <p className="mt-1 text-sm text-red-500">
              {errors.atribuidoParaId}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <CustomButton
          type="button"
          variant="secondary"
          onClick={() => (window.location.href = "/demandas")}
          className="mr-3"
          disabled={isLoading}>
          Cancelar
        </CustomButton>

        <CustomButton type="submit" variant="primary" disabled={isLoading}>
          {isLoading
            ? "Salvando..."
            : editMode
              ? "Atualizar Demanda"
              : "Criar Demanda"}
        </CustomButton>
      </div>
    </form>
  );
};

export default DemandaForm;
