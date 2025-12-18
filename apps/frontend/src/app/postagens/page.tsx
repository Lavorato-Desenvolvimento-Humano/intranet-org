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
  Megaphone,
  BookOpen,
  Award,
  Pin,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { CustomButton } from "@/components/ui/custom-button";
import { PostCard } from "@/components/postagem/PostCard";
import { useAuth } from "@/context/AuthContext";
import postagemService, {
  PostagemSummaryDto,
  PostagemCategoria,
} from "@/services/postagem";
import convenioService, { ConvenioDto } from "@/services/convenio";
import equipeService, { EquipeDto } from "@/services/equipe";
import ProfileAvatar from "@/components/profile/profile-avatar";
import { cn } from "@/utils/cn";

export default function PostagensPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Estados
  const [postagens, setPostagens] = useState<PostagemSummaryDto[]>([]);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [equipes, setEquipes] = useState<EquipeDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<
    PostagemCategoria | "TODAS"
  >("TODAS");
  const [selectedTipoDestino, setSelectedTipoDestino] =
    useState<string>("todos");

  const isAdmin = user?.roles?.some((r) =>
    ["ROLE_ADMIN", "ADMIN", "ROLE_EDITOR"].includes(r)
  ) ?? false;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [postagensData, conveniosData, equipesData] = await Promise.all([
          isAdmin
            ? postagemService.getAllPostagensForAdmin()
            : postagemService.getPostagensVisiveis(),
          convenioService.getAllConvenios(),
          equipeService.getAllEquipes(),
        ]);

        // Ordenação inteligente: Fixados primeiro, depois por data
        const sorted = postagensData.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setPostagens(sorted);
        setConvenios(conveniosData);
        setEquipes(equipesData);
      } catch (err) {
        console.error("Erro ao carregar feed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const filteredPostagens = postagens.filter((postagem) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      postagem.title.toLowerCase().includes(term) ||
      postagem.createdByName.toLowerCase().includes(term);
    const matchesCategoria =
      selectedCategoria === "TODAS" || postagem.categoria === selectedCategoria;
    const matchesTipo =
      selectedTipoDestino === "todos" ||
      postagem.tipoDestino === selectedTipoDestino;

    return matchesSearch && matchesCategoria && matchesTipo;
  });

  // Postagens fixadas ou populares para a sidebar
  const trendingPostagens = postagens
    .filter((p) => p.pinned || p.viewsCount > 10)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow container mx-auto p-4 md:py-8 md:px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SIDEBAR ESQUERDA: Filtros */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
              <ProfileAvatar
                profileImage={user?.profileImage}
                userName={user?.fullName || "User"}
                size={64}
                className="mb-3"
              />
              <h3 className="font-bold text-gray-800">{user?.fullName}</h3>
              <p className="text-xs text-gray-500 mb-2">{user?.email}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 font-semibold text-gray-700 flex items-center gap-2">
                <Filter size={18} /> Categorias
              </div>
              <div className="p-2 space-y-1">
                {[
                  { id: "TODAS", label: "Feed Geral", icon: Globe },
                  {
                    id: "AVISO",
                    label: "Avisos",
                    icon: Megaphone,
                    color: "text-red-600",
                  },
                  {
                    id: "MANUAL",
                    label: "Manuais",
                    icon: BookOpen,
                    color: "text-orange-600",
                  },
                  {
                    id: "CONQUISTA",
                    label: "Conquistas",
                    icon: Award,
                    color: "text-yellow-600",
                  },
                  {
                    id: "ANUNCIO",
                    label: "Anúncios",
                    icon: TrendingUp,
                    color: "text-blue-600",
                  },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoria(cat.id as any)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                      selectedCategoria === cat.id
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-50"
                    )}>
                    <cat.icon size={18} className={cat.color} /> {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FEED CENTRAL */}
          <div className="col-span-1 lg:col-span-6 space-y-5">
            {isAdmin && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-2">
                <div className="flex gap-3">
                  <ProfileAvatar
                    profileImage={user?.profileImage}
                    userName={user?.fullName || "User"}
                    size={40}
                  />
                  <button
                    onClick={() => router.push("/postagens/nova")}
                    className="flex-grow text-left bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full px-5 py-2.5 text-sm font-medium">
                    Escreva um novo aviso, manual ou conquista...
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 sticky top-20 z-10 lg:static">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar por título, autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full focus:ring-1 focus:ring-primary/20 text-sm"
                />
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center">Carregando feed...</div>
            ) : (
              <div className="space-y-5 pb-10">
                {filteredPostagens.map((post) => (
                  <PostCard
                    key={post.id}
                    postagem={post}
                    onClick={() => router.push(`/postagens/${post.id}`)}
                    showEditButton={isAdmin}
                    onEdit={() => router.push(`/postagens/${post.id}/editar`)}
                  />
                ))}
                {filteredPostagens.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    Nenhuma publicação encontrada.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SIDEBAR DIREITA: Trending */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" /> Destaques &
                Importantes
              </h4>
              <div className="space-y-3">
                {trendingPostagens.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => router.push(`/postagens/${post.id}`)}
                    className="group cursor-pointer">
                    <div className="flex gap-2 mb-1">
                      {post.pinned && (
                        <Pin
                          size={12}
                          className="text-yellow-600 fill-yellow-600 mt-1"
                        />
                      )}
                      <h5 className="text-sm font-medium text-gray-800 group-hover:text-primary line-clamp-2">
                        {post.title}
                      </h5>
                    </div>
                    <p className="text-xs text-gray-500 pl-4">
                      {post.viewsCount} visualizações
                    </p>
                  </div>
                ))}
                {trendingPostagens.length === 0 && (
                  <p className="text-xs text-gray-400">
                    Sem destaques no momento.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
