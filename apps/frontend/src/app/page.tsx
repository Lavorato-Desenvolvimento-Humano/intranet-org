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
} from "lucide-react";

// Componente reutilizável para os cards de recursos
interface ResourceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  href: string;
}

const ResourceCard = ({
  title,
  description,
  icon,
  colorClass,
  bgClass,
  borderClass,
  href,
}: ResourceCardProps) => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group h-full flex flex-col">
    <div className={`h-2 ${borderClass}`}></div>
    <div className="p-6 flex-1 flex flex-col">
      <div
        className={`w-14 h-14 ${bgClass} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300`}>
        <div className={colorClass}>{icon}</div>
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-800">{title}</h3>
      <p className="text-gray-500 mb-6 flex-1 leading-relaxed">{description}</p>
      <Link
        href={href}
        className={`inline-flex items-center font-semibold ${colorClass} hover:opacity-80 transition-opacity`}>
        Acessar Recurso
        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  </div>
);

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirecionar para dashboard se o usuário já estiver autenticado
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Loader state
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const resources = [
    {
      title: "Manuais e Protocolos",
      description:
        "Acesse a base completa de manuais técnicos, protocolos clínicos padronizados e documentação essencial.",
      icon: <BookOpen size={28} />,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50",
      borderClass: "bg-blue-600",
      href: "/auth/login",
    },
    {
      title: "Tabela de Convênios",
      description:
        "Consulte rapidamente valores atualizados, coberturas detalhadas e procedimentos por convênio.",
      icon: <TableProperties size={28} />,
      colorClass: "text-green-600",
      bgClass: "bg-green-50",
      borderClass: "bg-green-600",
      href: "/auth/login",
    },
    {
      title: "Fluxos de Processos",
      description:
        "Visualize fluxogramas interativos de atendimento, processos administrativos e operacionais.",
      icon: <GitMerge size={28} />,
      colorClass: "text-red-600",
      bgClass: "bg-red-50",
      borderClass: "bg-red-600",
      href: "/auth/login",
    },
    {
      title: "Dashboard Clínico",
      description:
        "Acompanhe métricas, indicadores de desempenho e status de atendimentos em tempo real.",
      icon: <Activity size={28} />,
      colorClass: "text-purple-600",
      bgClass: "bg-purple-50",
      borderClass: "bg-purple-600",
      href: "/auth/login",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header Transparente/Fixo */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-32 md:h-10 md:w-40">
              {/* Ajuste o src conforme a logo oficial colorida se disponível, ou mantenha a atual */}
              <Image
                src="/logo.png"
                alt="Lavorato Saúde Integrada"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="flex items-center gap-2 text-gray-600 hover:text-primary font-medium transition-colors px-4 py-2">
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
            <Link
              href="/auth/login"
              className="hidden md:inline-flex bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Área do Colaborador
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section Modernizada */}
      <section className="relative bg-gradient-to-br from-[#1e8fa0] to-[#2ea6b8] text-white overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <svg
            className="absolute -top-24 -left-24 w-96 h-96 text-white"
            fill="currentColor"
            viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg
            className="absolute top-1/2 right-0 w-64 h-64 text-white translate-x-1/3"
            fill="currentColor"
            viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
        </div>

        <div className="container mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-8 border border-white/30">
              <ShieldCheck className="w-4 h-4" />
              <span>Ambiente Seguro e Exclusivo</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
              Lavorato Saúde Integrada
              <br />
              <span className="text-blue-100">Intranet Corporativa</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-50 mb-10 max-w-2xl mx-auto leading-relaxed">
              Centralizamos todas as ferramentas, protocolos e informações que
              você precisa para oferecer excelência em cada atendimento.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/auth/login"
                className="bg-white text-primary hover:bg-blue-50 font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2">
                Acessar Sistema
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Onda decorativa na base */}
        <div className="absolute bottom-0 w-full leading-none">
          <svg
            className="block w-full h-12 md:h-24 text-gray-50"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none">
            <path
              fill="currentColor"
              fillOpacity="1"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Main Resources Grid */}
      <section className="py-20 -mt-10 md:-mt-20 relative z-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {resources.map((resource, index) => (
              <ResourceCard key={index} {...resource} />
            ))}
          </div>
        </div>
      </section>

      {/* Info Section / Footer CTA */}
      <section className="bg-white py-20 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Precisa de Suporte?
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Caso tenha problemas de acesso ou dúvidas sobre o sistema, nossa
                equipe de TI está pronta para ajudar.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <span className="font-medium">suporte@lavorato.com.br</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end">
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 max-w-sm w-full text-center">
                <h3 className="font-bold text-gray-900 mb-2">
                  Primeiro Acesso?
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Solicite suas credenciais junto ao RH ou gestor responsável.
                </p>
                <Link
                  href="/auth/login"
                  className="block w-full bg-white border border-gray-200 text-gray-700 hover:border-primary hover:text-primary font-semibold py-3 px-4 rounded-lg transition-colors">
                  Fazer Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-auto">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logo_branca.png"
                alt="Logo Rodapé"
                width={120}
                height={30}
                className="opacity-80"
              />
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Lavorato Saúde Integrada. Todos
              os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
