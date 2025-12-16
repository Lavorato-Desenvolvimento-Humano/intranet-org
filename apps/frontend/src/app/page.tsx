// apps/frontend/src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  TableProperties,
  GitMerge,
  ArrowRight,
  LogIn,
  Activity,
  ShieldCheck,
  UserPlus,
  Sparkles,
  Zap,
  LifeBuoy,
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirecionar para dashboard se o usuário já estiver autenticado
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-primary animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary font-bold">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const resources = [
    {
      title: "Protocolos Clínicos",
      description:
        "Acesse nossa base completa de manuais e diretrizes padronizadas.",
      icon: <BookOpen className="w-6 h-6 text-white" />,
      gradient: "from-blue-400 to-blue-600",
      shadow: "shadow-blue-500/30",
      href: "/auth/login",
    },
    {
      title: "Tabela de Convênios",
      description:
        "Valores, coberturas e procedimentos atualizados em tempo real.",
      icon: <TableProperties className="w-6 h-6 text-white" />,
      gradient: "from-emerald-400 to-emerald-600",
      shadow: "shadow-emerald-500/30",
      href: "/auth/login",
    },
    {
      title: "Fluxos Operacionais",
      description:
        "Mapas de processos e fluxogramas para otimizar seu atendimento.",
      icon: <GitMerge className="w-6 h-6 text-white" />,
      gradient: "from-rose-400 to-rose-600",
      shadow: "shadow-rose-500/30",
      href: "/auth/login",
    },
    {
      title: "Métricas & KPIs",
      description:
        "Acompanhe o desempenho da clínica através de dashboards interativos.",
      icon: <Activity className="w-6 h-6 text-white" />,
      gradient: "from-violet-400 to-violet-600",
      shadow: "shadow-violet-500/30",
      href: "/auth/login",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20 selection:text-primary">
      {/* Background Decorativo Fixo */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] mix-blend-multiply animate-pulse"></div>
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[120px] mix-blend-multiply animate-pulse"
          style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Navbar Flutuante Glassmorphism */}
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 px-4 py-4">
        <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-lg border border-white/50 rounded-2xl shadow-sm px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-32">
              {/* Substitua por sua logo oficial */}
              <Image
                src="/logo.png"
                alt="Lavorato"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-slate-600 hover:text-primary font-medium text-sm transition-colors hidden sm:block">
              Já tenho conta
            </Link>
            <Link
              href="/auth/register"
              className="group bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
              Criar Conta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-slate-600 text-sm font-medium">
              Portal Interno v2.0
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
            Excelência Integrada em <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-primary animate-gradient-x">
              Cada Atendimento
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Centralize sua rotina clínica. Acesse prontuários, protocolos e
            ferramentas administrativas em uma única plataforma inteligente.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/auth/login"
              className="group relative px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:-translate-y-1 overflow-hidden">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
              <span className="relative flex items-center gap-2">
                Acessar Sistema
                <LogIn className="w-5 h-5" />
              </span>
            </Link>

            <Link
              href="/auth/register"
              className="px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm hover:border-primary/50 hover:text-primary transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
              Primeiro Acesso
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Cards Grid com efeito de Hover 3D sutil */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((res, idx) => (
              <Link
                href={res.href}
                key={idx}
                className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${res.gradient} ${res.shadow} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {res.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">
                  {res.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                  {res.description}
                </p>
                <div className="flex items-center text-sm font-semibold text-slate-400 group-hover:text-primary transition-colors">
                  Acessar
                  <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Seção CTA Registro & Suporte */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-[2.5rem] p-12 md:p-16 text-center relative overflow-hidden shadow-2xl">
            {/* Efeitos de fundo no card */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mb-8 border border-white/10">
                <Sparkles className="w-8 h-8 text-yellow-300" />
              </div>

              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Ainda não tem acesso?
              </h2>
              <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
                Não é necessário solicitar ao RH. Você mesmo pode criar sua
                conta agora e ter acesso imediato às ferramentas básicas.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <Link
                  href="/auth/register"
                  className="bg-primary hover:bg-primary-light text-white font-bold py-4 px-10 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-primary/25">
                  Registrar-se Agora
                </Link>

                <div className="flex items-center gap-3 text-slate-400">
                  <div className="w-px h-12 bg-slate-700 hidden sm:block"></div>
                  <div className="text-left">
                    <p className="text-xs uppercase tracking-wider font-semibold mb-1">
                      Precisa de ajuda?
                    </p>
                    <a
                      href="mailto:desenvolvimento@lavorato.com.br"
                      className="text-white hover:text-primary transition-colors flex items-center gap-2 font-medium">
                      <LifeBuoy className="w-4 h-4" />
                      desenvolvimento@lavorato.com.br
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="py-8 text-center text-slate-400 text-sm relative z-10">
        <p className="flex items-center justify-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
          <ShieldCheck className="w-4 h-4" />
          Ambiente Seguro &copy; {new Date().getFullYear()} Lavorato Saúde
          Integrada
        </p>
      </footer>
    </main>
  );
}
