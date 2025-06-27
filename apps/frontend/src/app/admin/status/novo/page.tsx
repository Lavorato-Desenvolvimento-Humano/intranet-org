// src/app/admin/status/novo/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Settings,
  AlertCircle,
  Info,
  Eye,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { CustomButton } from "@/components/ui/custom-button";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { statusService } from "@/services/clinical";
import { StatusCreateRequest } from "@/types/clinical";
import toastUtil from "@/utils/toast";

export default function NovoStatusPage() {
  const router = useRouter();

  // Estados do formulário
  const [formData, setFormData] = useState<StatusCreateRequest>({
    status: "",
    descricao: "",
    ativo: true,
    ordemExibicao: 1,
  });

  // Estados de controle
  const [loading, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar nome do status
    if (!formData.status.trim()) {
      newErrors.status = "O nome do status é obrigatório";
    } else if (formData.status.trim().length < 2) {
      newErrors.status = "O nome deve ter pelo menos 2 caracteres";
    } else if (formData.status.trim().length > 50) {
      newErrors.status = "O nome deve ter no máximo 50 caracteres";
    } else if (!/^[A-Z][A-Z0-9_\s]*$/.test(formData.status.trim())) {
      newErrors.status =
        "Use apenas MAIÚSCULAS, números, underscore e espaços. Deve começar com letra.";
    }

    // Validar descrição
    if (formData.descricao && formData.descricao.length > 255) {
      newErrors.descricao = "A descrição deve ter no máximo 255 caracteres";
    }

    // Validar ordem de exibição
    if (formData.ordemExibicao === undefined || formData.ordemExibicao < 1) {
      newErrors.ordemExibicao = "A ordem deve ser um número maior que 0";
    } else if (formData.ordemExibicao > 999) {
      newErrors.ordemExibicao = "A ordem deve ser menor que 1000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler para mudanças nos campos
  const handleInputChange = (field: keyof StatusCreateRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo ao alterar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handler para submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toastUtil.error("Por favor, corrija os erros no formulário");
      return;
    }

    try {
      setSaving(true);

      // Preparar dados para envio
      const statusData: StatusCreateRequest = {
        status: formData.status.trim().toUpperCase(),
        descricao: formData.descricao?.trim() || undefined,
        ativo: formData.ativo,
        ordemExibicao: formData.ordemExibicao,
      };

      const novoStatus = await statusService.createStatus(statusData);

      toastUtil.success("Status criado com sucesso!");
      router.push(`/admin/status/${novoStatus.id}`);
    } catch (err: any) {
      console.error("Erro ao criar status:", err);

      if (err.response?.status === 409) {
        setErrors({ status: "Já existe um status com este nome" });
        toastUtil.error("Já existe um status com este nome");
      } else {
        toastUtil.error(err.response?.data?.message || "Erro ao criar status");
      }
    } finally {
      setSaving(false);
    }
  };

  // Preview do status
  const previewStatus = formData.status.trim() || "EXEMPLO";

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <CustomButton
                variant="primary"
                onClick={() => router.back()}
                className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </CustomButton>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Settings className="mr-2 h-6 w-6" />
                  Criar Novo Status
                </h1>
                <p className="text-gray-600 mt-1">
                  Configure um novo status para usar no sistema
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulário */}
            <div className="lg:col-span-2">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">
                  Informações do Status
                </h2>

                <div className="space-y-6">
                  {/* Nome do Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Status *
                    </label>
                    <input
                      type="text"
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange(
                          "status",
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="Ex: EM_ANALISE, APROVADO, CANCELADO"
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.status ? "border-red-500" : "border-gray-300"
                      }`}
                      maxLength={50}
                    />
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.status}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Use MAIÚSCULAS, números, underscore e espaços. Será usado
                      internamente no sistema.
                    </p>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.descricao || ""}
                      onChange={(e) =>
                        handleInputChange("descricao", e.target.value)
                      }
                      placeholder="Descrição detalhada do que este status representa..."
                      rows={3}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.descricao ? "border-red-500" : "border-gray-300"
                      }`}
                      maxLength={255}
                    />
                    {errors.descricao && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.descricao}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.descricao?.length || 0}/255 caracteres
                    </p>
                  </div>

                  {/* Ordem de Exibição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordem de Exibição *
                    </label>
                    <input
                      type="number"
                      value={formData.ordemExibicao}
                      onChange={(e) =>
                        handleInputChange(
                          "ordemExibicao",
                          parseInt(e.target.value) || 1
                        )
                      }
                      min="1"
                      max="999"
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.ordemExibicao
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.ordemExibicao && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.ordemExibicao}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Define a ordem em que o status aparece nas listas (1-999)
                    </p>
                  </div>

                  {/* Status Ativo */}
                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.ativo}
                        onChange={(e) =>
                          handleInputChange("ativo", e.target.checked)
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Status ativo
                      </span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500 ml-7">
                      Status inativos não aparecem nas opções de seleção
                    </p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <CustomButton
                    type="button"
                    variant="primary"
                    onClick={() => router.back()}>
                    Cancelar
                  </CustomButton>
                  <CustomButton
                    type="submit"
                    variant="primary"
                    disabled={loading}>
                    {loading ? (
                      "Criando..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Criar Status
                      </>
                    )}
                  </CustomButton>
                </div>
              </form>
            </div>

            {/* Preview e Ajuda */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Preview */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Eye className="mr-2 h-5 w-5" />
                    Preview do Status
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Como aparecerá no sistema:
                      </p>
                      <StatusBadge status={previewStatus} size="md" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Nome:</p>
                      <p className="text-sm text-gray-600">
                        {formData.status || "..."}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Descrição:
                      </p>
                      <p className="text-sm text-gray-600">
                        {formData.descricao || "Nenhuma descrição"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Status:
                      </p>
                      <p className="text-sm text-gray-600">
                        {formData.ativo ? "✅ Ativo" : "❌ Inativo"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Ordem:
                      </p>
                      <p className="text-sm text-gray-600">
                        {formData.ordemExibicao}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ajuda */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <Info className="mr-2 h-5 w-5" />
                    Dicas para Criação
                  </h3>

                  <div className="space-y-3 text-sm text-blue-700">
                    <div>
                      <p className="font-medium">• Nomenclatura:</p>
                      <p>
                        Use nomes descritivos em MAIÚSCULAS, como "EM_ANALISE",
                        "APROVADO", "CANCELADO"
                      </p>
                    </div>

                    <div>
                      <p className="font-medium">• Ordem de Exibição:</p>
                      <p>
                        Defina a sequência lógica do fluxo de trabalho (1 =
                        primeiro)
                      </p>
                    </div>

                    <div>
                      <p className="font-medium">• Descrição:</p>
                      <p>Explique claramente quando usar este status</p>
                    </div>

                    <div>
                      <p className="font-medium">• Status Ativo:</p>
                      <p>
                        Desmarque apenas se não quiser que apareça nas opções
                      </p>
                    </div>
                  </div>
                </div>

                {/* Exemplos Comuns */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Exemplos Comuns
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <StatusBadge status="EMITIDO" size="xs" />
                      <span className="text-gray-600">Ordem: 1</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge status="EM_ANALISE" size="xs" />
                      <span className="text-gray-600">Ordem: 2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge status="APROVADO" size="xs" />
                      <span className="text-gray-600">Ordem: 3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge status="CANCELADO" size="xs" />
                      <span className="text-gray-600">Ordem: 99</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
