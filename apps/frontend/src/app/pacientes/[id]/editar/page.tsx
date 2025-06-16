"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Users,
  Calendar,
  Building,
  FileText,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { pacienteService } from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import {
  PacienteDto,
  PacienteUpdateRequest,
  UnidadeEnum,
} from "@/types/clinical";
import { formatDate, isFutureDate } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

export default function EditPacientePage() {
  const router = useRouter();
  const params = useParams();
  const pacienteId = params.id as string;

  // Estados principais
  const [paciente, setPaciente] = useState<PacienteDto | null>(null);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState<PacienteUpdateRequest>({
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
    if (pacienteId) {
      loadInitialData();
    }
  }, [pacienteId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pacienteData, conveniosData] = await Promise.all([
        pacienteService.getPacienteById(pacienteId),
        convenioService.getAllConvenios(),
      ]);

      setPaciente(pacienteData);
      setConvenios(conveniosData);

      // Preencher formulário com dados atuais
      setFormData({
        nome: pacienteData.nome,
        dataNascimento: pacienteData.dataNascimento,
        responsavel: pacienteData.responsavel || "",
        convenioId: pacienteData.convenioId,
        unidade: pacienteData.unidade,
      });
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar informações do paciente");
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
    } else if (isFutureDate(formData.dataNascimento)) {
      errors.dataNascimento = "Data de nascimento não pode ser futura";
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

      await pacienteService.updatePaciente(pacienteId, formData);

      toastUtil.success("Paciente atualizado com sucesso!");
      router.push(`/pacientes/${pacienteId}`);
    } catch (err) {
      console.error("Erro ao atualizar paciente:", err);
      toastUtil.error("Erro ao atualizar paciente");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof PacienteUpdateRequest,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Removida a função formatDate pois agora está importada do utilitário dateUtils

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando informações do paciente..." />
        </main>
      </div>
    );
  }

  if (error || !paciente) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error || "Paciente não encontrado"}
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
                variant="secondary"
                onClick={() => router.back()}
                className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </CustomButton>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Users className="mr-2 h-6 w-6" />
                  Editar Paciente
                </h1>
                <p className="text-gray-600 mt-1">Editando: {paciente.nome}</p>
              </div>
            </div>
          </div>

          {/* Formulário de edição */}
          <div className="bg-white rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna esquerda */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Dados Pessoais
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
                      placeholder="Digite o nome completo"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Responsável
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Convênio *
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidade *
                    </label>
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

                  {/* Informações somente leitura */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Informações do Registro
                    </h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-mono">{paciente.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cadastrado em:</span>
                        <span>{formatDate(paciente.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cadastrado por:</span>
                        <span>{paciente.createdByName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Última atualização:
                        </span>
                        <span>{formatDate(paciente.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <CustomButton
                  type="button"
                  variant="secondary"
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
                      Salvar Alterações
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
