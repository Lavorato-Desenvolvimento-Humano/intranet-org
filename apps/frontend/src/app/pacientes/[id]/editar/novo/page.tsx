// apps/frontend/src/app/pacientes/[id]/editar/novo/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Users, Copy, AlertCircle, Info } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { pacienteService } from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import {
  PacienteDto,
  PacienteCreateRequest,
  UnidadeEnum,
} from "@/types/clinical";
import toastUtil from "@/utils/toast";

export default function NovoPacienteBasePage() {
  const router = useRouter();
  const params = useParams();
  const basePacienteId = params.id as string;

  // Estados principais
  const [basePaciente, setBasePaciente] = useState<PacienteDto | null>(null);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState<PacienteCreateRequest>({
    nome: "",
    dataNascimento: "",
    responsavel: "",
    convenioId: "",
    unidade: UnidadeEnum.KIDS,
  });

  // Estados de validação
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Carregar dados iniciais
  useEffect(() => {
    if (basePacienteId) {
      loadInitialData();
    }
  }, [basePacienteId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pacienteData, conveniosData] = await Promise.all([
        pacienteService.getPacienteById(basePacienteId),
        convenioService.getAllConvenios(),
      ]);

      setBasePaciente(pacienteData);
      setConvenios(conveniosData);

      // Preencher formulário com dados base (exceto nome e data de nascimento)
      setFormData({
        nome: "", // Deixar vazio para o usuário preencher
        dataNascimento: "", // Deixar vazio para o usuário preencher
        responsavel: pacienteData.responsavel || "",
        convenioId: pacienteData.convenioId,
        unidade: pacienteData.unidade,
      });
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar informações do paciente base");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nome?.trim()) {
      errors.nome = "Nome é obrigatório";
    }

    if (!formData.dataNascimento) {
      errors.dataNascimento = "Data de nascimento é obrigatória";
    } else {
      const birthDate = new Date(formData.dataNascimento);
      const today = new Date();
      if (birthDate > today) {
        errors.dataNascimento = "Data de nascimento não pode ser futura";
      }
    }

    if (!formData.convenioId) {
      errors.convenioId = "Convênio é obrigatório";
    }

    if (!formData.unidade) {
      errors.unidade = "Unidade é obrigatória";
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

      const novoPaciente = await pacienteService.createPaciente(formData);

      toastUtil.success("Novo paciente criado com sucesso!");
      router.push(`/pacientes/${novoPaciente.id}`);
    } catch (err) {
      console.error("Erro ao criar paciente:", err);
      toastUtil.error("Erro ao criar novo paciente");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof PacienteCreateRequest,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const copyFromBase = (field: keyof PacienteCreateRequest) => {
    if (!basePaciente) return;

    let value: any;
    switch (field) {
      case "responsavel":
        value = basePaciente.responsavel || "";
        break;
      case "convenioId":
        value = basePaciente.convenioId;
        break;
      case "unidade":
        value = basePaciente.unidade;
        break;
      default:
        return;
    }

    handleInputChange(field, value);
    toastUtil.success(
      `${field === "convenioId" ? "Convênio" : field === "responsavel" ? "Responsável" : "Unidade"} copiado do paciente base`
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando informações do paciente base..." />
        </main>
      </div>
    );
  }

  if (error || !basePaciente) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error || "Paciente base não encontrado"}
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
                  <Copy className="mr-2 h-6 w-6" />
                  Novo Paciente
                </h1>
                <p className="text-gray-600 mt-1">
                  Baseado em: {basePaciente.nome}
                </p>
              </div>
            </div>
          </div>

          {/* Informações do paciente base */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Informações do Paciente Base
                </h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>
                    <strong>Nome:</strong> {basePaciente.nome}
                  </p>
                  <p>
                    <strong>Data de Nascimento:</strong>{" "}
                    {formatDate(basePaciente.dataNascimento)}
                  </p>
                  <p>
                    <strong>Convênio:</strong> {basePaciente.convenioNome}
                  </p>
                  <p>
                    <strong>Unidade:</strong> {basePaciente.unidade}
                  </p>
                  {basePaciente.responsavel && (
                    <p>
                      <strong>Responsável:</strong> {basePaciente.responsavel}
                    </p>
                  )}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Os campos responsável, convênio e unidade já foram preenchidos
                  com base neste paciente. Você pode alterar conforme
                  necessário.
                </p>
              </div>
            </div>
          </div>

          {/* Formulário de criação */}
          <div className="bg-white rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna esquerda */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Dados Pessoais do Novo Paciente
                  </h3>

                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) =>
                        handleInputChange("nome", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                        formErrors.nome
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      placeholder="Digite o nome completo do novo paciente"
                    />
                    {formErrors.nome && (
                      <div className="flex items-center mt-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.nome}
                      </div>
                    )}
                  </div>

                  {/* Data de Nascimento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      value={formData.dataNascimento}
                      onChange={(e) =>
                        handleInputChange("dataNascimento", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                        formErrors.dataNascimento
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                    {formErrors.dataNascimento && (
                      <div className="flex items-center mt-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.dataNascimento}
                      </div>
                    )}
                  </div>

                  {/* Responsável */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Responsável
                      </label>
                      <CustomButton
                        type="button"
                        variant="primary"
                        size="small"
                        onClick={() => copyFromBase("responsavel")}
                        className="text-xs">
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </CustomButton>
                    </div>
                    <input
                      type="text"
                      value={formData.responsavel}
                      onChange={(e) =>
                        handleInputChange("responsavel", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nome do responsável (opcional)"
                    />
                  </div>
                </div>

                {/* Coluna direita */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Informações do Sistema
                  </h3>

                  {/* Convênio */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Convênio *
                      </label>
                      <CustomButton
                        type="button"
                        variant="primary"
                        size="small"
                        onClick={() => copyFromBase("convenioId")}
                        className="text-xs">
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </CustomButton>
                    </div>
                    <select
                      value={formData.convenioId}
                      onChange={(e) =>
                        handleInputChange("convenioId", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                        formErrors.convenioId
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}>
                      <option value="">Selecione o convênio</option>
                      {convenios.map((convenio) => (
                        <option key={convenio.id} value={convenio.id}>
                          {convenio.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.convenioId && (
                      <div className="flex items-center mt-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.convenioId}
                      </div>
                    )}
                  </div>

                  {/* Unidade */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Unidade *
                      </label>
                      <CustomButton
                        type="button"
                        variant="primary"
                        size="small"
                        onClick={() => copyFromBase("unidade")}
                        className="text-xs">
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </CustomButton>
                    </div>
                    <select
                      value={formData.unidade}
                      onChange={(e) =>
                        handleInputChange(
                          "unidade",
                          e.target.value as UnidadeEnum
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${
                        formErrors.unidade
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}>
                      <option value="">Selecione a unidade</option>
                      <option value={UnidadeEnum.KIDS}>Kids</option>
                      <option value={UnidadeEnum.SENIOR}>Senior</option>
                    </select>
                    {formErrors.unidade && (
                      <div className="flex items-center mt-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.unidade}
                      </div>
                    )}
                  </div>

                  {/* Ações rápidas */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Ações Rápidas
                    </h4>

                    <div className="space-y-2">
                      <CustomButton
                        type="button"
                        variant="primary"
                        size="small"
                        onClick={() => {
                          copyFromBase("responsavel");
                          copyFromBase("convenioId");
                          copyFromBase("unidade");
                        }}
                        className="w-full text-sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Todos os Dados do Paciente Base
                      </CustomButton>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Isto copiará responsável, convênio e unidade do paciente
                      base.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
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
                      Criando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Criar Novo Paciente
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
