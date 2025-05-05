// Modificações em src/app/postagens/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Calendar,
  Clock,
  Filter,
  FileText,
  Users,
  Building,
  Globe,
  UserIcon,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import DataTable from "@/components/ui/data-table";
import { useAuth } from "@/context/AuthContext";
import postagemService, { PostagemSummaryDto } from "@/services/postagem";
import convenioService, { ConvenioDto } from "@/services/convenio";
import equipeService, { EquipeDto } from "@/services/equipe";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";

export default function PostagensPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [postagens, setPostagens] = useState<PostagemSummaryDto[]>([]);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [equipes, setEquipes] = useState<EquipeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipoDestino, setSelectedTipoDestino] =
    useState<string>("todos");
  const [selectedConvenio, setSelectedConvenio] = useState<string>("todos");
  const [selectedEquipe, setSelectedEquipe] = useState<string>("todos");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Verificar permissões
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const isUser =
    user?.roles?.includes("ROLE_USER") || user?.roles?.includes("USER");
  const canCreatePostagem = isAdmin || isEditor;

  // Carregar dados das postagens, convênios e equipes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Carregar dados em paralelo
        const [postagensData, conveniosData, equipesData] = await Promise.all([
          postagemService.getPostagensVisiveis(),
          convenioService.getAllConvenios(),
          equipeService.getAllEquipes(),
        ]);

        setPostagens(postagensData);
        setConvenios(conveniosData);
        setEquipes(equipesData);
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

  // Filtrar postagens com base na pesquisa e nos filtros
  const filteredPostagens = postagens.filter((postagem) => {
    // Filtrar por termo de pesquisa
    const matchesSearch =
      postagem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postagem.createdByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (postagem.convenioName &&
        postagem.convenioName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (postagem.equipeName &&
        postagem.equipeName.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtrar por tipo de destino
    const matchesTipoDestino =
      selectedTipoDestino === "todos" ||
      postagem.tipoDestino === selectedTipoDestino;

    // Filtrar por convênio
    const matchesConvenio =
      selectedConvenio === "todos" || postagem.convenioId === selectedConvenio;

    // Filtrar por equipe
    const matchesEquipe =
      selectedEquipe === "todos" || postagem.equipeId === selectedEquipe;

    return (
      matchesSearch && matchesTipoDestino && matchesConvenio && matchesEquipe
    );
  });

  // Renderizar ícone baseado no tipo de destino
  const renderTipoDestinoIcon = (tipoDestino: string) => {
    switch (tipoDestino) {
      case "geral":
        return <Globe size={16} className="mr-1 text-blue-500" />;
      case "equipe":
        return <Users size={16} className="mr-1 text-green-500" />;
      case "convenio":
        return <Building size={16} className="mr-1 text-purple-500" />;
      default:
        return null;
    }
  };

  // Função para formatar o nome do destino
  const formatDestino = (postagem: PostagemSummaryDto) => {
    switch (postagem.tipoDestino) {
      case "geral":
        return "Todos os usuários";
      case "equipe":
        return postagem.equipeName || "Equipe";
      case "convenio":
        return postagem.convenioName || "Convênio";
      default:
        return "";
    }
  };

  // Definição das colunas da tabela
  const columns = [
    {
      key: "title",
      header: "Título",
      width: "35%",
      render: (value: string, record: PostagemSummaryDto) => (
        <div className="font-medium text-primary hover:text-primary-dark">
          {value}
        </div>
      ),
    },
    {
      key: "tipoDestino",
      header: "Visibilidade",
      width: "20%",
      render: (_: string, record: PostagemSummaryDto) => (
        <div className="flex items-center text-gray-700">
          {renderTipoDestinoIcon(record.tipoDestino)}
          {formatDestino(record)}
        </div>
      ),
    },
    {
      key: "createdByName",
      header: "Autor",
      width: "15%",
      render: (value: string, record: PostagemSummaryDto) => (
        <div className="flex items-center text-gray-700">
          {record.createdByProfileImage ? (
            <div className="mr-2 relative w-6 h-6 rounded-full overflow-hidden">
              <Image
                src={record.createdByProfileImage}
                alt={`Foto de ${value}`}
                width={24}
                height={24}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="mr-2 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon size={12} className="text-gray-500" />
            </div>
          )}
          <span>{value}</span>
        </div>
      ),
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
      width: "10%",
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

  // Tipo de botão baseado no tipo de destino selecionado
  const getAddButtonText = () => {
    switch (selectedTipoDestino) {
      case "geral":
        return "Nova Postagem Geral";
      case "equipe":
        return "Nova Postagem para Equipe";
      case "convenio":
        return "Nova Postagem para Convênio";
      default:
        return "Nova Postagem";
    }
  };

  // URL para criar nova postagem baseada nos filtros
  const getNewPostagemUrl = () => {
    let url = "/postagens/nova";
    const params = new URLSearchParams();

    if (selectedTipoDestino !== "todos") {
      params.append("tipoDestino", selectedTipoDestino);

      if (selectedTipoDestino === "convenio" && selectedConvenio !== "todos") {
        params.append("convenioId", selectedConvenio);
      }

      if (selectedTipoDestino === "equipe" && selectedEquipe !== "todos") {
        params.append("equipeId", selectedEquipe);
      }
    }

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto p-6">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Postagens" },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Postagens</h1>
          {canCreatePostagem && (
            <CustomButton
              variant="primary"
              icon={Plus}
              onClick={() => router.push(getNewPostagemUrl())}>
              {getAddButtonText()}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="tipo-filter"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Visibilidade
                  </label>
                  <select
                    id="tipo-filter"
                    value={selectedTipoDestino}
                    onChange={(e) => {
                      setSelectedTipoDestino(e.target.value);
                      // Resetar filtros relacionados quando mudar o tipo
                      if (e.target.value !== "convenio")
                        setSelectedConvenio("todos");
                      if (e.target.value !== "equipe")
                        setSelectedEquipe("todos");
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option value="todos">Todos os tipos</option>
                    <option value="geral">Geral (todos os usuários)</option>
                    <option value="equipe">Equipes</option>
                    <option value="convenio">Convênios</option>
                  </select>
                </div>

                {(selectedTipoDestino === "convenio" ||
                  selectedTipoDestino === "todos") && (
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
                )}

                {(selectedTipoDestino === "equipe" ||
                  selectedTipoDestino === "todos") && (
                  <div>
                    <label
                      htmlFor="equipe-filter"
                      className="block text-sm font-medium text-gray-700 mb-1">
                      Filtrar por Equipe
                    </label>
                    <select
                      id="equipe-filter"
                      value={selectedEquipe}
                      onChange={(e) => setSelectedEquipe(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="todos">Todas as Equipes</option>
                      {equipes.map((equipe) => (
                        <option key={equipe.id} value={equipe.id}>
                          {equipe.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
            onRowClick={(postagem) => router.push(`/postagens/${postagem.id}`)}
            emptyMessage={
              searchTerm ||
              selectedTipoDestino !== "todos" ||
              selectedConvenio !== "todos" ||
              selectedEquipe !== "todos"
                ? "Nenhuma postagem encontrada com os filtros aplicados."
                : "Nenhuma postagem encontrada."
            }
            title="Lista de Postagens"
          />
        )}

        {!loading && filteredPostagens.length === 0 && postagens.length > 0 && (
          <div className="mt-4">
            <CustomButton
              variant="secondary"
              onClick={() => {
                setSearchTerm("");
                setSelectedTipoDestino("todos");
                setSelectedConvenio("todos");
                setSelectedEquipe("todos");
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
  );
}
