// src/app/convenios/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Edit,
  FileText,
  FilePlus,
  Table,
  ArrowLeft,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import DataTable from "@/components/ui/data-table";
import { useAuth } from "@/context/AuthContext";
import convenioService, {
  ConvenioDto,
  PostagemSummaryDto,
} from "@/services/convenio";
import tabelaValoresService, {
  TabelaValoresDto,
} from "@/services/tabelaValores";
import fichaPdfService from "@/services/ficha-pdf";
import ContentViewer from "@/components/ui/content-viewer";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";

export default function ConvenioViewPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [convenio, setConvenio] = useState<ConvenioDto | null>(null);
  const [postagens, setPostagens] = useState<PostagemSummaryDto[]>([]);
  const [tabelas, setTabelas] = useState<TabelaValoresDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"postagens" | "tabelas">(
    "postagens"
  );
  const [isSaving, setIsSaving] = useState(false);

  const convenioId = params?.id as string;

  // Verificar permissões
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const isUser =
    user?.roles?.includes("ROLE_USER") || user?.roles?.includes("USER");
  const canEdit = isAdmin || isEditor;
  const canCreatePostagem = isAdmin || isEditor;
  const canCreateTabela = isAdmin || isEditor;
  const canManagePdf = isAdmin;

  // Buscar dados do convênio
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Buscar convênio, postagens e tabelas em paralelo
        const [convenioData, postagensData, tabelasData] = await Promise.all([
          convenioService.getConvenioById(convenioId),
          convenioService.getPostagens(convenioId),
          tabelaValoresService.getTabelasByConvenio(convenioId),
        ]);

        setConvenio(convenioData);
        setPostagens(postagensData);
        setTabelas(tabelasData);
      } catch (err) {
        console.error("Erro ao buscar dados do convênio:", err);
        setError(
          "Não foi possível carregar os dados do convênio. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    if (convenioId) {
      fetchData();
    }
  }, [convenioId]);

  const handlePdfHabilitadoChange = async (habilitado: boolean) => {
    if (!convenio) return;

    setIsSaving(true);
    try {
      await fichaPdfService.toggleConvenioHabilitado(convenio.id, habilitado);
      setConvenio((prev) => (prev ? { ...prev, pdfHabilitado: habilitado } : null));
      toast.success(
        `Geração de PDF ${habilitado ? "habilitada" : "desabilitada"} com sucesso!`
      );
    } catch (error) {
      console.error("Erro ao alterar status de geração de PDF:", error);
      toast.error("Falha ao alterar status. Tente novamente.");
      // Reverter a mudança no estado em caso de erro
      setConvenio((prev) => (prev ? { ...prev, pdfHabilitado: !habilitado } : null));
    } finally {
      setIsSaving(false);
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para formatar hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Colunas da tabela de postagens
  const postagensColumns = [
    {
      key: "title",
      header: "Título",
      width: "50%",
      render: (value: string, postagem: PostagemSummaryDto) => (
        <div className="text-primary hover:text-primary-dark font-medium">
          {value}
        </div>
      ),
    },
    {
      key: "createdByName",
      header: "Autor",
      width: "20%",
      render: (value: string) => <div className="text-gray-700">{value}</div>,
    },
    {
      key: "createdAt",
      header: "Data de Criação",
      width: "30%",
      sortable: true,
      render: (value: string) => (
        <div className="text-gray-600 flex items-center">
          <Calendar size={16} className="mr-1 text-gray-400" />
          {formatDate(value)}
          <Clock size={16} className="ml-2 mr-1 text-gray-400" />
          {formatTime(value)}
        </div>
      ),
    },
  ];

  // Colunas da tabela de tabelas de valores
  const tabelasColumns = [
    {
      key: "nome",
      header: "Nome",
      width: "50%",
      render: (value: string, tabela: TabelaValoresDto) => (
        <div className="text-primary hover:text-primary-dark font-medium">
          {value}
        </div>
      ),
    },
    {
      key: "createdByName",
      header: "Autor",
      width: "20%",
      render: (value: string) => <div className="text-gray-700">{value}</div>,
    },
    {
      key: "createdAt",
      header: "Data de Criação",
      width: "30%",
      sortable: true,
      render: (value: string) => (
        <div className="text-gray-600 flex items-center">
          <Calendar size={16} className="mr-1 text-gray-400" />
          {formatDate(value)}
          <Clock size={16} className="ml-2 mr-1 text-gray-400" />
          {formatTime(value)}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando dados do convênio..." />
        </main>
      </div>
    );
  }

  if (error || !convenio) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            {error || "Convênio não encontrado."}
          </div>
          <button
            onClick={() => router.push("/convenios")}
            className="flex items-center text-primary hover:text-primary-dark"
          >
            <ArrowLeft size={16} className="mr-1" />
            Voltar para a lista de convênios
          </button>
        </main>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          <Breadcrumb
            items={[
              { label: "Convênios", href: "/convenios" },
              { label: convenio.name },
            ]}
          />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {convenio.name}
            </h1>
            {canEdit && (
              <CustomButton
                variant="primary"
                icon={Edit}
                onClick={() => router.push(`/convenios/${convenioId}/editar`)}
              >
                Editar
              </CustomButton>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Detalhes do Convênio
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nome:</p>
                  <p className="text-gray-800">{convenio.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Criação:</p>
                  <p className="text-gray-800">
                    {formatDate(convenio.createdAt)} às{" "}
                    {formatTime(convenio.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {convenio.description && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Descrição:</p>
                <ContentViewer
                  content={convenio.description}
                  className="text-gray-800"
                />
              </div>
            )}

            {canManagePdf && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-800 mb-2">
                  Configurações de Ficha PDF
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Habilitar Geração de Ficha PDF
                    </p>
                    <p className="text-xs text-gray-500">
                      Permite que este convênio seja usado para gerar fichas em
                      PDF.
                    </p>
                  </div>
                  <Switch
                    checked={convenio.pdfHabilitado}
                    onCheckedChange={handlePdfHabilitadoChange}
                    disabled={isSaving}
                    aria-label="Habilitar Geração de Ficha PDF"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Abas para Postagens e Tabelas de Valores */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("postagens")}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "postagens"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <FileText size={16} className="mr-2" />
                    Postagens ({postagens.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("tabelas")}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "tabelas"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <Table size={16} className="mr-2" />
                    Tabelas de Valores ({tabelas.length})
                  </div>
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "postagens" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Postagens
                    </h2>
                    {canCreatePostagem && (
                      <CustomButton
                        onClick={() =>
                          router.push(
                            `/postagens/nova?convenioId=${convenioId}`
                          )
                        }
                        variant="primary"
                        icon={FilePlus}
                      >
                        Nova Postagem
                      </CustomButton>
                    )}
                  </div>
                  {postagens.length === 0 ? (
                    <div className="bg-gray-50 p-8 text-center rounded-md">
                      <FileText
                        size={48}
                        className="mx-auto text-gray-400 mb-2"
                      />
                      <p className="text-gray-600 mb-4">
                        Nenhuma postagem encontrada para este convênio.
                      </p>
                      {canCreatePostagem && (
                        <CustomButton
                          onClick={() =>
                            router.push(
                              `/postagens/nova?convenioId=${convenioId}`
                            )
                          }
                          variant="primary"
                          icon={FilePlus}
                        >
                          Criar Primeira Postagem
                        </CustomButton>
                      )}
                    </div>
                  ) : (
                    <DataTable
                      data={postagens}
                      columns={postagensColumns}
                      keyExtractor={(item) => item.id}
                      searchable
                      searchKeys={["title", "createdByName"]}
                      onRowClick={(postagem) =>
                        router.push(`/postagens/${postagem.id}`)
                      }
                      emptyMessage="Nenhuma postagem encontrada."
                      showHeader={false}
                    />
                  )}
                </div>
              )}

              {activeTab === "tabelas" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Tabelas de Valores
                    </h2>
                    {canCreateTabela && (
                      <CustomButton
                        onClick={() =>
                          router.push(
                            `/tabelas-valores/nova?convenioId=${convenioId}`
                          )
                        }
                        variant="primary"
                        icon={FilePlus}
                      >
                        Nova Tabela
                      </CustomButton>
                    )}
                  </div>
                  {tabelas.length === 0 ? (
                    <div className="bg-gray-50 p-8 text-center rounded-md">
                      <Table size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 mb-4">
                        Nenhuma tabela de valores encontrada para este convênio.
                      </p>
                      {canCreateTabela && (
                        <CustomButton
                          onClick={() =>
                            router.push(
                              `/tabelas-valores/nova?convenioId=${convenioId}`
                            )
                          }
                          variant="primary"
                          icon={FilePlus}
                        >
                          Criar Primeira Tabela
                        </CustomButton>
                      )}
                    </div>
                  ) : (
                    <DataTable
                      data={tabelas}
                      columns={tabelasColumns}
                      keyExtractor={(item) => item.id}
                      searchable
                      searchKeys={["nome", "createdByName"]}
                      onRowClick={(tabela) =>
                        router.push(`/tabelas-valores/${tabela.id}`)
                      }
                      emptyMessage="Nenhuma tabela de valores encontrada."
                      showHeader={false}
                    />
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

