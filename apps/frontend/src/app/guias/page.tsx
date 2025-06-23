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
  DollarSign,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { DataTable } from "@/components/clinical/ui/DataTable";
import { SearchInput } from "@/components/clinical/ui/SearchInput";
import { FilterDropdown } from "@/components/clinical/ui/FilterDropdown";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { guiaService } from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import { GuiaSummaryDto, PageResponse } from "@/types/clinical";
import toastUtil from "@/utils/toast";

export default function GuiasPage() {
  const router = useRouter();

  // Estados principais
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
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConvenio, setSelectedConvenio] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPeriodo, setSelectedPeriodo] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Recarregar quando filtros mudarem
  useEffect(() => {
    loadGuias();
  }, [
    searchTerm,
    selectedConvenio,
    selectedStatus,
    selectedPeriodo,
    currentPage,
  ]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [conveniosData] = await Promise.all([
        convenioService.getAllConvenios(),
      ]);

      setConvenios(conveniosData);
      await loadGuias();
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar informações");
    } finally {
      setLoading(false);
    }
  };

  const loadGuias = async () => {
    try {
      if (!loading) setLoading(true);

      const filters = {
        search: searchTerm,
        convenioId: selectedConvenio,
        status: selectedStatus,
        periodo: selectedPeriodo,
      };

      const guiasData = await guiaService.getAllGuias(currentPage, 20);
      setGuias(guiasData);
    } catch (err) {
      console.error("Erro ao carregar guias:", err);
      toastUtil.error("Erro ao carregar guias");
    } finally {
      setLoading(false);
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

  // Configuração das colunas da tabela
  const columns = [
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
      header: "Convênio",
      accessor: "convenioNome" as keyof GuiaSummaryDto,
    },
    {
      header: "Especialidades",
      accessor: ((guia: GuiaSummaryDto) =>
        guia.especialidades.slice(0, 2).join(", ") +
        (guia.especialidades.length > 2 ? "..." : "")) as any,
    },
    {
      header: "Status",
      accessor: ((guia: GuiaSummaryDto) => (
        <StatusBadge status={guia.status} />
      )) as any,
    },
    {
      header: "Quantidade",
      accessor: "quantidadeAutorizada" as keyof GuiaSummaryDto,
      className: "text-center",
    },
    {
      header: "Período",
      accessor: ((guia: GuiaSummaryDto) =>
        `${guia.mes.toString().padStart(2, "0")}/${guia.ano}`) as any,
      className: "text-center",
    },
    {
      header: "Valor",
      accessor: ((guia: GuiaSummaryDto) =>
        `R$ ${guia.valorReais.toFixed(2)}`) as any,
      className: "text-right",
    },
    {
      header: "Validade",
      accessor: ((guia: GuiaSummaryDto) => (
        <div>
          <span
            className={`${
              new Date(guia.validade) < new Date() ? "text-red-600" : ""
            }`}>
            {formatDate(guia.validade)}
          </span>
        </div>
      )) as any,
    },
    {
      header: "Ações",
      accessor: ((guia: GuiaSummaryDto) => (
        <div className="flex space-x-2">
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/guias/${guia.id}`)}
            title="Visualizar guia">
            <Eye className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/guias/${guia.id}/editar`)}
            title="Editar guia">
            <Edit className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => handleDeleteGuia(guia)}
            title="Excluir guia">
            <Trash2 className="h-4 w-4" />
          </CustomButton>
        </div>
      )) as any,
    },
  ];

  // Opções para o filtro de período
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

  // Opções para o filtro de status
  const statusOptions = [
    { label: "Emitido", value: "EMITIDO" },
    { label: "Subiu", value: "SUBIU" },
    { label: "Em Análise", value: "ANALISE" },
    { label: "Cancelado", value: "CANCELADO" },
    { label: "Saiu", value: "SAIU" },
    { label: "Retornou", value: "RETORNOU" },
    { label: "Não Usou", value: "NAO USOU" },
    { label: "Assinado", value: "ASSINADO" },
    { label: "Faturado", value: "FATURADO" },
    { label: "Enviado a BM", value: "ENVIADO A BM" },
    { label: "Devolvido BM", value: "DEVOLVIDO BM" },
    { label: "Perdida", value: "PERDIDA" },
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
              <p className="text-gray-600 mt-1">Gerencie as guias do sistema</p>
            </div>
            <CustomButton
              variant="primary"
              onClick={() => router.push("/guias/novo")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Guia
            </CustomButton>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por paciente, número..."
              />

              <FilterDropdown
                value={selectedConvenio}
                onChange={setSelectedConvenio}
                options={convenios.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
                placeholder="Filtrar por convênio"
              />

              <FilterDropdown
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={statusOptions}
                placeholder="Filtrar por status"
              />

              <FilterDropdown
                value={selectedPeriodo}
                onChange={setSelectedPeriodo}
                options={periodoOptions}
                placeholder="Filtrar por período"
              />

              <div className="flex space-x-2">
                <CustomButton
                  variant="primary"
                  onClick={clearFilters}
                  className="flex-1">
                  Limpar Filtros
                </CustomButton>
              </div>
            </div>

            {/* Resumo dos resultados */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{guias.totalElements} guia(s) encontrada(s)</span>
              {(searchTerm ||
                selectedConvenio ||
                selectedStatus ||
                selectedPeriodo) && (
                <span className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Filtros aplicados
                </span>
              )}
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-lg shadow-md">
            <DataTable
              data={guias}
              columns={columns}
              onPageChange={setCurrentPage}
              loading={loading}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
