"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, FileText, Plus, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { guiaService, pacienteService } from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import { GuiaCreateRequest, PacienteSummaryDto } from "@/types/clinical";
import toastUtil from "@/utils/toast";
import { StatusSelect } from "@/components/clinical/ui/StatusSelect";

export default function NovaGuiaPage() {
  const router = useRouter();

  // Estados principais
  const [pacientes, setPacientes] = useState<PacienteSummaryDto[]>([]);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState<GuiaCreateRequest>({
    pacienteId: "",
    numeroGuia: "",
    especialidades: [],
    quantidadeAutorizada: 1,
    convenioId: "",
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    validade: "",
    lote: "",
    valorReais: 0,
    status: "",
  });

  const handleStatusChange = (newStatus: string) => {
    setFormData((prev) => ({ ...prev, status: newStatus }));

    //Limpar erro do campo de status quando o usuário começar a digitar
    if (formErrors.status) {
      setFormErrors((prev) => ({ ...prev, status: "" }));
    }
  };

  // Estados para especialidades
  const [especialidadeInput, setEspecialidadeInput] = useState("");

  // Estados de validação
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pacientesData, conveniosData] = await Promise.all([
        pacienteService.getAllPacientes(0, 1000), // Buscar todos para o select
        convenioService.getAllConvenios(),
      ]);

      setPacientes(pacientesData.content);
      setConvenios(conveniosData);

      // Definir data de validade padrão (3 meses a partir de hoje)
      const today = new Date();
      const validadeDefault = new Date(today.setMonth(today.getMonth() + 3));
      setFormData((prev) => ({
        ...prev,
        validade: validadeDefault.toISOString().split("T")[0],
      }));
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar informações necessárias");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.pacienteId) {
      errors.pacienteId = "Paciente é obrigatório";
    }

    if (formData.especialidades.length === 0) {
      errors.especialidades = "Pelo menos uma especialidade é obrigatória";
    }

    if (!formData.quantidadeAutorizada || formData.quantidadeAutorizada < 1) {
      errors.quantidadeAutorizada = "Quantidade deve ser maior que zero";
    }

    if (!formData.convenioId) {
      errors.convenioId = "Convênio é obrigatório";
    }

    if (!formData.mes || formData.mes < 1 || formData.mes > 12) {
      errors.mes = "Mês inválido";
    }

    if (!formData.ano || formData.ano < 2020) {
      errors.ano = "Ano inválido";
    }

    if (!formData.validade) {
      errors.validade = "Data de validade é obrigatória";
    } else {
      const validadeDate = new Date(formData.validade);
      const today = new Date();
      if (validadeDate <= today) {
        errors.validade = "Data de validade deve ser futura";
      }
    }

    if ((formData.valorReais ?? 0) < 0) {
      errors.valorReais = "Valor não pode ser negativo";
    }

    if (!formData.status) {
      errors.status = "Status é obrigatório";
    }

    if (!formData.numeroGuia) {
      errors.numeroGuia = "Número da guia é obrigatório";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toastUtil.error("Corrija os erros no formulário");
      return;
    }

    try {
      setSaving(true);

      const novaGuia = await guiaService.createGuia(formData);

      toastUtil.success("Guia criada com sucesso!");
      router.push(`/guias/${novaGuia.id}`);
    } catch (err) {
      console.error("Erro ao criar guia:", err);
      toastUtil.error("Erro ao criar guia");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof GuiaCreateRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Atualizar convênio automaticamente quando selecionar paciente
    if (field === "pacienteId" && value) {
      const pacienteSelecionado = pacientes.find((p) => p.id === value);
      if (pacienteSelecionado) {
        setFormData((prev) => ({
          ...prev,
          convenioId: pacienteSelecionado.convenioId,
        }));
      }
    }
  };

  const addEspecialidade = () => {
    if (
      especialidadeInput.trim() &&
      !formData.especialidades.includes(especialidadeInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        especialidades: [...prev.especialidades, especialidadeInput.trim()],
      }));
      setEspecialidadeInput("");

      // Limpar erro de especialidades
      if (formErrors.especialidades) {
        setFormErrors((prev) => ({ ...prev, especialidades: "" }));
      }
    }
  };

  const removeEspecialidade = (especialidade: string) => {
    setFormData((prev) => ({
      ...prev,
      especialidades: prev.especialidades.filter((e) => e !== especialidade),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando dados..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
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
                  <FileText className="mr-2 h-6 w-6" />
                  Nova Guia
                </h1>
                <p className="text-gray-600 mt-1">
                  Preencha os dados para criar uma nova guia
                </p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Paciente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paciente *
                  </label>
                  <select
                    required
                    value={formData.pacienteId}
                    onChange={(e) =>
                      handleInputChange("pacienteId", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.pacienteId
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}>
                    <option value="">Selecione o paciente</option>
                    {pacientes.map((paciente) => (
                      <option key={paciente.id} value={paciente.id}>
                        {paciente.nome} - {paciente.convenioNome}
                      </option>
                    ))}
                  </select>
                  {formErrors.pacienteId && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.pacienteId}
                    </p>
                  )}
                </div>

                {/* Número da Guia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da Guia
                  </label>
                  <input
                    type="text"
                    value={formData.numeroGuia}
                    onChange={(e) =>
                      handleInputChange("numeroGuia", e.target.value)
                    }
                    placeholder="Número da guia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Convênio (read-only quando paciente selecionado) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Convênio *
                  </label>
                  <select
                    required
                    value={formData.convenioId}
                    onChange={(e) =>
                      handleInputChange("convenioId", e.target.value)
                    }
                    disabled={!!formData.pacienteId}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.convenioId
                        ? "border-red-500"
                        : "border-gray-300"
                    } ${!!formData.pacienteId ? "bg-gray-100" : ""}`}>
                    <option value="">Selecione o convênio</option>
                    {convenios.map((convenio) => (
                      <option key={convenio.id} value={convenio.id}>
                        {convenio.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.convenioId && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.convenioId}
                    </p>
                  )}
                </div>
              </div>

              {/* Especialidades */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidades *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={especialidadeInput}
                    onChange={(e) => setEspecialidadeInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addEspecialidade())
                    }
                    placeholder="Digite uma especialidade"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <CustomButton
                    type="button"
                    variant="primary"
                    onClick={addEspecialidade}>
                    <Plus className="h-4 w-4" />
                  </CustomButton>
                </div>

                {formData.especialidades.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.especialidades.map((esp, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {esp}
                        <button
                          type="button"
                          onClick={() => removeEspecialidade(esp)}
                          className="ml-2 text-blue-600 hover:text-blue-800">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {formErrors.especialidades && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.especialidades}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Quantidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade *
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
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {(i + 1).toString().padStart(2, "0")}
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

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valorReais}
                    onChange={(e) =>
                      handleInputChange(
                        "valorReais",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.valorReais
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.valorReais && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.valorReais}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Validade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Validade *
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

                {/* Status*/}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <StatusSelect
                    value={formData.status}
                    onChange={handleStatusChange}
                    required
                    showPreview={true}
                    className={formErrors.status ? "border-red-500" : ""}
                    placeholder="Selecione um status"
                  />
                  {formErrors.status && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.status}
                    </p>
                  )}
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <CustomButton
                  type="button"
                  variant="primary"
                  onClick={() => router.back()}>
                  Cancelar
                </CustomButton>
                <CustomButton type="submit" variant="primary" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Criar Guia"}
                </CustomButton>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
