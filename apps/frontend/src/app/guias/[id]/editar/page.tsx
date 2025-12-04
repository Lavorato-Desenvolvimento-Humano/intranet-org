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
  GuiaItem,
} from "@/types/clinical";
import { formatDate } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";
import { StatusSelect } from "@/components/clinical/ui/StatusSelect";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";

// Interface auxiliar para o item sendo adicionado
interface TempItem {
  especialidade: string;
  quantidade: number;
  quantidadeExecutada?: number;
}

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
    itens: [] as GuiaItem[],
    numeroVenda: "",
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    validade: "",
    lote: "",
    valorReais: 0,
    status: "",
    quantidadeFaturada: 0,
  });

  // Estado para o novo item
  const [newItem, setNewItem] = useState<TempItem>({
    especialidade: "",
    quantidade: 10,
    quantidadeExecutada: 0,
  });

  // Estados de validação
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Estados para mudança de status
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
    "Terapia ocupacional",
    "Psicoterapia",
    "Nutrição",
    "Psicopedagogia",
    "Psicomotricidade",
    "Musicoterapia",
    "Avaliação neuropsicológica",
    "Arteterapia",
    "Terapia ABA",
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
        pacienteService.getAllPacientes(0, 1000),
        convenioService.getAllConvenios(),
      ]);

      setGuia(guiaData);
      setPacientes(pacientesData.content);
      setConvenios(conveniosData);
      setStatusAnterior(guiaData.status);

      // Preencher formulário com dados da guia
      setFormData({
        itens: guiaData.itens || [],
        numeroVenda: guiaData.numeroVenda,
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

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== statusAnterior && newStatus !== "") {
      setFormData((prev) => ({ ...prev, status: newStatus }));
      setShowStatusModal(true);
    } else {
      setFormData((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const handleItemChange = (index: number, field: string, value: number) => {
    if (!formData.itens) return;

    const newItens = [...formData.itens];
    newItens[index] = {
      ...newItens[index],
      [field]: value,
    };

    setFormData((prev) => ({ ...prev, itens: newItens }));
  };

  const addItem = () => {
    if (newItem.especialidade.trim() && newItem.quantidade > 0) {
      const exists = formData.itens?.some(
        (item) => item.especialidade === newItem.especialidade
      );

      if (exists) {
        toastUtil.error("Esta especialidade já foi adicionada.");
        return;
      }

      const novoItemParaSalvar: GuiaItem = {
        id: undefined,
        especialidade: newItem.especialidade,
        quantidadeAutorizada: newItem.quantidade,
      } as GuiaItem;

      setFormData((prev) => ({
        ...prev,
        itens: [...(prev.itens || []), novoItemParaSalvar],
      }));

      setNewItem({ especialidade: "", quantidade: 10 });

      if (formErrors.itens) {
        setFormErrors((prev) => ({ ...prev, itens: "" }));
      }
    }
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens?.filter((_, i) => i !== index) || [],
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.itens?.length) {
      errors.itens = "Pelo menos uma especialidade é obrigatória";
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

      const statusChanged = formData.status !== statusAnterior;

      if (statusChanged) {
        const statusRequest: StatusChangeRequest = {
          novoStatus: formData.status!,
          motivo:
            statusChangeData.motivo || "Alteração via formulário de edição",
          observacoes: statusChangeData.observacoes,
        };

        await guiaService.updateGuiaStatus(guiaId, statusRequest);
      }

      const updateRequest: GuiaUpdateRequest = {
        itens: formData.itens,
        numeroVenda: formData.numeroVenda,
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
              {/* SEÇÃO DE ESPECIALIDADES E QUANTIDADES */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidades e Quantidades *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Gerencie as especialidades cobertas por esta guia e suas
                  respectivas quantidades.
                </p>

                <div className="flex flex-col md:flex-row gap-3 mb-4 items-end">
                  {/* Select de Especialidade */}
                  <div className="flex-1 w-full">
                    <label className="text-xs text-gray-600 mb-1 block">
                      Especialidade
                    </label>
                    <select
                      value={newItem.especialidade}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          especialidade: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="">Selecione...</option>
                      {especialidades
                        .filter(
                          (esp) =>
                            !formData.itens?.some(
                              (item) => item.especialidade === esp
                            )
                        )
                        .map((esp) => (
                          <option key={esp} value={esp}>
                            {esp}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Input de Quantidade */}
                  <div className="w-full md:w-32">
                    <label className="text-xs text-gray-600 mb-1 block">
                      Qtd. Autorizada
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantidade}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          quantidade: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Botão Adicionar */}
                  <CustomButton
                    type="button"
                    variant="primary"
                    onClick={addItem}
                    disabled={
                      !newItem.especialidade.trim() || newItem.quantidade <= 0
                    }
                    className="h-[42px]">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </CustomButton>
                </div>

                {/* Lista de Itens Adicionados */}
                {formData.itens && formData.itens.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {formData.itens.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                        {/* Nome da Especialidade */}
                        <div className="flex-1 font-medium text-blue-900">
                          {item.especialidade}
                        </div>

                        {/* Inputs de Quantidade */}
                        <div className="flex items-center space-x-4 mx-4">
                          {/* Input Autorizada */}
                          <div className="flex flex-col items-center">
                            <label className="text-[10px] text-gray-500 mb-1">
                              Autorizada
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantidadeAutorizada}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantidadeAutorizada",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-center"
                            />
                          </div>

                          {/* Input Executada (O NOVO CAMPO) */}
                          <div className="flex flex-col items-center">
                            <label className="text-[10px] text-gray-500 mb-1">
                              Executada
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.quantidadeExecutada ?? 0}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantidadeExecutada",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-center bg-gray-50"
                            />
                          </div>
                        </div>

                        {/* Botão Remover */}
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Remover item">
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-md text-gray-500">
                    Nenhuma especialidade adicionada.
                  </div>
                )}

                {formErrors.itens && (
                  <p className="text-red-500 text-xs mt-2 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {formErrors.itens}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Número da Venda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da Venda *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroVenda}
                    onChange={(e) =>
                      handleInputChange("numeroVenda", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {formErrors.numeroVenda && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.numeroVenda}
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

              {/* Status em linha separada */}
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

        {/* Modal para mudança de status */}
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
                    }));
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
