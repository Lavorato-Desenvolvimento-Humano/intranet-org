"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, FileText, Plus, X, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { guiaService, pacienteService } from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import {
  GuiaCreateRequest,
  PacienteSummaryDto,
  GuiaDto,
} from "@/types/clinical";
import toastUtil from "@/utils/toast";
import { StatusSelect } from "@/components/clinical/ui/StatusSelect";
import { useStatus } from "@/hooks/useStatus";

export default function NovaGuiaPage() {
  const router = useRouter();
  const { statuses } = useStatus();

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
    status: "",
    especialidades: [],
    quantidadeAutorizada: 1,
    convenioId: "",
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    validade: "",
    lote: "",
    quantidadeFaturada: 0,
    valorReais: 0,
  });

  // Estados de validação e UI
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [especialidadeInput, setEspecialidadeInput] = useState("");

  // Lista de especialidades padronizadas
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
  ];

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pacientesData, conveniosData] = await Promise.all([
        pacienteService.getAllPacientes(),
        convenioService.getAllConvenios(),
      ]);

      setPacientes(pacientesData.content);
      setConvenios(conveniosData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar dados necessários");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setFormData((prev) => ({ ...prev, status: newStatus }));
    if (formErrors.status) {
      setFormErrors((prev) => ({ ...prev, status: "" }));
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

  const removeEspecialidade = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      especialidades: prev.especialidades.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.pacienteId) {
      errors.pacienteId = "Paciente é obrigatório";
    }

    if (!formData.numeroGuia.trim()) {
      errors.numeroGuia = "Número da guia é obrigatório";
    }

    if (!formData.status) {
      errors.status = "Status é obrigatório";
    }

    if (formData.especialidades.length === 0) {
      errors.especialidades = "Pelo menos uma especialidade é obrigatória";
    }

    if (!formData.quantidadeAutorizada || formData.quantidadeAutorizada <= 0) {
      errors.quantidadeAutorizada =
        "Quantidade autorizada deve ser maior que zero";
    }

    if (!formData.convenioId) {
      errors.convenioId = "Convênio é obrigatório";
    }

    if (!formData.validade) {
      errors.validade = "Data de validade é obrigatória";
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

      const guiaData: GuiaCreateRequest = {
        ...formData,
        valorReais: Number(formData.valorReais),
      };

      const novaGuia = await guiaService.createGuia(guiaData);
      toastUtil.success("Guia criada com sucesso!");
      router.push(`/guias/${novaGuia.id}`);
    } catch (err) {
      console.error("Erro ao criar guia:", err);
      toastUtil.error("Erro ao criar guia");
    } finally {
      setSaving(false);
    }
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

                {/* Convênio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Convênio *
                    {formData.pacienteId && (
                      <span className="text-xs text-gray-500 ml-1">
                        (definido pelo paciente)
                      </span>
                    )}
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
                    } ${
                      formData.pacienteId
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}>
                    <option value="">
                      {formData.pacienteId
                        ? "Convênio será definido pelo paciente"
                        : "Selecione o convênio"}
                    </option>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Número da Guia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da Guia *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numeroGuia}
                    onChange={(e) =>
                      handleInputChange(
                        "numeroGuia",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Ex: G123-456"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.numeroGuia
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.numeroGuia && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.numeroGuia}
                    </p>
                  )}
                </div>

                {/* Quantidade Autorizada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade Autorizada *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="999"
                    value={formData.quantidadeAutorizada}
                    onChange={(e) =>
                      handleInputChange(
                        "quantidadeAutorizada",
                        parseInt(e.target.value) || 1
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
              </div>

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
                      .filter((esp) => !formData.especialidades.includes(esp))
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

                {/* Lista de especialidades */}
                {formData.especialidades.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.especialidades.map((especialidade, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {especialidade}
                        <button
                          type="button"
                          onClick={() => removeEspecialidade(index)}
                          className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valor em Reais */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="999999.99"
                    value={formData.valorReais}
                    onChange={(e) =>
                      handleInputChange(
                        "valorReais",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0,00"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        {String(i + 1).padStart(2, "0")} -{" "}
                        {new Date(0, i).toLocaleString("pt-BR", {
                          month: "long",
                        })}
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
                  <select
                    required
                    value={formData.ano}
                    onChange={(e) =>
                      handleInputChange("ano", parseInt(e.target.value))
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.ano ? "border-red-500" : "border-gray-300"
                    }`}>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i - 1;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                  {formErrors.ano && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.ano}
                    </p>
                  )}
                </div>
              </div>

              {/* DATA DE VALIDADE */}
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

              {/* STATUS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <StatusSelect
                  value={formData.status}
                  onChange={handleStatusChange}
                  required
                  showPreview={true}
                  className={formErrors.status ? "border-red-500" : ""}
                />
                {formErrors.status && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.status}
                  </p>
                )}
              </div>

              {/* ===== BOTÕES DE AÇÃO ===== */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <CustomButton
                  type="button"
                  variant="primary"
                  onClick={() => router.back()}
                  disabled={saving}>
                  Cancelar
                </CustomButton>
                <CustomButton type="submit" variant="primary" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Criar Guia
                    </>
                  )}
                </CustomButton>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
