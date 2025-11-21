"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, FileSignature, Save, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import {
  fichaService,
  guiaService,
  pacienteService,
} from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import {
  FichaCreateRequest,
  FichaAssinaturaCreateRequest,
  GuiaSummaryDto,
  PacienteSummaryDto,
  TipoFichaEnum,
  FichaDto,
} from "@/types/clinical";
import toastUtil from "@/utils/toast";
import { StatusSelect } from "@/components/clinical/ui/StatusSelect";
import { useStatus } from "@/hooks/useStatus";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

interface FormData {
  tipoFicha: TipoFichaEnum;
  guiaId: string;
  pacienteId: string;
  especialidade: string;
  quantidadeAutorizada: number;
  convenioId: string;
  mes: number;
  ano: number;
  status: string;
}

interface FormErrors {
  [key: string]: string;
}

function NovaFichaContent() {
  const router = useRouter();
  const { statuses } = useStatus();

  // Verificar parâmetros de duplicação de forma segura
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  // Verificar parâmetros na montagem do componente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const duplicate = urlParams.get("duplicate");
      setDuplicateId(duplicate);
    }
  }, []);

  // Estados principais
  const [formData, setFormData] = useState<FormData>({
    tipoFicha: TipoFichaEnum.COM_GUIA,
    guiaId: "",
    pacienteId: "",
    especialidade: "",
    quantidadeAutorizada: 1,
    convenioId: "",
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    status: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [guias, setGuias] = useState<GuiaSummaryDto[]>([]);
  const [pacientes, setPacientes] = useState<PacienteSummaryDto[]>([]);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [ficha, setFicha] = useState<FichaDto | null>(null);

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
  ];

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar dados para duplicação
  useEffect(() => {
    if (duplicateId) {
      loadFichaForDuplication(duplicateId);
    }
  }, [duplicateId]);

  useEffect(() => {
    if (statuses.length > 0 && !formData.status) {
      const statusPadrao =
        statuses.find((s) => s.status === "EMITIDO") || statuses[0];
      setFormData((prev) => ({ ...prev, status: statusPadrao.status }));
    }
  }, [statuses]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);

      const [guiasData, pacientesData, conveniosData] = await Promise.all([
        guiaService.getAllGuias(0, 1000),
        pacienteService.getAllPacientes(0, 1000),
        convenioService.getAllConvenios(),
      ]);

      setGuias(guiasData.content);
      setPacientes(pacientesData.content);
      setConvenios(conveniosData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toastUtil.error("Erro ao carregar dados do formulário");
    } finally {
      setLoadingData(false);
    }
  };

  const loadFichaForDuplication = async (fichaId: string) => {
    try {
      const ficha = await fichaService.getFichaById(fichaId);

      setFormData((prev) => ({
        ...prev,
        tipoFicha: ficha.tipoFicha,
        guiaId: ficha.guiaId || "",
        pacienteId: ficha.pacienteId || "",
        especialidade: ficha.especialidade,
        quantidadeAutorizada: ficha.quantidadeAutorizada,
        convenioId: ficha.convenioId,
        mes: ficha.mes,
        ano: ficha.ano,
      }));

      toastUtil.info("Dados carregados para duplicação");
    } catch (err) {
      console.error("Erro ao carregar ficha para duplicação:", err);
      toastUtil.error("Erro ao carregar dados da ficha");
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setFormData((prev) => ({ ...prev, status: newStatus }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors.status) {
      setFormErrors((prev) => ({ ...prev, status: "" }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Atualizar convênio automaticamente baseado na guia ou paciente
    if (field === "guiaId" && value) {
      const guia = guias.find((g) => g.id === value);
      if (guia) {
        setFormData((prev) => ({
          ...prev,
          pacienteId: "", // Resetar paciente quando guia for selecionada
          convenioId: "", // Será atualizado pela guia
        }));
      }
    } else if (field === "pacienteId" && value) {
      const paciente = pacientes.find((p) => p.id === value);
      if (paciente) {
        setFormData((prev) => ({
          ...prev,
          convenioId: paciente.convenioId,
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (formData.tipoFicha === TipoFichaEnum.COM_GUIA) {
      if (!formData.guiaId) {
        errors.guiaId = "Guia é obrigatória";
      }
    } else {
      if (!formData.pacienteId) {
        errors.pacienteId = "Paciente é obrigatório";
      }
    }

    if (!formData.especialidade) {
      errors.especialidade = "Especialidade é obrigatória";
    }

    if (!formData.quantidadeAutorizada || formData.quantidadeAutorizada <= 0) {
      errors.quantidadeAutorizada = "Quantidade deve ser maior que zero";
    }

    if (!formData.convenioId) {
      errors.convenioId = "Convênio é obrigatório";
    }

    if (!formData.mes || formData.mes < 1 || formData.mes > 12) {
      errors.mes = "Mês deve estar entre 1 e 12";
    }

    if (!formData.ano || formData.ano < 2020) {
      errors.ano = "Ano deve ser válido";
    }

    // ✅ Adicionar validação de status
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
      setLoading(true);

      let novaFicha: FichaDto;

      if (formData.tipoFicha === TipoFichaEnum.COM_GUIA) {
        const request: FichaCreateRequest = {
          guiaId: formData.guiaId,
          especialidade: formData.especialidade,
          quantidadeAutorizada: formData.quantidadeAutorizada,
          convenioId: formData.convenioId,
          mes: formData.mes,
          ano: formData.ano,
          status: formData.status,
        };

        novaFicha = await fichaService.createFicha(request);
      } else {
        const request: FichaAssinaturaCreateRequest = {
          pacienteId: formData.pacienteId,
          especialidade: formData.especialidade,
          quantidadeAutorizada: formData.quantidadeAutorizada,
          convenioId: formData.convenioId,
          mes: formData.mes,
          ano: formData.ano,
          status: formData.status,
        };

        novaFicha = await fichaService.createFichaAssinatura(request);
      }

      toastUtil.success("Ficha criada com sucesso!");
      router.push(`/fichas/${novaFicha.id}`);
    } catch (err: any) {
      console.error("Erro ao criar ficha:", err);
      toastUtil.error(err.response?.data?.message || "Erro ao criar ficha");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loadingData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando dados..." />
          </main>
        </div>
      </ProtectedRoute>
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
                onClick={handleCancel}
                className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </CustomButton>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <FileSignature className="mr-2 h-6 w-6" />
                  {duplicateId ? "Duplicar Ficha" : "Nova Ficha"}
                </h1>
                <p className="text-gray-600 mt-1">
                  Preencha os dados para criar uma nova ficha
                </p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Tipo de Ficha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Ficha *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tipoFicha"
                      value={TipoFichaEnum.COM_GUIA}
                      checked={formData.tipoFicha === TipoFichaEnum.COM_GUIA}
                      onChange={(e) =>
                        handleInputChange(
                          "tipoFicha",
                          e.target.value as TipoFichaEnum
                        )
                      }
                      className="mr-2"
                    />
                    Com Guia
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tipoFicha"
                      value={TipoFichaEnum.ASSINATURA}
                      checked={formData.tipoFicha === TipoFichaEnum.ASSINATURA}
                      onChange={(e) =>
                        handleInputChange(
                          "tipoFicha",
                          e.target.value as TipoFichaEnum
                        )
                      }
                      className="mr-2"
                    />
                    Assinatura
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Guia (apenas se tipo COM_GUIA) */}
                {formData.tipoFicha === TipoFichaEnum.COM_GUIA && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guia *
                    </label>
                    <select
                      required
                      value={formData.guiaId}
                      onChange={(e) =>
                        handleInputChange("guiaId", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        formErrors.guiaId ? "border-red-500" : "border-gray-300"
                      }`}>
                      <option value="">Selecione uma guia</option>
                      {guias.map((guia) => (
                        <option key={guia.id} value={guia.id}>
                          #{guia.numeroGuia} - {guia.pacienteNome} (
                          {guia.convenioNome})
                        </option>
                      ))}
                    </select>
                    {formErrors.guiaId && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.guiaId}
                      </p>
                    )}
                  </div>
                )}

                {/* Paciente (apenas se tipo ASSINATURA) */}
                {formData.tipoFicha === TipoFichaEnum.ASSINATURA && (
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
                    {/* <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <option value="">Selecione um paciente</option>
                      {pacientes.map((paciente) => (
                        <option key={paciente.id} value={paciente.id}>
                          {paciente.nome} ({paciente.convenioNome})
                        </option>
                      ))}
                    </select> */}
                    {formErrors.pacienteId && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.pacienteId}
                      </p>
                    )}
                  </div>
                )}

                {/* Especialidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especialidade *
                  </label>
                  <select
                    required
                    value={formData.especialidade}
                    onChange={(e) =>
                      handleInputChange("especialidade", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.especialidade
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}>
                    <option value="">Selecione uma especialidade</option>
                    {especialidades.map((esp) => (
                      <option key={esp} value={esp}>
                        {esp}
                      </option>
                    ))}
                  </select>
                  {formErrors.especialidade && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.especialidade}
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
                    value={formData.quantidadeAutorizada}
                    onChange={(e) =>
                      handleInputChange(
                        "quantidadeAutorizada",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.quantidadeAutorizada
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.quantidadeAutorizada && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.quantidadeAutorizada}
                    </p>
                  )}
                </div>

                {/* Convênio */}
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.convenioId
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}>
                    <option value="">Selecione um convênio</option>
                    {convenios.map((convenio) => (
                      <option key={convenio.id} value={convenio.id}>
                        {convenio.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.convenioId && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.convenioId}
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
                    <p className="mt-1 text-sm text-red-600">
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
                    required
                    min="2020"
                    max="2030"
                    value={formData.ano}
                    onChange={(e) =>
                      handleInputChange("ano", parseInt(e.target.value) || 0)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      formErrors.ano ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.ano && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.ano}
                    </p>
                  )}
                </div>

                {/* Status - Campo completo */}
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
                    placeholder="Selecione um status"
                  />
                  {formErrors.status && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.status}
                    </p>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <CustomButton
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={loading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </CustomButton>
                <CustomButton
                  type="submit"
                  variant="primary"
                  disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {duplicateId ? "Duplicar Ficha" : "Criar Ficha"}
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

// Componente principal que envolve o conteúdo em Suspense
export default function NovaFichaPage() {
  return (
    <Suspense
      fallback={
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto p-6">
              <Loading message="Carregando página..." />
            </main>
          </div>
        </ProtectedRoute>
      }>
      <NovaFichaContent />
    </Suspense>
  );
}
