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
  CalendarDays,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
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
  href,
  colorClass = "text-gray-600 bg-gray-50",
  onClick,
}: {
  icon: any;
  label: string;
  href?: string;
  colorClass?: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-primary/20 transition-all group w-full">
    <div
      className={cn(
        "p-3 rounded-full mb-3 group-hover:scale-110 transition-transform",
        colorClass
      )}>
      <Icon size={24} />
    </div>
    <span className="text-xs font-semibold text-gray-700 group-hover:text-primary">
      {label}
    </span>
  </button>
);

// Componente para Item de Lista Lateral
const SideListItem = ({ icon: Icon, title, subtitle, time, status }: any) => (
  <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border-b border-gray-50 last:border-0">
    <div className="mt-1 text-gray-400">
      <Icon size={16} />
    </div>
    <div className="flex-grow">
      <h5 className="text-sm font-medium text-gray-800 line-clamp-1">
        {title}
      </h5>
      {subtitle && (
        <p className="text-xs text-gray-500 line-clamp-1">{subtitle}</p>
      )}
    </div>
    <div className="flex flex-col items-end gap-1">
      {time && <span className="text-[10px] text-gray-400">{time}</span>}
      {status === "active" && (
        <div className="h-2 w-2 rounded-full bg-green-500" />
      )}
      {status === "warning" && (
        <div className="h-2 w-2 rounded-full bg-amber-500" />
      )}
    </div>
  </div>
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
                {/* Capa do Perfil (Opcional) */}
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

                <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-gray-50">
                  <div className="text-center">
                    <span className="block text-lg font-bold text-gray-800">
                      12
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase">
                      Tarefas
                    </span>
                  </div>
                  <div className="text-center border-l border-gray-50">
                    <span className="block text-lg font-bold text-gray-800">
                      5
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase">
                      Tickets
                    </span>
                  </div>
                </div>
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

          {/* === COLUNA CENTRAL: Feed e Ações === */}
          <div className="col-span-1 lg:col-span-6 space-y-6">
            {/* Header Mobile (Só aparece em telas pequenas) */}
            <div className="lg:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 mb-2">
              <ProfileAvatar
                profileImage={user?.profileImage}
                userName={user?.fullName || "U"}
                size={48}
              />
              <div>
                <h1 className="font-bold text-gray-800">
                  {greeting}, {user?.fullName?.split(" ")[0]}!
                </h1>
                <p className="text-xs text-gray-500">Bem-vindo à Intranet.</p>
              </div>
            </div>

            {/* Acesso Rápido (Grid de ícones) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickAccessCard
                icon={FileText}
                label="Novo Relatório"
                colorClass="text-blue-600 bg-blue-50"
                onClick={() => router.push("/relatorios/novo")}
              />
              <QuickAccessCard
                icon={Activity}
                label="Abrir Chamado"
                colorClass="text-orange-600 bg-orange-50"
                onClick={() => router.push("/tickets/novo")}
              />
              <QuickAccessCard
                icon={HardDrive}
                label="Upload Drive"
                colorClass="text-green-600 bg-green-50"
                onClick={() => router.push("/drive")}
              />
              <QuickAccessCard
                icon={CalendarDays}
                label="Agenda"
                colorClass="text-purple-600 bg-purple-50"
                onClick={() => {}}
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
                  Ver tudo <ChevronRight size={14} />
                </button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-64 bg-white rounded-xl animate-pulse"
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
                      showEditButton={false} // No dashboard não editamos direto
                    />
                  ))}

                  <button
                    onClick={() => router.push("/postagens")}
                    className="w-full py-3 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    Carregar mais avisos...
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                  <p className="text-gray-500">Nenhuma publicação recente.</p>
                </div>
              )}
            </div>
          </div>

          {/* === COLUNA DIREITA: Widgets e Status === */}
          <div className="col-span-1 lg:col-span-3 space-y-6">
            {/* Widget: Status do Sistema */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h4 className="font-semibold text-gray-800 text-sm mb-4 flex items-center gap-2">
                <Activity size={16} className="text-green-500" /> Status dos
                Serviços
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                    Intranet
                  </span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Drive
                  </span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    E-mail
                  </span>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    Lento
                  </span>
                </div>
              </div>
            </div>

            {/* Widget: Aniversariantes do Mês (Simulado) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h4 className="font-semibold text-gray-800 text-sm mb-4 flex items-center gap-2">
                <CalendarDays size={16} className="text-primary" />{" "}
                Aniversariantes
              </h4>
              <div className="space-y-1">
                <SideListItem
                  icon={Users}
                  title="Maria Silva"
                  subtitle="RH - Dia 15"
                  status="active"
                />
                <SideListItem
                  icon={Users}
                  title="João Costa"
                  subtitle="TI - Dia 22"
                />
              </div>
              <button className="w-full mt-3 text-xs text-primary font-medium hover:underline text-center">
                Ver calendário completo
              </button>
            </div>

            {/* Widget: Pendências / Avisos Importantes */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg p-5 text-white">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Clock size={20} className="text-orange-300" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Fechamento de Ponto</h4>
                  <p className="text-xs text-gray-300 mt-1">
                    Envie seus registros até o dia 25/12.
                  </p>
                </div>
              </div>
              <button className="w-full py-2 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10">
                Verificar Pendências
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
