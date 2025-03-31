"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, Clock, Filter, FileText } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import DataTable from "@/components/ui/data-table";
import { useAuth } from "@/context/AuthContext";
import postagemService, { PostagemSummaryDto } from "@/services/postagem";
import convenioService, { ConvenioDto } from "@/services/convenio";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";

export default function PostagensPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [postagens, setPostagens] = useState<PostagemSummaryDto[]>([]);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConvenio, setSelectedConvenio] = useState<string>("todos");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Verificar permissões
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const isUser =
    user?.roles?.includes("ROLE_USER") || user?.roles?.includes("USER");
  const canCreatePostagem = isAdmin || isEditor || isUser;

  // Carregar dados das postagens e convênios
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Carregar dados em paralelo
        const [postagensData, conveniosData] = await Promise.all([
          postagemService.getAllPostagens(),
          convenioService.getAllConvenios(),
        ]);

        setPostagens(postagensData.content || []);
        setConvenios(conveniosData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError(
          "Não foi possível carregar as postagens. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Filtrar postagens com base na pesquisa e no convênio selecionado
  const filteredPostagens = postagens.filter((postagem) => {
    const matchesSearch =
      postagem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postagem.createdByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postagem.convenioName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesConvenio =
      selectedConvenio === "todos" || postagem.convenioId === selectedConvenio;

    return matchesSearch && matchesConvenio;
  });

  // Definição das colunas da tabela
  const columns = [
    {
      key: "title",
      header: "Título",
      width: "40%",
      render: (value: string, record: PostagemSummaryDto) => (
        <div className="font-medium text-primary hover:text-primary-dark">
          {value}
        </div>
      ),
    },
    {
      key: "convenioName",
      header: "Convênio",
      width: "20%",
      render: (value: string) => <div className="text-gray-700">{value}</div>,
    },
    {
      key: "createdByName",
      header: "Autor",
      width: "15%",
      render: (value: string) => <div className="text-gray-700">{value}</div>,
    },
    {
      key: "createdAt",
      header: "Data de Criação",
      width: "20%",
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
    {
      key: "features",
      header: "Recursos",
      width: "5%",
      render: (_: any, record: PostagemSummaryDto) => (
        <div className="flex space-x-1">
          {record.hasImagens && (
            <span
              title="Possui imagens"
              className="w-2 h-2 bg-blue-500 rounded-full"></span>
          )}
          {record.hasAnexos && (
            <span
              title="Possui anexos"
              className="w-2 h-2 bg-green-500 rounded-full"></span>
          )}
          {record.hasTabelas && (
            <span
              title="Possui tabelas"
              className="w-2 h-2 bg-purple-500 rounded-full"></span>
          )}
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          <Breadcrumb
            items={[
              { label: "Convênios", href: "/convenios" },
              { label: "Postagens" },
            ]}
          />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Postagens</h1>
            {canCreatePostagem && (
              <CustomButton
                variant="primary"
                icon={Plus}
                onClick={() => router.push("/postagens/nova")}>
                Nova Postagem
              </CustomButton>
            )}
          </div>

          {/* Barra de pesquisa e filtros */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Pesquisar postagens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
              <div>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  <Filter size={18} className="mr-2 text-gray-500" />
                  <span>Filtros</span>
                </button>
              </div>
            </div>

            {isFilterOpen && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="convenio-filter"
                      className="block text-sm font-medium text-gray-700 mb-1">
                      Filtrar por Convênio
                    </label>
                    <select
                      id="convenio-filter"
                      value={selectedConvenio}
                      onChange={(e) => setSelectedConvenio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="todos">Todos os Convênios</option>
                      {convenios.map((convenio) => (
                        <option key={convenio.id} value={convenio.id}>
                          {convenio.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <div className="flex space-x-4 items-center">
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                        <span className="text-sm text-gray-600">Imagens</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                        <span className="text-sm text-gray-600">Anexos</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-purple-500 rounded-full mr-1"></span>
                        <span className="text-sm text-gray-600">Tabelas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <Loading message="Carregando postagens..." />
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              {error}
            </div>
          ) : (
            <DataTable
              data={filteredPostagens}
              columns={columns}
              keyExtractor={(item) => item.id}
              searchable={false} // Já temos nossa própria pesquisa
              onRowClick={(postagem) =>
                router.push(`/postagens/${postagem.id}`)
              }
              emptyMessage={
                searchTerm || selectedConvenio !== "todos"
                  ? "Nenhuma postagem encontrada com os filtros aplicados."
                  : "Nenhuma postagem encontrada."
              }
              title="Lista de Postagens"
            />
          )}

          {!loading &&
            filteredPostagens.length === 0 &&
            postagens.length > 0 && (
              <div className="mt-4">
                <CustomButton
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedConvenio("todos");
                  }}>
                  Limpar Filtros
                </CustomButton>
              </div>
            )}

          {!loading && postagens.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FileText size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-6">
                Nenhuma postagem foi encontrada no sistema.
              </p>
              {canCreatePostagem && (
                <CustomButton
                  variant="primary"
                  icon={Plus}
                  onClick={() => router.push("/postagens/nova")}>
                  Criar Primeira Postagem
                </CustomButton>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
