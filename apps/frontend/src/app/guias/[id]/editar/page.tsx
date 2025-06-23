// apps/frontend/src/app/guias/[id]/editar/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, FileText, Plus, X, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { guiaService, pacienteService } from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import {
  GuiaDto,
  GuiaUpdateRequest,
  StatusChangeRequest,
  PacienteSummaryDto,
} from "@/types/clinical";
import { formatDate } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";
import { StatusSelect } from "@/components/clinical/ui/StatusSelect";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";

export default function EditarGuiaPage() {
  const router = useRouter();
  const params = useParams();
  const guiaId = params.id as string;

  // Estados principais
  const [guia, setGuia] = useState<GuiaDto | null>(null);
  const [pacientes, setPacientes] = useState<PacienteSummaryDto[]>([]);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState<GuiaUpdateRequest>({
    especialidades: [] as string[],
    quantidadeAutorizada: 1,
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    validade: "",
    lote: "",
    valorReais: 0,
    status: "",
    quantidadeFaturada: 0,
  });

  // Estados para especialidades
  const [especialidadeInput, setEspecialidadeInput] = useState("");

  // Estados de validação
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ✅ Estados para mudança de status
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState({
    motivo: "",
    observacoes: "",
  });
  const [statusAnterior, setStatusAnterior] = useState("");

  // Lista de especialidades disponíveis
  const especialidades = [
    "Fisioterapia",
    "Fonoaudiologia",
    "Terapia Ocupacional",
    "Psicologia",
    "Nutrição",
    "Psicopedagogia",
    "Psicomotricidade",
  ];

  // Carregar dados iniciais
  useEffect(() => {
    if (guiaId) {
      loadInitialData();
    }
  }, [guiaId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [guiaData, pacientesData, conveniosData] = await Promise.all([
        guiaService.getGuiaById(guiaId),
        pacienteService.getAllPacientes(0, 1000), // Buscar todos para o select
        convenioService.getAllConvenios(),
      ]);

      setGuia(guiaData);
      setPacientes(pacientesData.content);
      setConvenios(conveniosData);
      setStatusAnterior(guiaData.status); // ✅ Armazenar status anterior

      // Preencher formulário com dados da guia
      setFormData({
        especialidades: [...guiaData.especialidades],
        quantidadeAutorizada: guiaData.quantidadeAutorizada,
        mes: guiaData.mes,
        ano: guiaData.ano,
        validade: guiaData.validade,
        lote: guiaData.lote || "",
        valorReais: guiaData.valorReais,
        status: guiaData.status,
        quantidadeFaturada: guiaData.quantidadeFaturada,
      });
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar informações da guia");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof GuiaUpdateRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // ✅ Handler específico para mudança de status
  const handleStatusChange = (newStatus: string) => {
    // Se o status mudou, mostrar modal para motivo
    if (newStatus !== statusAnterior && newStatus !== "") {
      setFormData((prev) => ({ ...prev, status: newStatus }));
      setShowStatusModal(true);
    } else {
      setFormData((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const addEspecialidade = () => {
    if (
      especialidadeInput.trim() &&
      !formData.especialidades?.includes(especialidadeInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        especialidades: [
          ...(prev.especialidades || []),
          especialidadeInput.trim(),
        ],
      }));
      setEspecialidadeInput("");
    }
  };

  const removeEspecialidade = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      especialidades: prev.especialidades?.filter((_, i) => i !== index) || [],
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.especialidades?.length) {
      errors.especialidades = "Pelo menos uma especialidade é obrigatória";
    }

    if (!formData.quantidadeAutorizada || formData.quantidadeAutorizada <= 0) {
      errors.quantidadeAutorizada = "Quantidade deve ser maior que zero";
    }

    if (!formData.mes || formData.mes < 1 || formData.mes > 12) {
      errors.mes = "Mês deve estar entre 1 e 12";
    }

    if (!formData.ano || formData.ano < 2020) {
      errors.ano = "Ano deve ser válido";
    }

    if (!formData.validade) {
      errors.validade = "Data de validade é obrigatória";
    }

    if (!formData.status) {
      errors.status = "Status é obrigatório";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toastUtil.error("Por favor, corrija os erros no formulário");
      return;
    }

    try {
      setSaving(true);

      // ✅ Verificar se o status mudou
      const statusChanged = formData.status !== statusAnterior;

      if (statusChanged) {
        // ✅ Se o status mudou, usar endpoint específico para mudança de status
        const statusRequest: StatusChangeRequest = {
          novoStatus: formData.status!,
          motivo:
            statusChangeData.motivo || "Alteração via formulário de edição",
          observacoes: statusChangeData.observacoes,
        };

        await guiaService.updateGuiaStatus(guiaId, statusRequest);
      }

      const updateRequest: GuiaUpdateRequest = {
        especialidades: formData.especialidades,
        quantidadeAutorizada: formData.quantidadeAutorizada,
        mes: formData.mes,
        ano: formData.ano,
        validade: formData.validade,
        lote: formData.lote,
        valorReais: formData.valorReais,
        quantidadeFaturada: formData.quantidadeFaturada,
      };

      await guiaService.updateGuia(guiaId, updateRequest);

      toastUtil.success("Guia atualizada com sucesso!");
      router.push(`/guias/${guiaId}`);
    } catch (err: any) {
      console.error("Erro ao atualizar guia:", err);
      toastUtil.error(err.response?.data?.message || "Erro ao atualizar guia");
    } finally {
      setSaving(false);
      setShowStatusModal(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Loading message="Carregando dados da guia..." />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !guia) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {error || "Guia não encontrada"}
              </h2>
              <CustomButton onClick={() => router.push("/guias")}>
                Voltar para Guias
              </CustomButton>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CustomButton
                  variant="primary"
                  onClick={() => router.push(`/guias/${guiaId}`)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </CustomButton>

                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <FileText className="h-8 w-8 mr-3 text-blue-600" />
                    Editar Guia
                  </h1>
                  <p className="text-gray-600 mt-1">
                    #{guia.numeroGuia} - {guia.pacienteNome}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">Status atual:</span>
                <StatusBadge status={statusAnterior} />
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Especialidades */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidades *
                </label>

                <div className="flex space-x-2 mb-3">
                  <select
                    value={especialidadeInput}
                    onChange={(e) => setEspecialidadeInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Selecione uma especialidade</option>
                    {especialidades
                      .filter((esp) => !formData.especialidades?.includes(esp))
                      .map((esp) => (
                        <option key={esp} value={esp}>
                          {esp}
                        </option>
                      ))}
                  </select>
                  <CustomButton
                    type="button"
                    variant="primary"
                    onClick={addEspecialidade}
                    disabled={!especialidadeInput.trim()}>
                    <Plus className="h-4 w-4" />
                  </CustomButton>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.especialidades?.map((especialidade, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {especialidade}
                      <button
                        type="button"
                        onClick={() => removeEspecialidade(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {formErrors.especialidades && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.especialidades}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quantidade Autorizada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade Autorizada *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantidadeAutorizada}
                    onChange={(e) =>
                      handleInputChange(
                        "quantidadeAutorizada",
                        parseInt(e.target.value)
                      )
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.quantidadeAutorizada
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.quantidadeAutorizada && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.quantidadeAutorizada}
                    </p>
                  )}
                </div>

                {/* Valor em Reais */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorReais}
                    onChange={(e) =>
                      handleInputChange(
                        "valorReais",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Mês */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mês *
                  </label>
                  <select
                    required
                    value={formData.mes}
                    onChange={(e) =>
                      handleInputChange("mes", parseInt(e.target.value))
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.mes ? "border-red-500" : "border-gray-300"
                    }`}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                      <option key={mes} value={mes}>
                        {mes.toString().padStart(2, "0")} -{" "}
                        {
                          [
                            "Janeiro",
                            "Fevereiro",
                            "Março",
                            "Abril",
                            "Maio",
                            "Junho",
                            "Julho",
                            "Agosto",
                            "Setembro",
                            "Outubro",
                            "Novembro",
                            "Dezembro",
                          ][mes - 1]
                        }
                      </option>
                    ))}
                  </select>
                  {formErrors.mes && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.mes}
                    </p>
                  )}
                </div>

                {/* Ano */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano *
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    required
                    value={formData.ano}
                    onChange={(e) =>
                      handleInputChange("ano", parseInt(e.target.value))
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.ano ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.ano && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.ano}
                    </p>
                  )}
                </div>

                {/* Validade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validade *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validade}
                    onChange={(e) =>
                      handleInputChange("validade", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.validade ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.validade && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.validade}
                    </p>
                  )}
                </div>

                {/* Lote */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={formData.lote}
                    onChange={(e) => handleInputChange("lote", e.target.value)}
                    placeholder="Número do lote (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Quantidade Faturada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade Faturada
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantidadeFaturada}
                    onChange={(e) =>
                      handleInputChange(
                        "quantidadeFaturada",
                        parseInt(e.target.value)
                      )
                    }
                    placeholder="Quantidade faturada (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* ✅ Status em linha separada */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status *
                  </label>
                  {formData.status && (
                    <StatusBadge status={formData.status} size="xs" />
                  )}
                </div>

                <StatusSelect
                  value={formData.status || ""}
                  onChange={handleStatusChange}
                  required
                  showPreview={false}
                  className={formErrors.status ? "border-red-500" : ""}
                />
                {formErrors.status && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.status}
                  </p>
                )}
                {formData.status !== statusAnterior && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        O status será alterado de{" "}
                        <strong>{statusAnterior}</strong> para{" "}
                        <strong>{formData.status}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <CustomButton
                  type="button"
                  variant="primary"
                  onClick={() => router.push(`/guias/${guiaId}`)}
                  disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </CustomButton>

                <CustomButton type="submit" variant="primary" disabled={saving}>
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Salvando...
                    </div>
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
        </div>

        {/* ✅ Modal para mudança de status */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Alteração de Status
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Status será alterado de <strong>{statusAnterior}</strong>{" "}
                    para <strong>{formData.status}</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo *
                  </label>
                  <input
                    type="text"
                    required
                    value={statusChangeData.motivo}
                    onChange={(e) =>
                      setStatusChangeData((prev) => ({
                        ...prev,
                        motivo: e.target.value,
                      }))
                    }
                    placeholder="Informe o motivo da alteração"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={statusChangeData.observacoes}
                    onChange={(e) =>
                      setStatusChangeData((prev) => ({
                        ...prev,
                        observacoes: e.target.value,
                      }))
                    }
                    placeholder="Observações adicionais (opcional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <CustomButton
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setShowStatusModal(false);
                    setFormData((prev) => ({
                      ...prev,
                      status: statusAnterior,
                    })); // Reverter status
                  }}>
                  Cancelar
                </CustomButton>
                <CustomButton
                  type="button"
                  variant="primary"
                  onClick={() => setShowStatusModal(false)}
                  disabled={!statusChangeData.motivo.trim()}>
                  Confirmar
                </CustomButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
