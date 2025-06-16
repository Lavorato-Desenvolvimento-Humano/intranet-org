"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  FileText,
  Calendar,
  AlertTriangle,
  Check,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { DataTable } from "@/components/clinical/ui/DataTable";
import { SearchInput } from "@/components/clinical/ui/SearchInput";
import { FilterDropdown } from "@/components/clinical/ui/FilterDropdown";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { FormModal } from "@/components/clinical/ui/FormModal";
import { guiaService, pacienteService } from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import {
  GuiaSummaryDto,
  GuiaCreateRequest,
  GuiaUpdateRequest,
  PageResponse,
  PacienteSummaryDto,
} from "@/types/clinical";
import toastUtil from "@/utils/toast";

export default function GuiasPage() {
  const router = useRouter();

  const [guias, setGuias] = useState<PageResponse<GuiaSummaryDto>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
  });
  const [pacientes, setPacientes] = useState<PacienteSummaryDto[]>([]);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConvenio, setSelectedConvenio] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPeriodo, setSelectedPeriodo] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGuia, setSelectedGuia] = useState<GuiaSummaryDto | null>(null);

  const [formData, setFormData] = useState<GuiaCreateRequest>({
    pacienteId: "",
    especialidades: [],
    quantidadeAutorizada: 1,
    convenioId: "",
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    validade: "",
    lote: "",
    valorReais: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [especialidadeInput, setEspecialidadeInput] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadGuias();
  }, [
    currentPage,
    searchTerm,
    selectedConvenio,
    selectedStatus,
    selectedPeriodo,
  ]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [guiasData, pacientesData, conveniosData] = await Promise.all([
        guiaService.getAllGuias(0, 20),
        pacienteService.getAllPacientes(0, 100),
        convenioService.getAllConvenios(),
      ]);

      setGuias(guiasData);
      setPacientes(pacientesData.content);
      setConvenios(conveniosData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar dados das guias");
      toastUtil.error("Erro ao carregar dados das guias");
    } finally {
      setLoading(false);
    }
  };

  const loadGuias = async () => {
    try {
      setLoading(true);
      let result;

      if (searchTerm) {
        result = await guiaService.searchByNumeroGuia(
          searchTerm,
          currentPage,
          20
        );
      } else if (selectedConvenio) {
        result = await guiaService.getGuiasByConvenio(
          selectedConvenio,
          currentPage,
          20
        );
      } else if (selectedStatus) {
        result = await guiaService.getGuiasByStatus(
          selectedStatus,
          currentPage,
          20
        );
      } else if (selectedPeriodo) {
        const [mes, ano] = selectedPeriodo.split("/");
        result = await guiaService.getGuiasByPeriodo(
          parseInt(mes),
          parseInt(ano),
          currentPage,
          20
        );
      } else {
        result = await guiaService.getAllGuias(currentPage, 20);
      }

      setGuias(result);
    } catch (err) {
      console.error("Erro ao carregar guias:", err);
      setError("Erro ao carregar guias");
      toastUtil.error("Erro ao carregar guias");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await guiaService.createGuia(formData);
      toastUtil.success("Guia criada com sucesso");
      setShowCreateModal(false);
      resetForm();
      loadGuias();
    } catch (err) {
      console.error("Erro ao criar guia: ", err);
      toastUtil.error("Erro ao criar guia");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditGuia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuia) return;

    try {
      setSubmitting(true);
      const updateData: GuiaUpdateRequest = {
        especialidades: formData.especialidades,
        quantidadeAutorizada: formData.quantidadeAutorizada,
        mes: formData.mes,
        ano: formData.ano,
        validade: formData.validade,
        lote: formData.lote,
        valorReais: formData.valorReais,
      };

      await guiaService.updateGuia(selectedGuia.id, updateData);
      toastUtil.success("Guia atualizada com sucesso");
      setShowEditModal(false);
      setSelectedGuia(null);
      resetForm();
      loadGuias();
    } catch (err) {
      console.error("Erro ao atualizar guia: ", err);
      toastUtil.error("Erro ao atualizar guia");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGuia = async (guia: GuiaSummaryDto) => {
    if (!confirm(`Tem certeza que deseja excluir a guia ${guia.numeroGuia}?`)) {
      return;
    }

    try {
      await guiaService.deleteGuia(guia.id);
      toastUtil.success("Guia excluída com sucesso");
      loadGuias();
    } catch (err) {
      console.error("Erro ao excluir guia:", err);
      toastUtil.error("Erro ao excluir guia");
    }
  };

  const openEditModal = (guia: GuiaSummaryDto) => {
    setSelectedGuia(guia);
    setFormData({
      pacienteId: "", // Não editável
      especialidades: guia.especialidades,
      quantidadeAutorizada: guia.quantidadeAutorizada,
      convenioId: "", // Não editável
      mes: guia.mes,
      ano: guia.ano,
      validade: guia.validade,
      lote: "",
      valorReais: 0,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      pacienteId: "",
      especialidades: [],
      quantidadeAutorizada: 1,
      convenioId: "",
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      validade: "",
      lote: "",
      valorReais: 0,
    });
    setEspecialidadeInput("");
  };

  const addEspecialidade = () => {
    if (
      especialidadeInput.trim() &&
      !formData.especialidades.includes(especialidadeInput.trim())
    ) {
      setFormData({
        ...formData,
        especialidades: [...formData.especialidades, especialidadeInput.trim()],
      });
      setEspecialidadeInput("");
    }
  };

  const removeEspecialidade = (especialidade: string) => {
    setFormData({
      ...formData,
      especialidades: formData.especialidades.filter(
        (e) => e !== especialidade
      ),
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedConvenio("");
    setSelectedStatus("");
    setSelectedPeriodo("");
    setCurrentPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const isGuiaVencida = (validade: string) => {
    return new Date(validade) < new Date();
  };

  const getStatusIcon = (guia: GuiaSummaryDto) => {
    if (isGuiaVencida(guia.validade)) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (guia.status === "ATIVO") {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const tableColumns = [
    {
      header: "Número",
      accessor: "numeroGuia" as keyof GuiaSummaryDto,
      className: "font-medium",
    },
    {
      header: "Paciente",
      accessor: "pacienteNome" as keyof GuiaSummaryDto,
    },
    {
      header: "Especialidades",
      accessor: ((guia: GuiaSummaryDto) => (
        <div className="flex flex-wrap gap-1">
          {guia.especialidades.slice(0, 2).map((esp, index) => (
            <span
              key={index}
              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {esp}
            </span>
          ))}
          {guia.especialidades.length > 2 && (
            <span className="text-xs text-gray-500">
              +{guia.especialidades.length - 2}
            </span>
          )}
        </div>
      )) as any,
    },
    {
      header: "Quantidade",
      accessor: "quantidadeAutorizada" as keyof GuiaSummaryDto,
      className: "text-center",
    },
    {
      header: "Convênio",
      accessor: "convenioNome" as keyof GuiaSummaryDto,
    },
    {
      header: "Período",
      accessor: ((guia: GuiaSummaryDto) => `${guia.mes}/${guia.ano}`) as any,
    },
    {
      header: "Validade",
      accessor: ((guia: GuiaSummaryDto) => (
        <div className="flex items-center">
          {getStatusIcon(guia)}
          <span
            className={`ml-1 ${isGuiaVencida(guia.validade) ? "text-red-600" : ""}`}>
            {formatDate(guia.validade)}
          </span>
        </div>
      )) as any,
    },
    {
      header: "Status",
      accessor: ((guia: GuiaSummaryDto) => (
        <StatusBadge status={guia.status} />
      )) as any,
    },
    {
      header: "Ações",
      accessor: ((guia: GuiaSummaryDto) => (
        <div className="flex space-x-2">
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/guias/${guia.id}`)}>
            <Eye className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => openEditModal(guia)}>
            <Edit className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => handleDeleteGuia(guia)}>
            <Trash2 className="h-4 w-4" />
          </CustomButton>
        </div>
      )) as any,
    },
  ];

  const periodoOptions = [
    ...Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const ano = new Date().getFullYear();
      return {
        label: `${mes.toString().padStart(2, "0")}/${ano}`,
        value: `${mes}/${ano}`,
      };
    }),
    ...Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      const ano = new Date().getFullYear() - 1;
      return {
        label: `${mes.toString().padStart(2, "0")}/${ano}`,
        value: `${mes}/${ano}`,
      };
    }),
  ];

  if (loading && !guias.content.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando guias..." />
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FileText className="mr-2 h-6 w-6" />
                Guias
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie as guias de autorização
              </p>
            </div>
            <CustomButton
              variant="primary"
              onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Guia
            </CustomButton>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por número..."
                onClear={() => setSearchTerm("")}
              />

              <FilterDropdown
                options={convenios.map((c) => ({ label: c.name, value: c.id }))}
                value={selectedConvenio}
                onChange={setSelectedConvenio}
                placeholder="Filtrar por convênio"
              />

              <FilterDropdown
                options={[
                  { label: "ATIVO", value: "ATIVO" },
                  { label: "INATIVO", value: "INATIVO" },
                  { label: "PENDENTE", value: "PENDENTE" },
                  { label: "VENCIDO", value: "VENCIDO" },
                ]}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="Filtrar por status"
              />

              <FilterDropdown
                options={periodoOptions}
                value={selectedPeriodo}
                onChange={setSelectedPeriodo}
                placeholder="Filtrar por período"
              />

              <CustomButton
                variant="primary"
                onClick={clearFilters}
                className="w-full">
                Limpar Filtros
              </CustomButton>
            </div>
          </div>

          {/* Tabela de guias */}
          <DataTable
            data={guias}
            columns={tableColumns}
            onPageChange={setCurrentPage}
            loading={loading}
          />

          {/* Modal de criação */}
          <FormModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Nova Guia"
            className="sm:max-w-lg">
            <form onSubmit={handleCreateGuia} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paciente *
                </label>
                <select
                  required
                  value={formData.pacienteId}
                  onChange={(e) =>
                    setFormData({ ...formData, pacienteId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">Selecione o paciente</option>
                  {pacientes.map((paciente) => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.nome} - {paciente.convenioNome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <div className="flex flex-wrap gap-2">
                    {formData.especialidades.map((esp, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                        {esp}
                        <button
                          type="button"
                          onClick={() => removeEspecialidade(esp)}
                          className="ml-1 text-blue-600 hover:text-blue-800">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantidadeAutorizada}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantidadeAutorizada: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Convênio *
                  </label>
                  <select
                    required
                    value={formData.convenioId}
                    onChange={(e) =>
                      setFormData({ ...formData, convenioId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Selecione</option>
                    {convenios.map((convenio) => (
                      <option key={convenio.id} value={convenio.id}>
                        {convenio.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mês *
                  </label>
                  <select
                    required
                    value={formData.mes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mes: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                      <option key={mes} value={mes}>
                        {mes.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ano *
                  </label>
                  <input
                    type="number"
                    required
                    min="2020"
                    max="2030"
                    value={formData.ano}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ano: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validade *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validade}
                    onChange={(e) =>
                      setFormData({ ...formData, validade: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorReais}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valorReais: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lote
                </label>
                <input
                  type="text"
                  value={formData.lote}
                  onChange={(e) =>
                    setFormData({ ...formData, lote: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <CustomButton
                  type="button"
                  variant="primary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}>
                  Cancelar
                </CustomButton>
                <CustomButton
                  type="submit"
                  variant="primary"
                  disabled={submitting || formData.especialidades.length === 0}>
                  {submitting ? "Criando..." : "Criar Guia"}
                </CustomButton>
              </div>
            </form>
          </FormModal>

          {/* Modal de edição */}
          <FormModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Editar Guia"
            className="sm:max-w-lg">
            <form onSubmit={handleEditGuia} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <div className="flex flex-wrap gap-2">
                    {formData.especialidades.map((esp, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                        {esp}
                        <button
                          type="button"
                          onClick={() => removeEspecialidade(esp)}
                          className="ml-1 text-blue-600 hover:text-blue-800">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantidadeAutorizada}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantidadeAutorizada: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorReais}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valorReais: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mês *
                  </label>
                  <select
                    required
                    value={formData.mes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mes: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                      <option key={mes} value={mes}>
                        {mes.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ano *
                  </label>
                  <input
                    type="number"
                    required
                    min="2020"
                    max="2030"
                    value={formData.ano}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ano: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validade *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validade}
                    onChange={(e) =>
                      setFormData({ ...formData, validade: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={formData.lote}
                    onChange={(e) =>
                      setFormData({ ...formData, lote: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <CustomButton
                  type="button"
                  variant="primary"
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}>
                  Cancelar
                </CustomButton>
                <CustomButton
                  type="submit"
                  variant="primary"
                  disabled={submitting || formData.especialidades.length === 0}>
                  {submitting ? "Salvando..." : "Salvar Alterações"}
                </CustomButton>
              </div>
            </form>
          </FormModal>
        </main>
      </div>
    </ProtectedRoute>
  );
}
