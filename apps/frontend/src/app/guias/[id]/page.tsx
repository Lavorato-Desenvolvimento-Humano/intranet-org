"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Copy,
  FileText,
  User,
  Calendar,
  Clock,
  DollarSign,
  Building,
  Hash,
  Eye,
  Trash2,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { DataTable } from "@/components/clinical/ui/DataTable";
import { StatusBadge } from "@/components/clinical/ui/StatusBadge";
import { guiaService, fichaService } from "@/services/clinical";
import { GuiaDto, FichaSummaryDto, PageResponse } from "@/types/clinical";
import { formatDate, formatDateTime, calculateAge } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

export default function GuiaDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const guiaId = params.id as string;

  // Estados principais
  const [guia, setGuia] = useState<GuiaDto | null>(null);
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
  const [activeTab, setActiveTab] = useState<"info" | "fichas">("info");
  const [fichasPage, setFichasPage] = useState(0);

  // Carregar dados da guia
  useEffect(() => {
    if (guiaId) {
      loadGuiaData();
    }
  }, [guiaId]);

  // Recarregar fichas quando a página mudar
  useEffect(() => {
    if (guiaId && activeTab === "fichas") {
      loadFichas();
    }
  }, [guiaId, fichasPage, activeTab]);

  const loadGuiaData = async () => {
    try {
      setLoading(true);
      setError(null);

      const guiaData = await guiaService.getGuiaById(guiaId);
      setGuia(guiaData);
    } catch (err) {
      console.error("Erro ao carregar dados da guia:", err);
      setError("Erro ao carregar informações da guia");
    } finally {
      setLoading(false);
    }
  };

  const loadFichas = async () => {
    try {
      if (!guiaId) {
        console.error("Guia ID não fornecido");
        toastUtil.error("Guia não encontrada");
        return;
      }

      console.log("Carregando fichas para a guia:", guiaId);

      const fichasData = await fichaService.getFichasByGuia(
        guiaId,
        fichasPage,
        10
      );

      console.log("Fichas carregadas:", fichasData);
      setFichas(fichasData);
    } catch (err) {
      console.error("Erro ao carregar fichas:", err);
      toastUtil.error("Erro ao carregar fichas");
    }
  };

  const handleFichasPageChange = (page: number) => {
    setFichasPage(page);
  };

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
        `${ficha.mes.toString().padStart(2, "0")}/${ficha.ano}`) as any,
      className: "text-center",
    },
    {
      header: "Status",
      accessor: ((ficha: FichaSummaryDto) => (
        <StatusBadge status={ficha.status} />
      )) as any,
    },
    {
      header: "Criado em",
      accessor: ((ficha: FichaSummaryDto) =>
        formatDate(ficha.createdAt)) as any,
      className: "text-sm text-gray-600",
    },
    {
      header: "Ações",
      accessor: ((ficha: FichaSummaryDto) => (
        <div className="flex space-x-2">
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/fichas/${ficha.id}`)}
            title="Visualizar ficha">
            <Eye className="h-4 w-4" />
          </CustomButton>
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => router.push(`/fichas/${ficha.id}/editar`)}
            title="Editar ficha">
            <Edit className="h-4 w-4" />
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
          <Loading message="Carregando guia..." />
        </main>
      </div>
    );
  }

  if (error || !guia) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error || "Guia não encontrada"}
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
                  <FileText className="mr-2 h-6 w-6" />
                  Guia #{guia.numeroGuia}
                </h1>
                <p className="text-gray-600 mt-1">Detalhes da guia</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <CustomButton
                variant="primary"
                onClick={() => router.push(`/guias/${guiaId}/editar`)}>
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
              {activeTab === "info" && (
                <div className="space-y-6">
                  {/* Status e informações básicas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Status da Guia
                          </h3>
                          <StatusBadge status={guia.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              Número da Guia
                            </p>
                            <p className="font-medium">{guia.numeroGuia}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Validade</p>
                            <p
                              className={`font-medium ${
                                new Date(guia.validade) < new Date()
                                  ? "text-red-600"
                                  : ""
                              }`}>
                              {formatDate(guia.validade)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Resumo
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm">
                            {guia.especialidades.length} especialidade(s)
                          </span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm">
                            R$ {guia.valorReais.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm">
                            {guia.mes.toString().padStart(2, "0")}/{guia.ano}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Paciente */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Informações do Paciente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Nome</p>
                        <p className="font-medium">{guia.pacienteNome}</p>
                      </div>
                      {/* <div>
                        <p className="text-sm text-gray-600">
                          Data de Nascimento
                        </p>
                        <p className="font-medium">
                          {formatDate(guia.pacienteDataNascimento)}
                        </p>
                      </div> */}
                      {/* <div>
                        <p className="text-sm text-gray-600">Idade</p>
                        <p className="font-medium">
                          {calculateAge(guia.pacienteDataNascimento)} anos
                        </p>
                      </div> */}
                      {/* <div>
                        <p className="text-sm text-gray-600">Unidade</p>
                        <p className="font-medium">{guia.pacienteUnidade}</p>
                      </div> */}
                      {guia.usuarioResponsavelId && (
                        <div>
                          <p className="text-sm text-gray-600">Responsável</p>
                          <p className="font-medium">
                            {guia.usuarioResponsavelNome}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações do Convênio */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Building className="mr-2 h-5 w-5" />
                      Informações do Convênio
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Nome</p>
                        <p className="font-medium">{guia.convenioNome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Código</p>
                        <p className="font-medium">
                          {guia.convenioId || "Não informado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes da Guia */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Detalhes da Guia
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Especialidades</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {guia.especialidades.map((esp, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {esp}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Quantidade Autorizada
                        </p>
                        <p className="font-medium">
                          {guia.quantidadeAutorizada}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Valor</p>
                        <p className="font-medium">
                          R$ {guia.valorReais.toFixed(2)}
                        </p>
                      </div>
                      {guia.quantidadeFaturada && (
                        <div>
                          <p className="text-sm text-gray-600">
                            Quantidade Faturada
                          </p>
                          <p className="font-medium">
                            {guia.quantidadeFaturada}
                          </p>
                        </div>
                      )}
                      {guia.lote && (
                        <div>
                          <p className="text-sm text-gray-600">Lote</p>
                          <p className="font-medium">{guia.lote}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Criado em</p>
                        <p className="font-medium">
                          {formatDateTime(guia.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Última atualização
                        </p>
                        <p className="font-medium">
                          {formatDateTime(guia.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "fichas" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Fichas Associadas
                    </h3>
                    <CustomButton
                      variant="primary"
                      onClick={() => router.push("/fichas/novo")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Nova Ficha
                    </CustomButton>
                  </div>

                  <DataTable
                    data={fichas}
                    columns={fichasColumns}
                    onPageChange={handleFichasPageChange}
                    loading={false}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
