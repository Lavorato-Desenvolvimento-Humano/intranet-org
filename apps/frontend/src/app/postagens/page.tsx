// apps/frontend/src/app/postagens/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Users,
  Building,
  Globe,
  PenSquare,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { CustomButton } from "@/components/ui/custom-button";
import { PostCard } from "@/components/postagem/PostCard";
import { useAuth } from "@/context/AuthContext";
import postagemService, { PostagemSummaryDto } from "@/services/postagem";
import convenioService, { ConvenioDto } from "@/services/convenio";
import equipeService, { EquipeDto } from "@/services/equipe";
import ProfileAvatar from "@/components/profile/profile-avatar";
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
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow container mx-auto p-4 md:py-8 md:px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* --- SIDEBAR ESQUERDA (Menu de Navegação/Filtros) --- */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24 space-y-4">
            {/* Card do Perfil Resumido */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
              <ProfileAvatar
                profileImage={user?.profileImage}
                userName={user?.fullName || "Usuário"}
                size={64}
                className="mb-3"
              />
              <h3 className="font-bold text-gray-800">{user?.fullName}</h3>
              <p className="text-xs text-gray-500 mb-4">{user?.email}</p>
              <div className="w-full border-t border-gray-100 pt-3 flex justify-around text-sm">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800">
                    {postagens.filter((p) => p.createdById === user?.id).length}
                  </span>
                  <span className="text-gray-500 text-xs">Posts</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800">0</span>
                  <span className="text-gray-500 text-xs">Views</span>
                </div>
              </div>
            </div>

            {/* Menu de Filtros Rápidos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Filter size={18} /> Filtrar Feed
                </h4>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => setSelectedTipoDestino("todos")}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    selectedTipoDestino === "todos"
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-50"
                  )}>
                  <Globe size={18} /> Todos os Avisos
                </button>
                <button
                  onClick={() => setSelectedTipoDestino("equipe")}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    selectedTipoDestino === "equipe"
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-50"
                  )}>
                  <Users size={18} /> Minhas Equipes
                </button>
                <button
                  onClick={() => setSelectedTipoDestino("convenio")}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    selectedTipoDestino === "convenio"
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-50"
                  )}>
                  <Building size={18} /> Convênios
                </button>
              </div>
            </div>
          </div>

          {/* --- FEED CENTRAL (Conteúdo Principal) --- */}
          <div className="col-span-1 lg:col-span-6 space-y-5">
            {/* Caixa de Criação Rápida (Estilo "No que você está pensando?") */}
            {canCreatePostagem && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-2">
                <div className="flex gap-3">
                  <ProfileAvatar
                    profileImage={user?.profileImage}
                    userName={user?.fullName || "U"}
                    size={40}
                  />
                  <button
                    onClick={handleCreateClick}
                    className="flex-grow text-left bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full px-5 py-2.5 text-sm transition-colors font-medium cursor-text">
                    Escreva um novo aviso ou comunicado...
                  </button>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                  <div className="flex gap-4">
                    <button
                      onClick={handleCreateClick}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
                      <PenSquare size={16} /> Texto
                    </button>
                    <button
                      onClick={handleCreateClick}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-green-600 text-sm font-medium transition-colors">
                      <FileText size={16} /> Anexo
                    </button>
                  </div>
                  <CustomButton
                    size="small"
                    onClick={handleCreateClick}
                    icon={Plus}>
                    Publicar
                  </CustomButton>
                </div>
              </div>
            )}

            {/* Barra de Busca Mobile/Tablet (se Sidebar escondida) ou Busca Geral */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 sticky top-20 z-10 lg:static">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar publicações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full focus:bg-gray-100 focus:ring-1 focus:ring-primary/20 text-sm"
                />
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
            </div>

            {/* Loading Skeleton */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-4 h-64 animate-pulse border border-gray-100 shadow-sm"
                  />
                ))}
              </div>
            )}

            {/* Feed Vazio */}
            {!loading && filteredPostagens.length === 0 && !error && (
              <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  Nenhuma publicação
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Não há atualizações para exibir com os filtros atuais.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedTipoDestino("todos");
                    setSelectedConvenio("todos");
                    setSelectedEquipe("todos");
                  }}
                  className="mt-4 text-primary font-medium text-sm hover:underline">
                  Limpar filtros
                </button>
              </div>
            )}

            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center border border-red-100">
                {error}
              </div>
            )}

            {/* Lista de Posts */}
            <div className="space-y-5 pb-10">
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
          </div>

          {/* --- SIDEBAR DIREITA (Informações Extras) --- */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24 space-y-4">
            {/* Filtros Detalhados (Contexto) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h4 className="font-semibold text-gray-800 text-sm mb-3">
                Contextos
              </h4>
              <div className="space-y-3">
                {selectedTipoDestino === "convenio" ||
                selectedTipoDestino === "todos" ? (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                      Convênios
                    </label>
                    <select
                      value={selectedConvenio}
                      onChange={(e) => {
                        setSelectedConvenio(e.target.value);
                        if (selectedTipoDestino !== "convenio")
                          setSelectedTipoDestino("convenio");
                      }}
                      className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary">
                      <option value="todos">Todos</option>
                      {convenios.slice(0, 10).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {selectedTipoDestino === "equipe" ||
                selectedTipoDestino === "todos" ? (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                      Equipes
                    </label>
                    <select
                      value={selectedEquipe}
                      onChange={(e) => {
                        setSelectedEquipe(e.target.value);
                        if (selectedTipoDestino !== "equipe")
                          setSelectedTipoDestino("equipe");
                      }}
                      className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary">
                      <option value="todos">Todas</option>
                      {equipes.slice(0, 10).map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Widget de Trending ou Informações - Opcional */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" /> Em Destaque
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Mantenha-se atualizado com os comunicados oficiais e
                atualizações das suas equipes.
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-400">
                Intranet Corporativa &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
