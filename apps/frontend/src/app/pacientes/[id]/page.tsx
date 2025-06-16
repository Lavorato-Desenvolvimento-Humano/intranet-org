"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Copy,
  Users,
  Calendar,
  Building,
  FileText,
  Phone,
  Mail,
  MapPin,
  Eye,
  Plus,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { UnidadeBadge } from "@/components/clinical/ui/UnidadeBadge";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { DataTable } from "@/components/clinical/ui/DataTable";
import {
  pacienteService,
  guiaService,
  fichaService,
} from "@/services/clinical";
import {
  PacienteDto,
  GuiaSummaryDto,
  FichaSummaryDto,
  PageResponse,
} from "@/types/clinical";
import toastUtil from "@/utils/toast";

export default function PacienteDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const pacienteId = params.id as string;

  // Estados principais
  const [paciente, setPaciente] = useState<PacienteDto | null>(null);
  const [guias, setGuias] = useState<PageResponse<GuiaSummaryDto>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
  });
  const [fichas, setFichas] = useState<PageResponse<FichaSummaryDto>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "guias" | "fichas">(
    "info"
  );

  // Estados de paginação
  const [guiasPage, setGuiasPage] = useState(0);
  const [fichasPage, setFichasPage] = useState(0);

  // Carregar dados do paciente
  useEffect(() => {
    if (pacienteId) {
      loadPacienteData();
    }
  }, [pacienteId]);

  // Recarregar guias quando a página mudar
  useEffect(() => {
    if (pacienteId && activeTab === "guias") {
      loadGuias();
    }
  }, [pacienteId, guiasPage, activeTab]);

  // Recarregar fichas quando a página mudar
  useEffect(() => {
    if (pacienteId && activeTab === "fichas") {
      loadFichas();
    }
  }, [pacienteId, fichasPage, activeTab]);

  const loadPacienteData = async () => {
    try {
      setLoading(true);
      setError(null);

      const pacienteData = await pacienteService.getPacienteById(pacienteId);
      setPaciente(pacienteData);

      // Carregar dados iniciais das guias e fichas
      await Promise.all([loadGuias(), loadFichas()]);
    } catch (err) {
      console.error("Erro ao carregar dados do paciente:", err);
      setError("Erro ao carregar informações do paciente");
    } finally {
      setLoading(false);
    }
  };

  const loadGuias = async () => {
    try {
      const guiasData = await guiaService.getGuiasByPaciente(
        pacienteId,
        guiasPage,
        10
      );
      setGuias(guiasData);
    } catch (err) {
      console.error("Erro ao carregar guias:", err);
    }
  };

  const loadFichas = async () => {
    try {
      const fichasData = await fichaService.getFichasByPaciente(
        pacienteId,
        fichasPage,
        10
      );
      setFichas(fichasData);
    } catch (err) {
      console.error("Erro ao carregar fichas:", err);
    }
  };

  const handleGuiasPageChange = (page: number) => {
    setGuiasPage(page);
  };

  const handleFichasPageChange = (page: number) => {
    setFichasPage(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Colunas para tabela de guias
  const guiasColumns = [
    {
      header: "Número",
      accessor: "numeroGuia" as keyof GuiaSummaryDto,
      className: "font-medium",
    },
    {
      header: "Especialidades",
      accessor: ((guia: GuiaSummaryDto) =>
        guia.especialidades.join(", ")) as any,
    },
    {
      header: "Quantidade",
      accessor: "quantidadeAutorizada" as keyof GuiaSummaryDto,
      className: "text-center",
    },
    {
      header: "Período",
      accessor: ((guia: GuiaSummaryDto) => `${guia.mes}/${guia.ano}`) as any,
    },
    {
      header: "Validade",
      accessor: ((guia: GuiaSummaryDto) => formatDate(guia.validade)) as any,
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
        </div>
      )) as any,
    },
  ];

  // Colunas para tabela de fichas
  const fichasColumns = [
    {
      header: "Código",
      accessor: "codigoFicha" as keyof FichaSummaryDto,
      className: "font-medium",
    },
    {
      header: "Especialidade",
      accessor: "especialidade" as keyof FichaSummaryDto,
    },
    {
      header: "Quantidade",
      accessor: "quantidadeAutorizada" as keyof FichaSummaryDto,
      className: "text-center",
    },
    {
      header: "Período",
      accessor: ((ficha: FichaSummaryDto) =>
        `${ficha.mes}/${ficha.ano}`) as any,
    },
    {
      header: "Status",
      accessor: ((ficha: FichaSummaryDto) => (
        <StatusBadge status={ficha.status} />
      )) as any,
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
        </div>
      )) as any,
    },
  ];

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
          {/* Header com navegação */}
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
                  <Users className="mr-2 h-6 w-6" />
                  {paciente.nome}
                </h1>
                <p className="text-gray-600 mt-1">Detalhes do paciente</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <CustomButton
                variant="primary"
                onClick={() =>
                  router.push(`/pacientes/${pacienteId}/editar/novo`)
                }>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </CustomButton>
              <CustomButton
                variant="primary"
                onClick={() => router.push(`/pacientes/${pacienteId}/editar`)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </CustomButton>
            </div>
          </div>

          {/* Navegação por tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === "info"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  Informações
                </button>
                <button
                  onClick={() => setActiveTab("guias")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === "guias"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  Guias ({guias.totalElements})
                </button>
                <button
                  onClick={() => setActiveTab("fichas")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === "fichas"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}>
                  Fichas ({fichas.totalElements})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Tab de Informações */}
              {activeTab === "info" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Dados Pessoais
                    </h3>

                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Nome Completo</p>
                        <p className="font-medium">{paciente.nome}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">
                          Data de Nascimento
                        </p>
                        <p className="font-medium">
                          {formatDate(paciente.dataNascimento)}
                          <span className="text-gray-500 ml-2">
                            ({calculateAge(paciente.dataNascimento)} anos)
                          </span>
                        </p>
                      </div>
                    </div>

                    {paciente.responsavel && (
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Responsável</p>
                          <p className="font-medium">{paciente.responsavel}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Convênio</p>
                        <p className="font-medium">{paciente.convenioNome}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Unidade</p>
                        <UnidadeBadge unidade={paciente.unidade} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Informações do Sistema
                    </h3>

                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">ID do Paciente</p>
                        <p className="font-medium font-mono text-sm">
                          {paciente.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Cadastrado em</p>
                        <p className="font-medium">
                          {formatDateTime(paciente.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">
                          Última atualização
                        </p>
                        <p className="font-medium">
                          {formatDateTime(paciente.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Cadastrado por</p>
                        <p className="font-medium">{paciente.createdByName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab de Guias */}
              {activeTab === "guias" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Guias do Paciente
                    </h3>
                    <CustomButton
                      variant="primary"
                      onClick={() =>
                        router.push(`/guias/novo?pacienteId=${pacienteId}`)
                      }>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Guia
                    </CustomButton>
                  </div>

                  {guias.content.length > 0 ? (
                    <DataTable
                      data={guias}
                      columns={guiasColumns}
                      onPageChange={handleGuiasPageChange}
                      loading={loading}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma guia encontrada para este paciente
                    </div>
                  )}
                </div>
              )}

              {/* Tab de Fichas */}
              {activeTab === "fichas" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Fichas do Paciente
                    </h3>
                    <CustomButton
                      variant="primary"
                      onClick={() =>
                        router.push(`/fichas/novo?pacienteId=${pacienteId}`)
                      }>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Ficha
                    </CustomButton>
                  </div>

                  {fichas.content.length > 0 ? (
                    <DataTable
                      data={fichas}
                      columns={fichasColumns}
                      onPageChange={handleFichasPageChange}
                      loading={loading}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma ficha encontrada para este paciente
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
