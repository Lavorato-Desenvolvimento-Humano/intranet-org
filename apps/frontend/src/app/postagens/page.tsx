"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, FileText } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { CustomButton } from "@/components/ui/custom-button";
import { PostCard } from "@/components/postagem/PostCard"; // Importando o novo componente
import { useAuth } from "@/context/AuthContext";
import postagemService, { PostagemSummaryDto } from "@/services/postagem";
import convenioService, { ConvenioDto } from "@/services/convenio";
import equipeService, { EquipeDto } from "@/services/equipe";
import { cn } from "@/utils/cn";

export default function PostagensPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Estados de Dados
  const [postagens, setPostagens] = useState<PostagemSummaryDto[]>([]);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [equipes, setEquipes] = useState<EquipeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipoDestino, setSelectedTipoDestino] =
    useState<string>("todos");
  const [selectedConvenio, setSelectedConvenio] = useState<string>("todos");
  const [selectedEquipe, setSelectedEquipe] = useState<string>("todos");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Permissões
  const isAdmin = user?.roles?.some((role) =>
    ["ROLE_ADMIN", "ADMIN"].includes(role)
  );
  const isEditor = user?.roles?.some((role) =>
    ["ROLE_EDITOR", "EDITOR"].includes(role)
  );
  const canCreatePostagem = isAdmin || isEditor;

  // Carregamento de Dados
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const postagensPromise = isAdmin
          ? postagemService.getAllPostagensForAdmin()
          : postagemService.getPostagensVisiveis();

        const [postagensData, conveniosData, equipesData] = await Promise.all([
          postagensPromise,
          convenioService.getAllConvenios(),
          equipeService.getAllEquipes(),
        ]);

        // Ordenação: Mais recentes primeiro
        const sorted = postagensData.sort(
          (a, b) =>
            new Date(b.createdAt.toString()).getTime() -
            new Date(a.createdAt.toString()).getTime()
        );

        setPostagens(sorted);
        setConvenios(conveniosData);
        setEquipes(equipesData);
      } catch (err) {
        console.error("Erro ao carregar feed:", err);
        setError("Não foi possível carregar as postagens.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  // Lógica de Filtragem
  const filteredPostagens = postagens.filter((postagem) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      postagem.title.toLowerCase().includes(term) ||
      postagem.createdByName.toLowerCase().includes(term) ||
      postagem.convenioName?.toLowerCase().includes(term) ||
      postagem.equipeName?.toLowerCase().includes(term);

    const matchesTipo =
      selectedTipoDestino === "todos" ||
      postagem.tipoDestino === selectedTipoDestino;
    const matchesConvenio =
      selectedConvenio === "todos" || postagem.convenioId === selectedConvenio;
    const matchesEquipe =
      selectedEquipe === "todos" || postagem.equipeId === selectedEquipe;

    return matchesSearch && matchesTipo && matchesConvenio && matchesEquipe;
  });

  const handleCreateClick = () => {
    let url = "/postagens/nova";
    const params = new URLSearchParams();
    if (selectedTipoDestino !== "todos")
      params.append("tipoDestino", selectedTipoDestino);
    if (selectedTipoDestino === "convenio" && selectedConvenio !== "todos")
      params.append("convenioId", selectedConvenio);
    if (selectedTipoDestino === "equipe" && selectedEquipe !== "todos")
      params.append("equipeId", selectedEquipe);

    const qs = params.toString();
    router.push(qs ? `${url}?${qs}` : url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto p-4 md:p-6 max-w-7xl">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Mural de Avisos" },
          ]}
        />

        {/* --- Header da Página --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
              Mural de Avisos
            </h1>
            <p className="text-gray-500 mt-1">
              Acompanhe as últimas atualizações da organização.
            </p>
          </div>
          {canCreatePostagem && (
            <CustomButton
              variant="primary"
              icon={Plus}
              onClick={handleCreateClick}
              className="shadow-sm">
              Criar Publicação
            </CustomButton>
          )}
        </div>

        {/* --- Área de Busca e Filtros --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8 sticky top-4 z-20">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Buscar por título, autor ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>

            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center justify-center px-4 py-2.5 border rounded-lg transition-colors font-medium text-sm whitespace-nowrap",
                isFilterOpen
                  ? "bg-primary/5 border-primary text-primary"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              )}>
              <Filter size={18} className="mr-2" />
              Filtros
              {selectedTipoDestino !== "todos" && (
                <span className="ml-2 flex h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {/* Filtros Expansíveis */}
          {isFilterOpen && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                  Visibilidade
                </label>
                <select
                  value={selectedTipoDestino}
                  onChange={(e) => {
                    setSelectedTipoDestino(e.target.value);
                    if (e.target.value !== "convenio")
                      setSelectedConvenio("todos");
                    if (e.target.value !== "equipe") setSelectedEquipe("todos");
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm">
                  <option value="todos">Todas</option>
                  <option value="geral">Geral (Todos)</option>
                  <option value="equipe">Equipes</option>
                  <option value="convenio">Convênios</option>
                </select>
              </div>

              {(selectedTipoDestino === "convenio" ||
                selectedTipoDestino === "todos") && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                    Convênio
                  </label>
                  <select
                    value={selectedConvenio}
                    onChange={(e) => setSelectedConvenio(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm">
                    <option value="todos">Todos</option>
                    {convenios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(selectedTipoDestino === "equipe" ||
                selectedTipoDestino === "todos") && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                    Equipe
                  </label>
                  <select
                    value={selectedEquipe}
                    onChange={(e) => setSelectedEquipe(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm">
                    <option value="todos">Todas</option>
                    {equipes.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- Grid de Posts (Feed) --- */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl h-72 animate-pulse shadow-sm border border-gray-100"></div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-700 p-8 rounded-xl flex flex-col items-center justify-center text-center">
            <p className="font-medium mb-3">{error}</p>
            <CustomButton
              variant="secondary"
              onClick={() => window.location.reload()}>
              Tentar Novamente
            </CustomButton>
          </div>
        ) : filteredPostagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Nenhuma publicação encontrada
            </h3>
            <p className="text-gray-500 max-w-md text-center mb-6">
              Não encontramos postagens com os filtros selecionados.
            </p>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {filteredPostagens.map((postagem) => (
              <PostCard
                key={postagem.id}
                postagem={postagem}
                onClick={() => router.push(`/postagens/${postagem.id}`)}
                showEditButton={canCreatePostagem ?? false}
                onEdit={(e) => {
                  e.stopPropagation();
                  router.push(`/postagens/${postagem.id}/editar`);
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
