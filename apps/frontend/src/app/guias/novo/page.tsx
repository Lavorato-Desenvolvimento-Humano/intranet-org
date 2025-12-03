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
import { GuiaCreateRequest, PacienteSummaryDto } from "@/types/clinical";
import toastUtil from "@/utils/toast";
import { StatusSelect } from "@/components/clinical/ui/StatusSelect";
import { useStatus } from "@/hooks/useStatus";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

// Interface auxiliar para o item sendo adicionado
interface TempItem {
  especialidade: string;
  quantidade: number;
}

export default function NovaGuiaPage() {
  const router = useRouter();
  const { statuses } = useStatus();

  // Estados principais
  const [pacientes, setPacientes] = useState<PacienteSummaryDto[]>([]);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<GuiaCreateRequest>({
    pacienteId: "",
    numeroGuia: "",
    numeroVenda: "",
    status: "",
    itens: [], // Agora usamos itens
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

  // Estado para o novo item sendo adicionado
  const [newItem, setNewItem] = useState<TempItem>({
    especialidade: "",
    quantidade: 10, // Valor padrão sugerido
  });

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
    "Terapia ABA",
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
        pacienteService.getAllPacientes(0, 1000),
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

    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }

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

  // --- Lógica para adicionar Item (Especialidade + Quantidade) ---
  const addItem = () => {
    if (newItem.especialidade.trim() && newItem.quantidade > 0) {
      // Verifica se já existe essa especialidade
      const exists = formData.itens.some(
        (item) => item.especialidade === newItem.especialidade
      );

      if (exists) {
        toastUtil.error("Esta especialidade já foi adicionada.");
        return;
      }

      // --- CORREÇÃO: Mapeia para o formato que o Backend espera ---
      const itemParaSalvar = {
        especialidade: newItem.especialidade,
        quantidadeAutorizada: newItem.quantidade, // Muda de 'quantidade' para 'quantidadeAutorizada'
      };

      setFormData((prev) => ({
        ...prev,
        itens: [...prev.itens, itemParaSalvar], // Usa o objeto corrigido
      }));
      // -----------------------------------------------------------

      // Resetar input mantendo uma quantidade padrão
      setNewItem({ especialidade: "", quantidade: 10 });

      if (formErrors.itens) {
        setFormErrors((prev) => ({ ...prev, itens: "" }));
      }
    }
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.pacienteId) errors.pacienteId = "Paciente é obrigatório";
    if (!formData.numeroGuia.trim())
      errors.numeroGuia = "Número da guia é obrigatório";
    if (!formData.status) errors.status = "Status é obrigatório";

    // Validação da lista de itens
    if (formData.itens.length === 0) {
      errors.itens =
        "Pelo menos uma especialidade com quantidade deve ser adicionada";
    }

    if (!formData.convenioId) errors.convenioId = "Convênio é obrigatório";
    if (!formData.validade) errors.validade = "Data de validade é obrigatória";

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
        // itens já está no formato correto {especialidade, quantidade}
      };

      const novaGuia = await guiaService.createGuia(guiaData);
      toastUtil.success("Guia criada com sucesso!");
      router.push(`/guias/${novaGuia.id}`);
    } catch (err) {
      console.error("Erro ao criar guia:", err);
      toastUtil.error(
        "Erro ao criar guia. Verifique se os dados estão corretos."
      );
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
                  Preencha os dados e adicione as especialidades com suas
                  quantidades
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
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paciente *
                    </label>

                    <SearchableSelect
                      placeholder="Digite o nome do paciente..."
                      value={formData.pacienteId}
                      onChange={(novoId) =>
                        handleInputChange("pacienteId", novoId)
                      }
                      options={pacientes.map((p) => ({
                        value: p.id,
                        label: `${p.nome} - ${p.convenioNome}`,
                      }))}
                    />

                    {formErrors.pacienteId && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.pacienteId}
                      </p>
                    )}
                  </div>
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

                {/* Número da Venda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da Venda *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroVenda}
                    onChange={(e) =>
                      handleInputChange(
                        "numeroVenda",
                        e.target.value.toUpperCase()
                      )
                    }
                    placeholder="Ex: V123-456"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.numeroVenda
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.numeroVenda && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.numeroVenda}
                    </p>
                  )}
                </div>
              </div>

              {/* SEÇÃO DE ESPECIALIDADES E QUANTIDADES */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidades e Quantidades *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Adicione cada especialidade coberta por esta guia e a
                  quantidade autorizada para ela.
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
                            !formData.itens.some(
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
                {formData.itens.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {formData.itens.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-white border border-blue-200 rounded-md shadow-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-blue-900">
                            {item.especialidade}
                          </span>
                          <span className="text-xs text-gray-500">
                            Qtd: {item.quantidadeAutorizada}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Remover">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white border border-dashed border-gray-300 rounded-md text-gray-400 text-sm">
                    Nenhuma especialidade adicionada ainda.
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
                {/* Valor em Reais */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Total (R$)
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
                    Mês de Referência *
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
                    Ano de Referência *
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
                  Data de Validade da Guia *
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
                  Status Inicial *
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
