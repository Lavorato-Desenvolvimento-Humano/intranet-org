"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  FileBarChart,
  Calendar,
  Filter,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import relatorioService from "@/services/relatorio";
import convenioService, { ConvenioDto } from "@/services/convenio";
import { pacienteService, especialidadeService } from "@/services/clinical";
import { useAuth } from "@/context/AuthContext";
import { useStatus } from "@/hooks/useStatus";
import {
  RelatorioCreateRequest,
  RelatorioDto,
  RelatorioTipo,
} from "@/types/relatorio";
import { PacienteSummaryDto, EspecialidadeDto } from "@/types/clinical";
import toastUtil from "@/utils/toast";

interface FormData {
  titulo: string;
  descricao: string;
  periodoInicio: string;
  periodoFim: string;
  usuarioResponsavelId: string;
  status: string[];
  especialidades: string[];
  convenioIds: string[];
  unidades: string[];
  tipoEntidade: string;
  incluirGraficos: boolean;
  incluirEstatisticas: boolean;
  formatoSaida: string;
  tipoRelatorio: RelatorioTipo;
}

interface FormErrors {
  [key: string]: string;
}

export default function NovoRelatorioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { statuses } = useStatus();

  // Estados principais
  const [formData, setFormData] = useState<FormData>({
    titulo: "",
    descricao: "",
    periodoInicio: "",
    periodoFim: "",
    usuarioResponsavelId: "",
    status: [],
    especialidades: [],
    convenioIds: [],
    unidades: [],
    tipoEntidade: "TODOS",
    incluirGraficos: true,
    incluirEstatisticas: true,
    formatoSaida: "PDF",
    tipoRelatorio: RelatorioTipo.ESTADO_ATUAL,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Dados auxiliares
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [usuarios, setUsuarios] = useState<PacienteSummaryDto[]>([]);
  const [listaEspecialidades, setListaEspecialidades] = useState<
    EspecialidadeDto[]
  >([]);

  // Opções disponíveis
  // const especialidades = [
  //   "Fisioterapia",
  //   "Fonoaudiologia",
  //   "Terapia Ocupacional",
  //   "Psicologia",
  //   "Nutrição",
  //   "Psicopedagogia",
  //   "Psicomotricidade",
  // ];

  const unidadesOptions = [
    { value: "KIDS", label: "KIDS" },
    { value: "SENIOR", label: "SENIOR" },
  ];

  const tipoEntidadeOptions = [
    { value: "TODOS", label: "Todos os tipos" },
    { value: "GUIA", label: "Apenas Guias" },
    { value: "FICHA", label: "Apenas Fichas" },
    { value: "PACIENTE", label: "Apenas Pacientes" },
  ];

  const formatoSaidaOptions = [
    { value: "PDF", label: "PDF" },
    { value: "EXCEL", label: "Excel (futuro)" },
  ];

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingData(true);

        // Carregar convênios
        const [conveniosData, especialidadesData] = await Promise.all([
          convenioService.getAllConvenios(),
          especialidadeService.getAtivas(),
        ]);
        setConvenios(conveniosData);
        setListaEspecialidades(especialidadesData);

        // Definir período padrão (último mês)
        const hoje = new Date();
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

        setFormData((prev) => ({
          ...prev,
          periodoInicio: mesPassado.toISOString().split("T")[0],
          periodoFim: fimMesPassado.toISOString().split("T")[0],
          usuarioResponsavelId: user?.id || "",
        }));
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        toastUtil.error("Erro ao carregar dados do formulário");
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [user]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.titulo.trim()) {
      errors.titulo = "Título é obrigatório";
    }

    if (!formData.periodoInicio) {
      errors.periodoInicio = "Data de início é obrigatória";
    }

    if (!formData.periodoFim) {
      errors.periodoFim = "Data de fim é obrigatória";
    }

    if (formData.periodoInicio && formData.periodoFim) {
      const inicio = new Date(formData.periodoInicio);
      const fim = new Date(formData.periodoFim);

      if (inicio >= fim) {
        errors.periodoFim = "Data de fim deve ser posterior à data de início";
      }

      // Validar período máximo (ex: 1 ano)
      const diffTime = Math.abs(fim.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 365) {
        errors.periodoFim = "Período não pode ser maior que 1 ano";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo quando usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleArrayInputChange = (
    field: "status" | "especialidades" | "convenioIds" | "unidades",
    value: string,
    checked: boolean
  ) => {
    const currentArray = formData[field] as string[];

    if (checked) {
      handleInputChange(field, [...currentArray, value]);
    } else {
      handleInputChange(
        field,
        currentArray.filter((item) => item !== value)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toastUtil.error("Por favor, corrija os erros no formulário");
      return;
    }

    try {
      setLoading(true);

      const request: RelatorioCreateRequest = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || undefined,
        periodoInicio: new Date(formData.periodoInicio).toISOString(),
        periodoFim: new Date(formData.periodoFim + "T23:59:59").toISOString(),
        usuarioResponsavelId: formData.usuarioResponsavelId || undefined,
        status: formData.status.length > 0 ? formData.status : undefined,
        especialidades:
          formData.especialidades.length > 0
            ? formData.especialidades
            : undefined,
        convenioIds:
          formData.convenioIds.length > 0 ? formData.convenioIds : undefined,
        unidades: formData.unidades.length > 0 ? formData.unidades : undefined,
        tipoEntidade: formData.tipoEntidade,
        incluirGraficos: formData.incluirGraficos,
        incluirEstatisticas: formData.incluirEstatisticas,
        tipoRelatorio: formData.tipoRelatorio,
        formatoSaida: formData.formatoSaida,
      };

      const novoRelatorio = await relatorioService.gerarRelatorio(request);

      toastUtil.success("Relatório iniciado com sucesso!");
      router.push(`/relatorios/${novoRelatorio.id}`);
    } catch (error: any) {
      console.error("Erro ao criar relatório:", error);
      toastUtil.error(
        error.response?.data?.message || "Erro ao criar relatório"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando formulário..." />
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
                onClick={() => router.back()}
                className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </CustomButton>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <FileBarChart className="mr-2 h-6 w-6" />
                  Novo Relatório
                </h1>
                <p className="text-gray-600 mt-1">
                  Configure os parâmetros para gerar um novo relatório
                </p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* --- NOVO CAMPO: TIPO DE RELATÓRIO --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Relatório
              </label>
              <div className="flex gap-4">
                {/* Opção 1: Estado Atual */}
                <label
                  className={`flex items-center space-x-2 border p-3 rounded cursor-pointer flex-1 transition-colors ${formData.tipoRelatorio === "ESTADO_ATUAL" ? "bg-blue-50 border-blue-500" : "hover:bg-gray-50 border-gray-200"}`}>
                  <input
                    type="radio"
                    name="tipoRelatorio" // Importante para agrupar
                    value="ESTADO_ATUAL"
                    checked={formData.tipoRelatorio === "ESTADO_ATUAL"}
                    onChange={() =>
                      handleInputChange("tipoRelatorio", "ESTADO_ATUAL")
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <span className="font-bold block text-gray-800">
                      Estado Atual (Retrato)
                    </span>
                    <span className="text-xs text-gray-500">
                      Ex: Listar guias pendentes hoje, Fichas ativas.
                    </span>
                  </div>
                </label>

                {/* Opção 2: Histórico */}
                <label
                  className={`flex items-center space-x-2 border p-3 rounded cursor-pointer flex-1 transition-colors ${formData.tipoRelatorio === "HISTORICO_MUDANCAS" ? "bg-blue-50 border-blue-500" : "hover:bg-gray-50 border-gray-200"}`}>
                  <input
                    type="radio"
                    name="tipoRelatorio"
                    value="HISTORICO_MUDANCAS"
                    checked={formData.tipoRelatorio === "HISTORICO_MUDANCAS"}
                    onChange={() =>
                      handleInputChange("tipoRelatorio", "HISTORICO_MUDANCAS")
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <span className="font-bold block text-gray-800">
                      Auditoria (Histórico)
                    </span>
                    <span className="text-xs text-gray-500">
                      Ex: Quem alterou o status, quando e por que.
                    </span>
                  </div>
                </label>
              </div>
            </div>
            {/* ------------------------------------- */}

            {/* Informações Básicas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Informações Básicas
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título do Relatório *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) =>
                      handleInputChange("titulo", e.target.value)
                    }
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.titulo ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Ex: Relatório Mensal de Atendimentos"
                  />
                  {formErrors.titulo && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {formErrors.titulo}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Entidade
                  </label>
                  <select
                    value={formData.tipoEntidade}
                    onChange={(e) =>
                      handleInputChange("tipoEntidade", e.target.value)
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {tipoEntidadeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    handleInputChange("descricao", e.target.value)
                  }
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva o objetivo e contexto do relatório..."
                />
              </div>
            </div>

            {/* Período */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Período de Análise
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    value={formData.periodoInicio}
                    onChange={(e) =>
                      handleInputChange("periodoInicio", e.target.value)
                    }
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.periodoInicio
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.periodoInicio && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {formErrors.periodoInicio}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Fim *
                  </label>
                  <input
                    type="date"
                    value={formData.periodoFim}
                    onChange={(e) =>
                      handleInputChange("periodoFim", e.target.value)
                    }
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.periodoFim
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.periodoFim && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {formErrors.periodoFim}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Filtros de Dados
              </h2>

              {/* Status */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Status (Deixe vazio para incluir todos)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {statuses.map((status) => (
                    <label key={status.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.status.includes(status.status)}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "status",
                            status.status,
                            e.target.checked
                          )
                        }
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {status.status}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Especialidades */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Especialidades (Deixe vazio para incluir todas)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {listaEspecialidades.map((esp) => (
                    <label key={esp.id} className="flex items-center">
                      <input
                        type="checkbox"
                        // Verifica se o NOME está no array de selecionados
                        checked={formData.especialidades.includes(esp.nome)}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "especialidades",
                            esp.nome, // Salva o nome
                            e.target.checked
                          )
                        }
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{esp.nome}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Convênios */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Convênios (Deixe vazio para incluir todos)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {convenios.map((convenio) => (
                    <label key={convenio.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.convenioIds.includes(convenio.id)}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "convenioIds",
                            convenio.id,
                            e.target.checked
                          )
                        }
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {convenio.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Unidades */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Unidades (Deixe vazio para incluir todas)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {unidadesOptions.map((unidade) => (
                    <label key={unidade.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.unidades.includes(unidade.value)}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "unidades",
                            unidade.value,
                            e.target.checked
                          )
                        }
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {unidade.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Configurações do Relatório
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Formato de Saída
                  </label>
                  <select
                    value={formData.formatoSaida}
                    onChange={(e) =>
                      handleInputChange("formatoSaida", e.target.value)
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {formatoSaidaOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.incluirGraficos}
                      onChange={(e) =>
                        handleInputChange("incluirGraficos", e.target.checked)
                      }
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Incluir Gráficos
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.incluirEstatisticas}
                      onChange={(e) =>
                        handleInputChange(
                          "incluirEstatisticas",
                          e.target.checked
                        )
                      }
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Incluir Estatísticas
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4">
              <CustomButton
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}>
                Cancelar
              </CustomButton>

              <CustomButton
                type="submit"
                variant="primary"
                disabled={loading}
                className="min-w-32">
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </>
                )}
              </CustomButton>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
