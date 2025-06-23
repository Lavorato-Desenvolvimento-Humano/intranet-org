"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, FileSignature, Save, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { fichaService } from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import { FichaDto, FichaUpdateRequest } from "@/types/clinical";
import toastUtil from "@/utils/toast";

interface FormData {
  especialidade: string;
  quantidadeAutorizada: number;
  mes: number;
  ano: number;
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
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);

  // Lista de especialidades disponíveis
  const especialidades = [
    "Fisioterapia",
    "Fonoaudiologia",
    "Terapia Ocupacional",
    "Psicologia",
    "Nutrição",
    "Psicopedagogia",
    "Psicomotricidade",
  ];

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

      const fichaData = await fichaService.getFichaById(fichaId);
      setFicha(fichaData);

      // Preencher formulário com dados da ficha
      setFormData({
        especialidade: fichaData.especialidade,
        quantidadeAutorizada: fichaData.quantidadeAutorizada,
        mes: fichaData.mes,
        ano: fichaData.ano,
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

      const updateRequest: FichaUpdateRequest = {
        especialidade: formData.especialidade,
        quantidadeAutorizada: formData.quantidadeAutorizada,
        mes: formData.mes,
        ano: formData.ano,
      };

      const fichaAtualizada = await fichaService.updateFicha(
        fichaId,
        updateRequest
      );

      toastUtil.success("Ficha atualizada com sucesso!");
      router.push(`/fichas/${fichaAtualizada.id}`);
    } catch (err) {
      console.error("Erro ao atualizar ficha:", err);
      toastUtil.error("Erro ao atualizar ficha");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/fichas/${fichaId}`);
  };

  if (loadingData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando dados da ficha..." />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!ficha) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              Ficha não encontrada
            </div>
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
                  Editar Ficha #{ficha.codigoFicha}
                </h1>
                <p className="text-gray-600 mt-1">
                  Atualize as informações da ficha
                </p>
              </div>
            </div>
          </div>

          {/* Informações não editáveis */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Informações não editáveis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Código:</span>{" "}
                <span className="font-medium">{ficha.codigoFicha}</span>
              </div>
              <div>
                <span className="text-blue-600">Tipo:</span>{" "}
                <span className="font-medium">
                  {ficha.tipoFicha === "COM_GUIA" ? "Com Guia" : "Assinatura"}
                </span>
              </div>
              <div>
                <span className="text-blue-600">Paciente:</span>{" "}
                <span className="font-medium">{ficha.pacienteNome}</span>
              </div>
              <div>
                <span className="text-blue-600">Convênio:</span>{" "}
                <span className="font-medium">{ficha.convenioNome}</span>
              </div>
              <div>
                <span className="text-blue-600">Status:</span>{" "}
                <span className="font-medium">{ficha.status}</span>
              </div>
              <div>
                <span className="text-blue-600">Responsável:</span>{" "}
                <span className="font-medium">
                  {ficha.usuarioResponsavelNome}
                </span>
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
