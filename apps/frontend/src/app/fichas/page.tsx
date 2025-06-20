// src/app/fichas/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Clipboard,
  Link,
  Unlink,
  FileSignature,
  Hash,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fichaService,
  guiaService,
  pacienteService,
} from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import {
  FichaSummaryDto,
  FichaCreateRequest,
  FichaAssinaturaCreateRequest,
  FichaUpdateRequest,
  PageResponse,
  GuiaSummaryDto,
  PacienteSummaryDto,
  TipoFichaEnum,
} from "@/types/clinical";
import toastUtil from "@/utils/toast";

export default function FichasPage() {
  const router = useRouter();

  // Estados principais
  const [fichas, setFichas] = useState<PageResponse<FichaSummaryDto>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
  });
  const [guias, setGuias] = useState<GuiaSummaryDto[]>([]);
  const [pacientes, setPacientes] = useState<PacienteSummaryDto[]>([]);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConvenio, setSelectedConvenio] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedEspecialidade, setSelectedEspecialidade] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  // Estados de modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<FichaSummaryDto | null>(
    null
  );
  const [createType, setCreateType] = useState<"com_guia" | "assinatura">(
    "com_guia"
  );

  // Estados de formulário
  const [formDataComGuia, setFormDataComGuia] = useState<FichaCreateRequest>({
    guiaId: "",
    especialidade: "",
    quantidadeAutorizada: 1,
    convenioId: "",
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
  });

  const [formDataAssinatura, setFormDataAssinatura] =
    useState<FichaAssinaturaCreateRequest>({
      pacienteId: "",
      especialidade: "",
      quantidadeAutorizada: 1,
      convenioId: "",
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
    });

  const [submitting, setSubmitting] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar fichas quando filtros mudarem
  useEffect(() => {
    loadFichas();
  }, [
    currentPage,
    searchTerm,
    selectedConvenio,
    selectedStatus,
    selectedEspecialidade,
  ]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [fichasData, guiasData, pacientesData, conveniosData] =
        await Promise.all([
          fichaService.getAllFichas(0, 20),
          guiaService.getAllGuias(0, 100), // Carregar mais para o select
          pacienteService.getAllPacientes(0, 100), // Carregar mais para o select
          convenioService.getAllConvenios(),
        ]);

      setFichas(fichasData);
      setGuias(guiasData.content);
      setPacientes(pacientesData.content);
      setConvenios(conveniosData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar dados das fichas");
      toastUtil.error("Erro ao carregar dados das fichas");
    } finally {
      setLoading(false);
    }
  };

  const loadFichas = async () => {
    try {
      setLoading(true);
      let result;

      if (searchTerm) {
        result = await fichaService.searchByCodigoFicha(
          searchTerm,
          currentPage,
          20
        );
      } else if (selectedConvenio) {
        result = await fichaService.getFichasByConvenio(
          selectedConvenio,
          currentPage,
          20
        );
      } else if (selectedStatus) {
        result = await fichaService.getFichasByStatus(
          selectedStatus,
          currentPage,
          20
        );
      } else if (selectedEspecialidade) {
        result = await fichaService.searchFichasByEspecialidade(
          selectedEspecialidade,
          currentPage,
          20
        );
      } else {
        result = await fichaService.getAllFichas(currentPage, 20);
      }

      setFichas(result);
    } catch (err) {
      console.error("Erro ao carregar fichas:", err);
      toastUtil.error("Erro ao carregar fichas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFichaComGuia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await fichaService.createFicha(formDataComGuia);
      toastUtil.success("Ficha criada com sucesso!");
      setShowCreateModal(false);
      resetForm();
      loadFichas();
    } catch (err) {
      console.error("Erro ao criar ficha:", err);
      toastUtil.error("Erro ao criar ficha");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFichaAssinatura = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await fichaService.createFichaAssinatura(formDataAssinatura);
      toastUtil.success("Ficha de assinatura criada com sucesso!");
      setShowCreateModal(false);
      resetForm();
      loadFichas();
    } catch (err) {
      console.error("Erro ao criar ficha de assinatura:", err);
      toastUtil.error("Erro ao criar ficha de assinatura");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFicha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFicha) return;

    try {
      setSubmitting(true);
      const updateData: FichaUpdateRequest = {
        especialidade: formDataComGuia.especialidade,
        quantidadeAutorizada: formDataComGuia.quantidadeAutorizada,
        mes: formDataComGuia.mes,
        ano: formDataComGuia.ano,
      };

      await fichaService.updateFicha(selectedFicha.id, updateData);
      toastUtil.success("Ficha atualizada com sucesso!");
      setShowEditModal(false);
      setSelectedFicha(null);
      resetForm();
      loadFichas();
    } catch (err) {
      console.error("Erro ao atualizar ficha:", err);
      toastUtil.error("Erro ao atualizar ficha");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFicha = async (ficha: FichaSummaryDto) => {
    if (
      !confirm(`Tem certeza que deseja excluir a ficha ${ficha.codigoFicha}?`)
    ) {
      return;
    }

    try {
      await fichaService.deleteFicha(ficha.id);
      toastUtil.success("Ficha excluída com sucesso!");
      loadFichas();
    } catch (err) {
      console.error("Erro ao excluir ficha:", err);
      toastUtil.error("Erro ao excluir ficha");
    }
  };

  const openEditModal = (ficha: FichaSummaryDto) => {
    setSelectedFicha(ficha);
    setFormDataComGuia({
      guiaId: "", // Não editável
      especialidade: ficha.especialidade,
      quantidadeAutorizada: ficha.quantidadeAutorizada,
      convenioId: "", // Não editável
      mes: ficha.mes,
      ano: ficha.ano,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormDataComGuia({
      guiaId: "",
      especialidade: "",
      quantidadeAutorizada: 1,
      convenioId: "",
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
    });
    setFormDataAssinatura({
      pacienteId: "",
      especialidade: "",
      quantidadeAutorizada: 1,
      convenioId: "",
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedConvenio("");
    setSelectedStatus("");
    setSelectedEspecialidade("");
    setCurrentPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getFichaTypeIcon = (ficha: FichaSummaryDto) => {
    // Assumindo que fichas com guiaId são COM_GUIA e sem são ASSINATURA
    const hasGuia = true; // Esta informação deveria vir do backend
    return hasGuia ? (
      <Link className="h-4 w-4 text-blue-500" />
    ) : (
      <FileSignature className="h-4 w-4 text-green-500" />
    );
  };

  const tableColumns = [
    {
      header: "Código",
      accessor: ((ficha: FichaSummaryDto) => (
        <div className="flex items-center">
          {getFichaTypeIcon(ficha)}
          <span className="ml-2 font-medium">{ficha.codigoFicha}</span>
        </div>
      )) as any,
    },
    {
      header: "Paciente",
      accessor: "pacienteNome" as keyof FichaSummaryDto,
    },
    {
      header: "Especialidade",
      accessor: ((ficha: FichaSummaryDto) => (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
          {ficha.especialidade}
        </span>
      )) as any,
    },
    {
      header: "Status",
      accessor: ((ficha: FichaSummaryDto) => (
        <StatusBadge status={ficha.status} />
      )) as any,
    },
    {
      header: "Quantidade",
      accessor: "quantidadeAutorizada" as keyof FichaSummaryDto,
      className: "text-center",
    },
    {
      header: "Convênio",
      accessor: "convenioNome" as keyof FichaSummaryDto,
    },
    {
      header: "Período",
      accessor: ((ficha: FichaSummaryDto) =>
        `${ficha.mes}/${ficha.ano}`) as any,
    },
    {
      header: "Responsável",
      accessor: "usuarioResponsavelNome" as keyof FichaSummaryDto,
      className: "text-sm text-gray-600",
    },
    {
      header: "Criado em",
      accessor: ((ficha: FichaSummaryDto) =>
        formatDate(ficha.createdAt)) as any,
      className: "text-sm text-gray-500",
    },
    {
      header: "Ações",
      accessor: ((ficha: FichaSummaryDto) => (
        <div className="flex space-x-2">
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/fichas/${ficha.id}`)}>
            <Eye className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => openEditModal(ficha)}>
            <Edit className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => handleDeleteFicha(ficha)}>
            <Trash2 className="h-4 w-4" />
          </CustomButton>
        </div>
      )) as any,
    },
  ];

  const especialidadesUnicas = Array.from(
    new Set(fichas.content.map((f) => f.especialidade))
  ).map((esp) => ({ label: esp, value: esp }));

  if (loading && !fichas.content.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando fichas..." />
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
                <Clipboard className="mr-2 h-6 w-6" />
                Fichas
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie as fichas de atendimento
              </p>
            </div>
            <CustomButton
              variant="primary"
              onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Ficha
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
                placeholder="Buscar por código..."
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
                  { label: "CONCLUIDO", value: "CONCLUIDO" },
                  { label: "CANCELADO", value: "CANCELADO" },
                ]}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="Filtrar por status"
              />

              <FilterDropdown
                options={especialidadesUnicas}
                value={selectedEspecialidade}
                onChange={setSelectedEspecialidade}
                placeholder="Filtrar por especialidade"
              />

              <CustomButton
                variant="primary"
                onClick={clearFilters}
                className="w-full">
                Limpar Filtros
              </CustomButton>
            </div>
          </div>

          {/* Tabela de fichas */}
          <DataTable
            data={fichas}
            columns={tableColumns}
            onPageChange={setCurrentPage}
            loading={loading}
          />

          {/* Modal de criação */}
          <FormModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Nova Ficha"
            className="sm:max-w-lg">
            <Tabs defaultValue="com_guia" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger
                  value="com_guia"
                  className="flex items-center"
                  onClick={() => setCreateType("com_guia")}>
                  <Link className="mr-2 h-4 w-4" />
                  Com Guia
                </TabsTrigger>
                <TabsTrigger
                  value="assinatura"
                  className="flex items-center"
                  onClick={() => setCreateType("assinatura")}>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Assinatura
                </TabsTrigger>
              </TabsList>

              <TabsContent value="com_guia">
                <form onSubmit={handleCreateFichaComGuia} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guia *
                    </label>
                    <select
                      required
                      value={formDataComGuia.guiaId}
                      onChange={(e) =>
                        setFormDataComGuia({
                          ...formDataComGuia,
                          guiaId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="">Selecione a guia</option>
                      {guias.map((guia) => (
                        <option key={guia.id} value={guia.id}>
                          {guia.numeroGuia} - {guia.pacienteNome} (
                          {guia.convenioNome})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Especialidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={formDataComGuia.especialidade}
                      onChange={(e) =>
                        setFormDataComGuia({
                          ...formDataComGuia,
                          especialidade: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
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
                        value={formDataComGuia.quantidadeAutorizada}
                        onChange={(e) =>
                          setFormDataComGuia({
                            ...formDataComGuia,
                            quantidadeAutorizada: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
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
                      {submitting ? "Criando..." : "Criar Ficha"}
                    </CustomButton>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="assinatura">
                <form
                  onSubmit={handleCreateFichaAssinatura}
                  className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paciente *
                    </label>
                    <select
                      required
                      value={formDataAssinatura.pacienteId}
                      onChange={(e) =>
                        setFormDataAssinatura({
                          ...formDataAssinatura,
                          pacienteId: e.target.value,
                        })
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
                      Especialidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={formDataAssinatura.especialidade}
                      onChange={(e) =>
                        setFormDataAssinatura({
                          ...formDataAssinatura,
                          especialidade: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
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
                        value={formDataAssinatura.quantidadeAutorizada}
                        onChange={(e) =>
                          setFormDataAssinatura({
                            ...formDataAssinatura,
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
                        value={formDataAssinatura.convenioId}
                        onChange={(e) =>
                          setFormDataAssinatura({
                            ...formDataAssinatura,
                            convenioId: e.target.value,
                          })
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
                        value={formDataAssinatura.mes}
                        onChange={(e) =>
                          setFormDataAssinatura({
                            ...formDataAssinatura,
                            mes: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (mes) => (
                            <option key={mes} value={mes}>
                              {mes.toString().padStart(2, "0")}
                            </option>
                          )
                        )}
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
                        value={formDataAssinatura.ano}
                        onChange={(e) =>
                          setFormDataAssinatura({
                            ...formDataAssinatura,
                            ano: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
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
                      {submitting ? "Criando..." : "Criar Ficha de Assinatura"}
                    </CustomButton>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </FormModal>

          {/* Modal de edição */}
          <FormModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Editar Ficha"
            className="sm:max-w-md">
            <form onSubmit={handleEditFicha} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidade *
                </label>
                <input
                  type="text"
                  required
                  value={formDataComGuia.especialidade}
                  onChange={(e) =>
                    setFormDataComGuia({
                      ...formDataComGuia,
                      especialidade: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formDataComGuia.quantidadeAutorizada}
                  onChange={(e) =>
                    setFormDataComGuia({
                      ...formDataComGuia,
                      quantidadeAutorizada: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mês *
                  </label>
                  <select
                    required
                    value={formDataComGuia.mes}
                    onChange={(e) =>
                      setFormDataComGuia({
                        ...formDataComGuia,
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
                    value={formDataComGuia.ano}
                    onChange={(e) =>
                      setFormDataComGuia({
                        ...formDataComGuia,
                        ano: parseInt(e.target.value),
                      })
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
