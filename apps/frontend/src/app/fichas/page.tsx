"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  FileSignature,
  Link,
  Search,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { DataTable } from "@/components/clinical/ui/DataTable";
import { SearchInput } from "@/components/clinical/ui/SearchInput";
import { FilterDropdown } from "@/components/clinical/ui/FilterDropdown";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { fichaService } from "@/services/clinical";
import convenioService, { ConvenioDto } from "@/services/convenio";
import { useStatus } from "@/hooks/useStatus";
import { FichaSummaryDto, PageResponse } from "@/types/clinical";
import { formatDate } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";
import { VincularGuiaModal } from "@/components/clinical/modals/VincularGuiasModal";
import { TipoFichaBadge } from "@/components/clinical/ui/TipoFichaBadge";

export default function FichasPage() {
  const router = useRouter();

  // Hook para status
  const { statuses, loading: statusLoading } = useStatus();

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

  const [loading, setLoading] = useState(true);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);

  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConvenio, setSelectedConvenio] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedEspecialidade, setSelectedEspecialidade] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [fichaParaVincular, setFichaParaVincular] =
    useState<FichaSummaryDto | null>(null);

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

  // Carregar dados iniciais
  useEffect(() => {
    loadFichas();
    loadConvenios();
  }, [currentPage, selectedConvenio, selectedStatus, selectedEspecialidade]);

  // Busca com debounce
  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     if (searchTerm !== "") {
  //       searchFichas();
  //     } else {
  //       loadFichas();
  //     }
  //   }, 500);

  //   return () => clearTimeout(timeoutId);
  // }, [searchTerm]);

  const loadFichas = async () => {
    try {
      setLoading(true);

      let fichasData: PageResponse<FichaSummaryDto>;

      // Aplicar filtros se necessário
      if (selectedConvenio) {
        fichasData = await fichaService.getFichasByConvenio(
          selectedConvenio,
          currentPage,
          20
        );
      } else if (selectedStatus) {
        fichasData = await fichaService.getFichasByStatus(
          selectedStatus,
          currentPage,
          20
        );
      } else if (selectedEspecialidade) {
        fichasData = await fichaService.searchFichasByEspecialidade(
          selectedEspecialidade,
          currentPage,
          20
        );
      } else {
        fichasData = await fichaService.getAllFichas(currentPage, 20);
      }

      setFichas(fichasData);
    } catch (err) {
      console.error("Erro ao carregar fichas:", err);
      toastUtil.error("Erro ao carregar fichas");
    } finally {
      setLoading(false);
    }
  };

  const searchFichas = async (searchQuery?: string) => {
    try {
      setLoading(true);
      const query = searchQuery || searchTerm;

      console.log("searchFichas chamado com query:", query); // Debug

      if (query.trim() === "") {
        loadFichas();
        return;
      }

      const fichasData = await fichaService.searchByCodigoFicha(
        query.trim(), // Garantir que não há espaços extras
        currentPage,
        20
      );

      console.log("Resultado da busca:", fichasData); // Debug
      setFichas(fichasData);
    } catch (err) {
      console.error("Erro ao buscar fichas:", err);
      toastUtil.error("Erro ao buscar fichas");

      // Em caso de erro, mostrar lista completa
      loadFichas();
    } finally {
      setLoading(false);
    }
  };

  const loadConvenios = async () => {
    try {
      const conveniosData = await convenioService.getAllConvenios();
      setConvenios(conveniosData);
    } catch (err) {
      console.error("Erro ao carregar convênios:", err);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (term: string) => {
    console.log("handleSearch chamado com termo:", term); // Debug

    // Limpar filtros quando iniciar busca
    setSelectedConvenio("");
    setSelectedStatus("");
    setSelectedEspecialidade("");
    setCurrentPage(0);

    // Atualizar estado do termo de busca
    setSearchTerm(term);

    // Se o termo está vazio, recarregar lista completa
    if (term.trim() === "") {
      loadFichas();
      return;
    }

    // Caso contrário, fazer busca por código
    searchFichas(term);
  };

  const handleVincularGuia = (ficha: FichaSummaryDto) => {
    setFichaParaVincular(ficha);
  };

  const handleCloseVincularModal = () => {
    setFichaParaVincular(null);
  };

  const handleVincularSuccess = () => {
    setFichaParaVincular(null);
    loadFichas(); // Recarregar a lista de fichas
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(0);

    switch (filterType) {
      case "convenio":
        setSelectedConvenio(value);
        setSelectedStatus("");
        setSelectedEspecialidade("");
        break;
      case "status":
        setSelectedStatus(value);
        setSelectedConvenio("");
        setSelectedEspecialidade("");
        break;
      case "especialidade":
        setSelectedEspecialidade(value);
        setSelectedConvenio("");
        setSelectedStatus("");
        break;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedConvenio("");
    setSelectedStatus("");
    setSelectedEspecialidade("");
    setCurrentPage(0);

    loadFichas();
  };

  const handleDeleteFicha = async (fichaId: string) => {
    const ficha = fichas.content.find((f) => f.id === fichaId);
    if (!ficha) return;

    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir a ficha ${ficha.codigoFicha}?`
    );

    if (confirmacao) {
      try {
        await fichaService.deleteFicha(fichaId);
        toastUtil.success("Ficha excluída com sucesso!");
        loadFichas(); // Recarregar a lista
      } catch (err) {
        console.error("Erro ao excluir ficha:", err);
        toastUtil.error("Erro ao excluir ficha");
      }
    }
  };

  const handleRefresh = () => {
    loadFichas();
    toastUtil.info("Lista atualizada!");
  };

  const getFichaTypeIcon = (ficha: FichaSummaryDto) => {
    return <FileSignature className="h-4 w-4 text-blue-500" />;
  };

  // Definir colunas da tabela
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
        `${String(ficha.mes).padStart(2, "0")}/${ficha.ano}`) as any,
      className: "text-center",
    },
    {
      header: "Tipo",
      accessor: ((ficha: FichaSummaryDto) =>
        ficha.tipoFicha ? (
          <TipoFichaBadge
            tipoFicha={ficha.tipoFicha}
            temGuia={!!ficha.guiaId}
          />
        ) : null) as any,
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
        <div className="flex space-x-1">
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/fichas/${ficha.id}`)}
            title="Visualizar detalhes">
            <Eye className="h-4 w-4" />
          </CustomButton>
          {/* ✅ Vincular à Guia - apenas para fichas de assinatura sem guia */}
          {ficha.tipoFicha === "ASSINATURA" && !ficha.guiaId && (
            <CustomButton
              variant="primary"
              size="small"
              onClick={() => handleVincularGuia(ficha)}
              title="Vincular à guia"
              className="text-green-600 hover:text-green-800 hover:bg-green-50">
              <Link className="h-4 w-4" />
            </CustomButton>
          )}
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/fichas/${ficha.id}/editar`)}
            title="Editar ficha">
            <Edit className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => handleDeleteFicha(ficha.id)}
            title="Excluir ficha">
            <Trash2 className="h-4 w-4" />
          </CustomButton>
        </div>
      )) as any,
      className: "text-center",
    },
  ];

  if (loading && fichas.content.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando fichas..." />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  // Mostrar loading se ainda estiver carregando status
  if (statusLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando dados do sistema..." />
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
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FileSignature className="mr-2 h-6 w-6" />
                Fichas Clínicas
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie as fichas de atendimento dos pacientes
              </p>
            </div>

            <div className="flex space-x-3">
              <CustomButton
                variant="secondary"
                onClick={handleRefresh}
                disabled={loading}>
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Atualizar
              </CustomButton>
              <CustomButton
                variant="primary"
                onClick={() => router.push("/fichas/novo")}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Ficha
              </CustomButton>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Busca */}
              <div>
                <SearchInput
                  placeholder="Buscar por código da ficha... (pressione Enter)"
                  value={searchTerm}
                  onChange={handleSearch}
                  onEnterSearch={true}
                />
              </div>

              {/* Filtro por Convênio */}
              <div>
                <FilterDropdown
                  placeholder="Convênio"
                  value={selectedConvenio}
                  onChange={(value) => handleFilterChange("convenio", value)}
                  options={convenios.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                />
              </div>

              {/* Filtro por Status */}
              <div>
                <FilterDropdown
                  placeholder="Status"
                  value={selectedStatus}
                  onChange={(value) => handleFilterChange("status", value)}
                  options={statuses.map((s) => ({
                    label: s.status || s.descricao || "",
                    value: s.status,
                  }))}
                />
              </div>

              {/* Filtro por Especialidade */}
              <div>
                <FilterDropdown
                  placeholder="Especialidade"
                  value={selectedEspecialidade}
                  onChange={(value) =>
                    handleFilterChange("especialidade", value)
                  }
                  options={especialidades.map((e) => ({ label: e, value: e }))}
                />
              </div>
            </div>

            {/* Botão para limpar filtros */}
            {(searchTerm ||
              selectedConvenio ||
              selectedStatus ||
              selectedEspecialidade) && (
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {fichas.totalElements} fichas encontradas
                </span>
                <CustomButton
                  variant="primary"
                  size="small"
                  onClick={clearFilters}>
                  Limpar Filtros
                </CustomButton>
              </div>
            )}
          </div>

          {/* Tabela de Fichas */}
          <div className="bg-white rounded-lg shadow-md">
            <DataTable
              data={fichas}
              columns={tableColumns}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </div>

          {/* Estado vazio */}
          {!loading && fichas.content.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma ficha encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ||
                selectedConvenio ||
                selectedStatus ||
                selectedEspecialidade
                  ? "Nenhuma ficha corresponde aos critérios de busca."
                  : "Comece criando sua primeira ficha clínica."}
              </p>
              <CustomButton
                variant="primary"
                onClick={() => router.push("/fichas/novo")}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Ficha
              </CustomButton>
            </div>
          )}
        </main>
      </div>
      {fichaParaVincular && (
        <VincularGuiaModal
          fichaId={fichaParaVincular.id}
          pacienteNome={fichaParaVincular.pacienteNome}
          especialidade={fichaParaVincular.especialidade}
          onClose={handleCloseVincularModal}
          onSuccess={handleVincularSuccess}
          isOpen={true}
        />
      )}
    </ProtectedRoute>
  );
}
