// apps/frontend/src/app/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function Home() {
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
                    stroke="currentColor"
                  >
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
                  href="#"
                  className="text-primary font-medium flex items-center"
                >
                  Acessar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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
                    stroke="currentColor"
                  >
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
                  href="#"
                  className="text-primary font-medium flex items-center"
                >
                  Acessar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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

            {/* Chat Interno */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105">
              <div className="h-3 bg-purple-500"></div>
              <div className="p-6">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-purple-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Chat Interno</h3>
                <p className="text-neutral-dark mb-4">
                  Comunique-se em tempo real com toda a equipe multidisciplinar.
                </p>
                <Link
                  href="#"
                  className="text-primary font-medium flex items-center"
                >
                  Acessar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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

            {/* Drive da Clínica */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:scale-105">
              <div className="h-3 bg-amber-500"></div>
              <div className="p-6">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Drive da Clínica</h3>
                <p className="text-neutral-dark mb-4">
                  Armazene e acesse documentos, relatórios e materiais
                  compartilhados.
                </p>
                <Link
                  href="#"
                  className="text-primary font-medium flex items-center"
                >
                  Acessar
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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
          </div>
        </div>
      </section>

      {/* Especialidades da Clínica */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">
            Nossas Especialidades
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Psicologia */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="font-bold mb-2">Psicologia</h3>
            </div>

            {/* Psicopedagogia */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="font-bold mb-2">Psicopedagogia</h3>
            </div>

            {/* Psicomotricidade */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏃</span>
              </div>
              <h3 className="font-bold mb-2">Psicomotricidade</h3>
            </div>

            {/* Terapia Ocupacional */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧩</span>
              </div>
              <h3 className="font-bold mb-2">Terapia Ocupacional</h3>
            </div>

            {/* Musicoterapia */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="font-bold mb-2">Musicoterapia</h3>
            </div>

            {/* Avaliação Neuro */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔬</span>
              </div>
              <h3 className="font-bold mb-2">Avaliação Neuro</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Notícias e Atualizações */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">
            Notícias e Atualizações
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2v3M19 20V9a2 2 0 00-2-2H9a2 2 0 00-2 2v9a2 2 0 002 2h8a2 2 0 002-2z"
                  />
                </svg>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                    Eventos
                  </span>
                  <span className="text-sm text-neutral-medium">
                    15/03/2025
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Workshop de Integração Sensorial
                </h3>
                <p className="text-neutral-dark mb-4">
                  Nova capacitação para equipe de Terapia Ocupacional e
                  Psicomotricidade. Inscrições abertas.
                </p>
                <Link
                  href="#"
                  className="text-primary font-medium flex items-center"
                >
                  Ler mais
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                    Protocolos
                  </span>
                  <span className="text-sm text-neutral-medium">
                    10/03/2025
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Atualizações nos Protocolos de Atendimento
                </h3>
                <p className="text-neutral-dark mb-4">
                  Novos protocolos para avaliação e intervenção em transtornos
                  de aprendizagem já disponíveis.
                </p>
                <Link
                  href="#"
                  className="text-primary font-medium flex items-center"
                >
                  Ler mais
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full">
                    Convênios
                  </span>
                  <span className="text-sm text-neutral-medium">
                    05/03/2025
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Atualizações nos Valores de Convênios
                </h3>
                <p className="text-neutral-dark mb-4">
                  Novos valores e procedimentos disponíveis para o convênio
                  MediSaúde. Confira a tabela atualizada.
                </p>
                <Link
                  href="#"
                  className="text-primary font-medium flex items-center"
                >
                  Ler mais
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Image
                src="/logo_branca.png"
                alt="Logo Clínica"
                width={120}
                height={30}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-center md:text-left mb-6 md:mb-0">
              <div>
                <h4 className="font-bold mb-3">Recursos</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Manuais
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Protocolos
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Convênios
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Capacitação
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3">Sistemas</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Chat
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Drive
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Agenda
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Prontuários
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3">Equipe</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Profissionais
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Contatos
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Escalas
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Reuniões
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3">Suporte</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Ajuda
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Contato TI
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Reportar Problema
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary-light">
                      Políticas
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Clínica Multidisciplinar.
                Todos os direitos reservados.
              </p>
              <div className="mt-4 md:mt-0">
                <div className="flex space-x-4">
                  <Link href="#" className="text-gray-400 hover:text-white">
                    <span className="sr-only">Facebook</span>
                    <svg
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    <span className="sr-only">Instagram</span>
                    <svg
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                  <Link href="#" className="text-gray-400 hover:text-white">
                    <span className="sr-only">LinkedIn</span>
                    <svg
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
            <p className="text-xs text-center text-gray-400 mt-6">
              Desenvolvido pelo Departamento de TI | v1.0.2
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
