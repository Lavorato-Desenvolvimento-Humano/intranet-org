// src/app/admin/status/[id]/editar/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Settings,
  AlertCircle,
  Info,
  Eye,
  History,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { statusService } from "@/services/clinical";
import { StatusDto, StatusUpdateRequest } from "@/types/clinical";
import { formatDateTime } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

export default function EditarStatusPage() {
  const router = useRouter();
  const params = useParams();
  const statusId = params.id as string;

  // Estados principais
  const [originalStatus, setOriginalStatus] = useState<StatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState<StatusUpdateRequest>({
    status: "",
    descricao: "",
    ativo: true,
    ordemExibicao: 1,
  });

  // Estados de validação
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    if (statusId) {
      loadStatusData();
    }
  }, [statusId]);

  // Verificar mudanças no formulário
  useEffect(() => {
    if (originalStatus) {
      const changed =
        formData.status !== originalStatus.status ||
        formData.descricao !== (originalStatus.descricao || "") ||
        formData.ativo !== originalStatus.ativo ||
        formData.ordemExibicao !== originalStatus.ordemExibicao;

      setHasChanges(changed);
    }
  }, [formData, originalStatus]);

  const loadStatusData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statusData = await statusService.getStatusById(statusId);
      setOriginalStatus(statusData);

      // Preencher formulário com dados existentes
      setFormData({
        status: statusData.status,
        descricao: statusData.descricao || "",
        ativo: statusData.ativo,
        ordemExibicao: statusData.ordemExibicao || 1,
      });
    } catch (err: any) {
      console.error("Erro ao carregar dados do status:", err);
      setError("Erro ao carregar informações do status");
      toastUtil.error("Erro ao carregar dados do status");
    } finally {
      setLoading(false);
    }
  };

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
  const handleInputChange = (field: keyof StatusUpdateRequest, value: any) => {
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

    if (!hasChanges) {
      toastUtil.info("Nenhuma alteração foi feita");
      return;
    }

    try {
      setSaving(true);

      // Preparar dados para envio
      const updateData: StatusUpdateRequest = {
        status: formData.status.trim().toUpperCase(),
        descricao: formData.descricao?.trim() || undefined,
        ativo: formData.ativo,
        ordemExibicao: formData.ordemExibicao,
      };

      const statusAtualizado = await statusService.updateStatus(
        statusId,
        updateData
      );

      toastUtil.success("Status atualizado com sucesso!");
      router.push(`/admin/status/${statusAtualizado.id}`);
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err);

      if (err.response?.status === 409) {
        setErrors({ status: "Já existe um status com este nome" });
        toastUtil.error("Já existe um status com este nome");
      } else {
        toastUtil.error(
          err.response?.data?.message || "Erro ao atualizar status"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // Handler para cancelar edição
  const handleCancel = () => {
    if (hasChanges) {
      const confirmacao = window.confirm(
        "Você tem alterações não salvas. Deseja realmente cancelar?"
      );
      if (!confirmacao) return;
    }

    router.back();
  };

  // Preview do status
  const previewStatus = formData.status.trim() || "EXEMPLO";

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando dados do status..." />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

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
                onClick={handleCancel}
                className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </CustomButton>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Settings className="mr-2 h-6 w-6" />
                  Editar Status
                </h1>
                <p className="text-gray-600 mt-1">
                  Modificar configurações do status "
                  {originalStatus?.status || "..."}"
                </p>
              </div>
            </div>

            {hasChanges && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                <p className="text-sm text-yellow-800">
                  ⚠️ Você tem alterações não salvas
                </p>
              </div>
            )}
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
                      value={formData.descricao}
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
                    onClick={handleCancel}>
                    Cancelar
                  </CustomButton>
                  <CustomButton
                    type="submit"
                    variant="primary"
                    disabled={saving || !hasChanges}>
                    {saving ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </CustomButton>
                </div>
              </form>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Preview */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Eye className="mr-2 h-5 w-5" />
                  Preview
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Como aparecerá:
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
                    <p className="text-sm font-medium text-gray-700">Status:</p>
                    <p className="text-sm text-gray-600">
                      {formData.ativo ? "✅ Ativo" : "❌ Inativo"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Ordem:</p>
                    <p className="text-sm text-gray-600">
                      {formData.ordemExibicao}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparação com Original */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <History className="mr-2 h-5 w-5" />
                  Status Original
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-blue-700">Nome:</p>
                    <p className="text-blue-600">
                      {originalStatus?.status || "..."}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-blue-700">Descrição:</p>
                    <p className="text-blue-600">
                      {originalStatus?.descricao || "Nenhuma"}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-blue-700">Ativo:</p>
                    <p className="text-blue-600">
                      {originalStatus?.ativo ? "Sim" : "Não"}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-blue-700">Ordem:</p>
                    <p className="text-blue-600">
                      {originalStatus?.ordemExibicao || "Não definida"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações do Sistema */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Informações do Sistema
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">ID:</p>
                    <code className="text-xs bg-white px-2 py-1 rounded border">
                      {originalStatus?.id || "..."}
                    </code>
                  </div>

                  <div>
                    <p className="font-medium text-gray-700">Criado em:</p>
                    <p className="text-gray-600">
                      {originalStatus?.createdAt
                        ? formatDateTime(originalStatus.createdAt)
                        : "Não disponível"}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-700">
                      Última alteração:
                    </p>
                    <p className="text-gray-600">
                      {originalStatus?.updatedAt
                        ? formatDateTime(originalStatus.updatedAt)
                        : "Não disponível"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Ações Rápidas
                </h3>

                <div className="space-y-3">
                  <CustomButton
                    variant="primary"
                    onClick={() =>
                      originalStatus &&
                      router.push(`/admin/status/${originalStatus.id}`)
                    }
                    className="w-full justify-start"
                    disabled={!originalStatus}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </CustomButton>

                  <CustomButton
                    variant="primary"
                    onClick={() => router.push("/admin/status")}
                    className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Lista de Status
                  </CustomButton>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
