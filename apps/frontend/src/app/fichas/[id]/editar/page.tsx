"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, FileSignature, Save, X, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { StatusSelect } from "@/components/clinical/ui/StatusSelect";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { fichaService, especialidadeService } from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import {
  FichaDto,
  FichaUpdateRequest,
  StatusChangeRequest,
  EspecialidadeDto,
} from "@/types/clinical";
import toastUtil from "@/utils/toast";

interface FormData {
  especialidade: string;
  quantidadeAutorizada: number;
  mes: number;
  ano: number;
  status: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function EditarFichaPage() {
  const router = useRouter();
  const params = useParams();
  const fichaId = params.id as string;

  // Estados principais
  const [ficha, setFicha] = useState<FichaDto | null>(null);
  const [formData, setFormData] = useState<FormData>({
    especialidade: "",
    quantidadeAutorizada: 1,
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    status: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [listaEspecialidades, setListaEspecialidades] = useState<
    EspecialidadeDto[]
  >([]);

  // Lista de especialidades disponíveis
  // const especialidades = [
  //   "Fisioterapia",
  //   "Fonoaudiologia",
  //   "Terapia Ocupacional",
  //   "Psicologia",
  //   "Nutrição",
  //   "Psicopedagogia",
  //   "Psicomotricidade",
  // ];

  // Carregar dados da ficha
  useEffect(() => {
    if (fichaId) {
      loadFichaData();
    }
  }, [fichaId]);

  // Carregar convênios
  useEffect(() => {
    loadConvenios();
  }, []);

  const loadFichaData = async () => {
    try {
      setLoadingData(true);

      const [fichaData, especialidadesData] = await Promise.all([
        fichaService.getFichaById(fichaId),
        especialidadeService.getAll(),
      ]);
      setFicha(fichaData);
      setListaEspecialidades(especialidadesData);

      // Preencher formulário com dados da ficha
      setFormData({
        especialidade: fichaData.especialidade,
        quantidadeAutorizada: fichaData.quantidadeAutorizada,
        mes: fichaData.mes,
        ano: fichaData.ano,
        status: fichaData.status,
      });
    } catch (err) {
      console.error("Erro ao carregar ficha:", err);
      toastUtil.error("Erro ao carregar dados da ficha");
      router.push("/fichas");
    } finally {
      setLoadingData(false);
    }
  };

  const loadConvenios = async () => {
    try {
      const conveniosData = await convenioService.getAllConvenios();
      setConvenios(conveniosData);
    } catch (err) {
      console.error("Erro ao carregar convênios:", err);
      toastUtil.error("Erro ao carregar convênios");
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setFormData((prev) => ({ ...prev, status: newStatus }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors.status) {
      setFormErrors((prev) => ({ ...prev, status: "" }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.especialidade) {
      errors.especialidade = "Especialidade é obrigatória";
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

      // Preparar dados para atualização
      const updateRequest: FichaUpdateRequest = {
        especialidade: formData.especialidade,
        quantidadeAutorizada: formData.quantidadeAutorizada,
        mes: formData.mes,
        ano: formData.ano,
        status: formData.status, // ✅ Incluir status na atualização
      };

      // ✅ Usar apenas um endpoint - updateFicha com status incluído
      const fichaAtualizada = await fichaService.updateFicha(
        fichaId,
        updateRequest
      );

      toastUtil.success("Ficha atualizada com sucesso!");
      router.push(`/fichas/${fichaId}`);
    } catch (err: any) {
      console.error("Erro ao atualizar ficha:", err);
      toastUtil.error(err.response?.data?.message || "Erro ao atualizar ficha");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Loading message="Carregando dados da ficha..." />
        </div>
      </ProtectedRoute>
    );
  }

  if (!ficha) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ficha não encontrada
              </h2>
              <CustomButton onClick={() => router.push("/fichas")}>
                Voltar para Fichas
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
                  onClick={() => router.push(`/fichas/${fichaId}`)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </CustomButton>

                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <FileSignature className="h-8 w-8 mr-3 text-blue-600" />
                    Editar Ficha
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {ficha.codigoFicha} - {ficha.pacienteNome}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">Status atual:</span>
                <StatusBadge status={ficha.status} />
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    {listaEspecialidades.map((esp) => (
                      <option key={esp.id} value={esp.nome}>
                        {esp.nome}
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
                    <p className="mt-1 text-sm text-red-600">
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
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.ano}
                    </p>
                  )}
                </div>
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
                {formData.status !== ficha.status && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        O status será alterado de{" "}
                        <strong>{ficha.status}</strong> para{" "}
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
                  onClick={() => router.push(`/fichas/${fichaId}`)}
                  disabled={loading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </CustomButton>

                <CustomButton
                  type="submit"
                  variant="primary"
                  disabled={loading}>
                  {loading ? (
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
      </div>
    </ProtectedRoute>
  );
}
