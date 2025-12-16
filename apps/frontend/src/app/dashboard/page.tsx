// apps/frontend/src/app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  HardDrive,
  Users,
  Activity,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { PostCard } from "@/components/postagem/PostCard";
import ProfileAvatar from "@/components/profile/profile-avatar";
import { useAuth } from "@/context/AuthContext";
import postagemService, { PostagemSummaryDto } from "@/services/postagem";
import { cn } from "@/utils/cn";

// Componente simples para Card de Estatística/Atalho
const QuickAccessCard = ({
  icon: Icon,
  label,
  description,
  colorClass = "text-gray-600 bg-gray-50",
  onClick,
}: {
  icon: any;
  label: string;
  description?: string;
  colorClass?: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-start p-5 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-primary/20 transition-all group w-full text-left">
    <div
      className={cn(
        "p-3 rounded-lg mb-3 group-hover:scale-105 transition-transform",
        colorClass
      )}>
      <Icon size={24} />
    </div>
    <span className="text-sm font-bold text-gray-800 group-hover:text-primary mb-1">
      {label}
    </span>
    {description && (
      <span className="text-xs text-gray-500 line-clamp-1">{description}</span>
    )}
  </button>
);

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [recentPosts, setRecentPosts] = useState<PostagemSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    // Definir saudação baseada na hora
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Bom dia");
    else if (hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");

    const fetchData = async () => {
      try {
        setLoading(true);
        // Busca as postagens visíveis
        const posts = await postagemService.getPostagensVisiveis();
        // Pega apenas as 5 mais recentes para o dashboard
        const sorted = posts
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        setRecentPosts(sorted);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow container mx-auto p-4 md:py-8 md:px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* === COLUNA ESQUERDA: Navegação e Perfil === */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24 space-y-6">
            {/* Card de Perfil */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-primary/80 to-primary/40 relative">
                {/* Capa do Perfil */}
              </div>
              <div className="px-6 pb-6 text-center relative">
                <div className="relative -mt-10 mb-3 inline-block">
                  <div className="p-1 bg-white rounded-full">
                    <ProfileAvatar
                      profileImage={user?.profileImage}
                      userName={user?.fullName || "U"}
                      size={80}
                    />
                  </div>
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  {user?.fullName}
                </h2>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">
                  {user?.roles?.[0]?.replace("ROLE_", "") || "Colaborador"}
                </p>

                {/* Removido estatísticas estáticas (Tarefas/Tickets) 
                  pois não há endpoint conectado neste componente ainda.
                */}
              </div>
            </div>

            {/* Menu de Navegação Rápida */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
              <nav className="space-y-1">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg bg-primary/5 text-primary">
                  <LayoutDashboard size={18} /> Dashboard
                </button>
                <button
                  onClick={() => router.push("/postagens")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  <MessageSquare size={18} /> Mural de Avisos
                </button>
                <button
                  onClick={() => router.push("/tickets")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  <Activity size={18} /> Meus Chamados
                </button>
                <button
                  onClick={() => router.push("/drive")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  <HardDrive size={18} /> Drive Corporativo
                </button>
                <button
                  onClick={() => router.push("/equipes")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  <Users size={18} /> Minhas Equipes
                </button>
              </nav>
            </div>
          </div>

          {/* === COLUNA DIREITA: Feed e Ações (Expandida) === */}
          <div className="col-span-1 lg:col-span-9 space-y-6">
            {/* Header Mobile / Saudação */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="hidden md:block">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <LayoutDashboard size={24} />
                </div>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                  {greeting}, {user?.fullName?.split(" ")[0]}!
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Bem-vindo à Intranet. Selecione uma ação abaixo ou veja os
                  avisos recentes.
                </p>
              </div>
            </div>

            {/* Acesso Rápido - Grid ajustado para 3 colunas pois removemos Agenda */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <QuickAccessCard
                icon={FileText}
                label="Novo Relatório"
                description="Criar relatório médico ou administrativo"
                colorClass="text-blue-600 bg-blue-50"
                onClick={() => router.push("/relatorios/novo")}
              />
              <QuickAccessCard
                icon={Activity}
                label="Abrir Chamado"
                description="Relatar problema ou solicitar serviço"
                colorClass="text-orange-600 bg-orange-50"
                onClick={() => router.push("/tickets/novo")}
              />
              <QuickAccessCard
                icon={HardDrive}
                label="Upload Drive"
                description="Enviar arquivos para nuvem"
                colorClass="text-green-600 bg-green-50"
                onClick={() => router.push("/drive")}
              />
            </div>

            {/* Seção de Feed */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Activity size={18} className="text-primary" />
                  Últimas Atualizações
                </h3>
                <button
                  onClick={() => router.push("/postagens")}
                  className="text-xs font-medium text-primary hover:underline flex items-center">
                  Ver mural completo <ChevronRight size={14} />
                </button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-48 bg-white rounded-xl animate-pulse border border-gray-100"
                    />
                  ))}
                </div>
              ) : recentPosts.length > 0 ? (
                <div className="space-y-5">
                  {recentPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      postagem={post}
                      onClick={() => router.push(`/postagens/${post.id}`)}
                      showEditButton={false}
                    />
                  ))}

                  <button
                    onClick={() => router.push("/postagens")}
                    className="w-full py-4 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                    Carregar mais avisos...
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Nenhum aviso recente
                  </h3>
                  <p className="text-gray-500">
                    Não há publicações recentes no mural de avisos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
