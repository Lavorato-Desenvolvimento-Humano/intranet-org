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
  PacienteSummaryDto,
} from "@/types/clinical";
import { formatDate } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

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
  });

  // Estados para especialidades
  const [especialidadeInput, setEspecialidadeInput] = useState("");

  // Estados de validação
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

      // Preencher formulário com dados da guia
      setFormData({
        especialidades: [...guiaData.especialidades],
        quantidadeAutorizada: guiaData.quantidadeAutorizada,
        mes: guiaData.mes,
        ano: guiaData.ano,
        validade: guiaData.validade,
        lote: guiaData.lote || "",
        valorReais: guiaData.valorReais,
      });
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar informações da guia");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.especialidades || formData.especialidades.length === 0) {
      errors.especialidades = "Pelo menos uma especialidade é obrigatória";
    }

    if (!formData.quantidadeAutorizada || formData.quantidadeAutorizada < 1) {
      errors.quantidadeAutorizada = "Quantidade deve ser maior que zero";
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

    if ((formData.valorReais || 0) < 0) {
      errors.valorReais = "Valor não pode ser negativo";
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

      await guiaService.updateGuia(guiaId, formData);

      toastUtil.success("Guia atualizada com sucesso!");
      router.push(`/guias/${guiaId}`);
    } catch (err) {
      console.error("Erro ao atualizar guia:", err);
      toastUtil.error("Erro ao atualizar guia");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof GuiaUpdateRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addEspecialidade = () => {
    if (
      especialidadeInput.trim() &&
      !(formData.especialidades || []).includes(especialidadeInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        especialidades: [
          ...(prev.especialidades || []),
          especialidadeInput.trim(),
        ],
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
      especialidades: (prev.especialidades || []).filter(
        (e) => e !== especialidade
      ),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando dados da guia..." />
        </main>
      </div>
    );
  }

  if (error || !guia) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error || "Guia não encontrada"}
          </div>
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
                  Editar Guia #{guia.numeroGuia}
                </h1>
                <p className="text-gray-600 mt-1">
                  Edite as informações da guia
                </p>
              </div>
            </div>
          </div>

          {/* Informações não editáveis */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Informações não editáveis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                  <div>
                    <strong>Paciente:</strong> {guia.pacienteNome}
                  </div>
                  <div>
                    <strong>Convênio:</strong> {guia.convenioNome}
                  </div>
                  <div>
                    <strong>Número da Guia:</strong> {guia.numeroGuia}
                  </div>
                </div>
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

                {(formData.especialidades || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(formData.especialidades || []).map((esp, index) => (
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
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </CustomButton>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
