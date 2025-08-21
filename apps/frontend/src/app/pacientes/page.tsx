// src/app/pacientes/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Baby,
  Copy,
  Calendar,
  Building,
  FileText,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { DataTable } from "@/components/clinical/ui/DataTable";
import { SearchInput } from "@/components/clinical/ui/SearchInput";
import { FilterDropdown } from "@/components/clinical/ui/FilterDropdown";
import { UnidadeBadge } from "@/components/clinical/ui/UnidadeBadge";
import { FormModal } from "@/components/clinical/ui/FormModal";
import { pacienteService } from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import {
  PacienteSummaryDto,
  PacienteCreateRequest,
  PacienteUpdateRequest,
  PageResponse,
  UnidadeEnum,
  PacienteDto,
} from "@/types/clinical";
import toastUtil from "@/utils/toast";
import { formatDate } from "@/utils/dateUtils";

export default function PacientesPage() {
  const router = useRouter();

  // Estados principais
  const [pacientes, setPacientes] = useState<PageResponse<PacienteSummaryDto>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
  });
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConvenio, setSelectedConvenio] = useState("");
  const [selectedUnidade, setSelectedUnidade] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  // Estados de modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPaciente, setSelectedPaciente] =
    useState<PacienteSummaryDto | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  // Estados de formulário
  const [formData, setFormData] = useState<PacienteCreateRequest>({
    nome: "",
    dataNascimento: "",
    responsavel: "",
    convenioId: "",
    unidade: UnidadeEnum.KIDS,
  });
  const [submitting, setSubmitting] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar pacientes quando filtros mudarem
  useEffect(() => {
    loadPacientes();
  }, [currentPage, selectedConvenio, selectedStatus]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(0);

    // Executar busca imediatamente quando chamada
    if (term.trim() !== "") {
      searchPacientes(term);
    } else {
      loadPacientes();
    }
  };

  const searchPacientes = async (searchQuery?: string) => {
    try {
      setLoading(true);
      const query = searchQuery || searchTerm;

      if (query.trim() === "") {
        loadPacientes();
        return;
      }

      const pacientesData = await pacienteService.searchPacientesByNome(
        query,
        currentPage,
        20
      );
      setPacientes(pacientesData);
    } catch (err) {
      console.error("Erro ao buscar pacientes:", err);
      toastUtil.error("Erro ao buscar pacientes");
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [pacientesData, conveniosData] = await Promise.all([
        pacienteService.getAllPacientes(0, 20),
        convenioService.getAllConvenios(),
      ]);

      setPacientes(pacientesData);
      setConvenios(conveniosData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar dados dos pacientes");
      toastUtil.error("Erro ao carregar dados dos pacientes");
    } finally {
      setLoading(false);
    }
  };

  const loadPacientes = async () => {
    try {
      setLoading(true);
      let result;

      if (searchTerm) {
        result = await pacienteService.searchPacientesByNome(
          searchTerm,
          currentPage,
          20
        );
      } else if (selectedConvenio) {
        result = await pacienteService.getPacientesByConvenio(
          selectedConvenio,
          currentPage,
          20
        );
      } else if (selectedUnidade) {
        result = await pacienteService.getPacientesByUnidade(
          selectedUnidade,
          currentPage,
          20
        );
      } else {
        result = await pacienteService.getAllPacientes(currentPage, 20);
      }

      setPacientes(result);
    } catch (err) {
      console.error("Erro ao carregar pacientes:", err);
      toastUtil.error("Erro ao carregar pacientes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await pacienteService.createPaciente(formData);
      toastUtil.success("Paciente criado com sucesso!");
      setShowCreateModal(false);
      resetForm();
      loadPacientes();
    } catch (err) {
      console.error("Erro ao criar paciente:", err);
      toastUtil.error("Erro ao criar paciente");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaciente) return;

    try {
      setSubmitting(true);
      await pacienteService.updatePaciente(selectedPaciente.id, formData);
      toastUtil.success("Paciente atualizado com sucesso!");
      setShowEditModal(false);
      setSelectedPaciente(null);
      resetForm();
      loadPacientes();
    } catch (err) {
      console.error("Erro ao atualizar paciente:", err);
      toastUtil.error("Erro ao atualizar paciente");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePaciente = async (paciente: PacienteSummaryDto) => {
    if (
      !confirm(`Tem certeza que deseja excluir o paciente ${paciente.nome}?`)
    ) {
      return;
    }

    try {
      await pacienteService.deletePaciente(paciente.id);
      toastUtil.success("Paciente excluído com sucesso!");
      loadPacientes();
    } catch (err) {
      console.error("Erro ao excluir paciente:", err);
      toastUtil.error("Erro ao excluir paciente");
    }
  };

  const openEditModal = (paciente: PacienteSummaryDto) => {
    setSelectedPaciente(paciente);
    setFormData({
      nome: paciente.nome,
      dataNascimento: paciente.dataNascimento,
      responsavel: "", // Será carregado do paciente completo se necessário
      convenioId: "", // Será resolvido pelo nome do convênio
      unidade: paciente.unidade,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      dataNascimento: "",
      responsavel: "",
      convenioId: "",
      unidade: UnidadeEnum.KIDS,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedConvenio("");
    setSelectedStatus("");
    setCurrentPage(0);
    loadPacientes();
  };

  const tableColumns = [
    {
      header: "Nome",
      accessor: "nome" as keyof PacienteSummaryDto,
      className: "font-medium",
    },
    {
      header: "Data Nascimento",
      accessor: ((paciente: PacienteSummaryDto) =>
        formatDate(paciente.dataNascimento)) as any,
    },
    {
      header: "Convênio",
      accessor: "convenioNome" as keyof PacienteSummaryDto,
    },
    {
      header: "Unidade",
      accessor: ((paciente: PacienteSummaryDto) => (
        <UnidadeBadge unidade={paciente.unidade} />
      )) as any,
    },
    {
      header: "Responsável",
      accessor: ((paciente: PacienteSummaryDto) =>
        paciente.responsavel || "Não informado") as any,
    },
    {
      header: "Cadastrado em",
      accessor: ((paciente: PacienteSummaryDto) =>
        formatDate(paciente.createdAt)) as any,
    },
    {
      header: "Ações",
      accessor: ((paciente: PacienteSummaryDto) => (
        <div className="flex space-x-2">
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/pacientes/${paciente.id}`)}
            title="Visualizar paciente">
            <Eye className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/pacientes/${paciente.id}/editar`)}
            title="Editar paciente">
            <Edit className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/pacientes/${paciente.id}/editar/novo`)}
            title="Criar novo paciente baseado neste">
            <Copy className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => handleDeletePaciente(paciente)}>
            <Trash2 className="h-4 w-4" />
          </CustomButton>
        </div>
      )) as any,
    },
  ];

  if (loading && !pacientes.content.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando pacientes..." />
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
                <Users className="mr-2 h-6 w-6" />
                Pacientes
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie os pacientes do sistema
              </p>
            </div>
            <CustomButton
              variant="primary"
              onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </CustomButton>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SearchInput
                placeholder="Buscar pacientes... (pressione Enter)"
                value={searchTerm}
                onChange={handleSearch}
                onEnterSearch={true}
              />

              <FilterDropdown
                options={convenios.map((c) => ({ label: c.name, value: c.id }))}
                value={selectedConvenio}
                onChange={setSelectedConvenio}
                placeholder="Filtrar por convênio"
              />

              <FilterDropdown
                options={[
                  { label: "KIDS", value: "KIDS" },
                  { label: "SENIOR", value: "SENIOR" },
                ]}
                value={selectedUnidade}
                onChange={setSelectedUnidade}
                placeholder="Filtrar por unidade"
              />

              <CustomButton
                variant="primary"
                onClick={clearFilters}
                className="w-full">
                Limpar Filtros
              </CustomButton>
            </div>
          </div>

          {/* Tabela de pacientes */}
          <DataTable
            data={pacientes}
            columns={tableColumns}
            onPageChange={setCurrentPage}
            loading={loading}
          />

          {/* Modal de criação */}
          <FormModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Novo Paciente"
            className="sm:max-w-md">
            <form onSubmit={handleCreatePaciente} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dataNascimento}
                  onChange={(e) =>
                    setFormData({ ...formData, dataNascimento: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável
                </label>
                <input
                  type="text"
                  value={formData.responsavel}
                  onChange={(e) =>
                    setFormData({ ...formData, responsavel: e.target.value })
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
                  <option value="">Selecione o convênio</option>
                  {convenios.map((convenio) => (
                    <option key={convenio.id} value={convenio.id}>
                      {convenio.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade *
                </label>
                <select
                  required
                  value={formData.unidade}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unidade: e.target.value as UnidadeEnum,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value={UnidadeEnum.KIDS}>KIDS</option>
                  <option value={UnidadeEnum.SENIOR}>SENIOR</option>
                </select>
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
                  disabled={submitting}>
                  {submitting ? "Criando..." : "Criar Paciente"}
                </CustomButton>
              </div>
            </form>
          </FormModal>

          {/* Modal de edição */}
          <FormModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Editar Paciente"
            className="sm:max-w-md">
            <form onSubmit={handleEditPaciente} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dataNascimento}
                  onChange={(e) =>
                    setFormData({ ...formData, dataNascimento: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável
                </label>
                <input
                  type="text"
                  value={formData.responsavel}
                  onChange={(e) =>
                    setFormData({ ...formData, responsavel: e.target.value })
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
                  <option value="">Selecione o convênio</option>
                  {convenios.map((convenio) => (
                    <option key={convenio.id} value={convenio.id}>
                      {convenio.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade *
                </label>
                <select
                  required
                  value={formData.unidade}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unidade: e.target.value as UnidadeEnum,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value={UnidadeEnum.KIDS}>KIDS</option>
                  <option value={UnidadeEnum.SENIOR}>SENIOR</option>
                </select>
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
                  disabled={submitting}>
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
