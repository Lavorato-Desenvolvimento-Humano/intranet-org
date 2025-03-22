// apps/frontend/src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirecionar para dashboard se o usuário já estiver autenticado
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Se o usuário estiver autenticado, não renderize o conteúdo da página inicial
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Renderize a página de boas-vindas normal para usuários não autenticados
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary relative z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Image
              src="/logo_branca.png"
              alt="Logo Clínica"
              width={100}
              height={25}
              className="mr-4"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-white text-primary hover:bg-gray-100 py-2 px-4 rounded-full text-sm font-medium transition duration-300 shadow-md">
              <a href="auth/login">Entrar</a>
            </button>
          </div>
        </div>
        <div className="absolute w-full h-4 bg-gradient-to-b from-black/20 to-transparent bottom-0 transform translate-y-full"></div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary to-primary-light text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Bem-vindo à Intranet da Clínica
            </h2>
            <p className="text-xl mb-8">
              Seu portal de acesso único a todos os recursos que você precisa
              para prestar o melhor atendimento
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-white text-primary hover:bg-gray-100 font-medium py-3 px-8 rounded-full transition duration-300 shadow-lg">
                <a href="auth/login">Iniciar Agora</a>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Resources Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">
            Recursos Essenciais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Manuais e Protocolos */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105">
              <div className="h-3 bg-blue-500"></div>
              <div className="p-6">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Manuais e Protocolos</h3>
                <p className="text-neutral-dark mb-4">
                  Acesse todos os manuais técnicos, protocolos clínicos e fluxos
                  de atendimento.
                </p>
                <Link
                  href="/auth/login"
                  className="text-primary font-medium flex items-center">
                  Acessar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Tabela de Convênios */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105">
              <div className="h-3 bg-green-500"></div>
              <div className="p-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Tabela de Convênios</h3>
                <p className="text-neutral-dark mb-4">
                  Consulte valores, coberturas e procedimentos disponíveis em
                  cada convênio.
                </p>
                <Link
                  href="/auth/login"
                  className="text-primary font-medium flex items-center">
                  Acessar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Restante das caixas de recursos... */}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-white text-xl max-w-2xl mx-auto mb-8">
            Acesse agora todos os recursos e ferramentas necessárias para o seu
            trabalho na clínica
          </p>
          <button className="bg-white text-primary hover:bg-gray-100 font-medium py-3 px-8 rounded-full transition duration-300 shadow-lg">
            <a href="/auth/login">Entrar na Intranet</a>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-dark text-white py-8">
        <div className="container mx-auto px-4">
          <div className="border-t border-gray-700 mt-8 pt-6">
            <p className="text-sm text-center text-gray-400">
              &copy; {new Date().getFullYear()} Lavorato Saúde Integrada. Todos
              os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
