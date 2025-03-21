// src/app/convenios/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Plus,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import PostagemCard from "@/components/postagens/PostagemCard";
import { Convenio } from "@/services/convenio";
import { Postagem, TabelaPostagem } from "@/services/postagem";
import convenioService from "@/services/convenio";
import postagemService from "@/services/postagem";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import TabelaVisualizacao from "@/components/postagens/TabelaVisualizacao";

export default function ConvenioDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [convenio, setConvenio] = useState<Convenio | null>(null);
  const [postagens, setPostagens] = useState<Postagem[]>([]);
  const [tabelaPrecos, setTabelaPrecos] = useState<TabelaPostagem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"postagens" | "tabela">(
    "postagens"
  );

  const convenioId = params.id as string;

  // Carregar dados do convênio e suas postagens
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar o convênio
        const convenioData = await convenioService.getConvenioById(convenioId);
        setConvenio(convenioData);

        // Buscar postagens do convênio
        const postagensData =
          await postagemService.getPostagensByConvenioId(convenioId);
        setPostagens(postagensData);

        // Encontrar a tabela de preços (assumindo que seja a primeira tabela em qualquer postagem)
        const allTabelas = postagensData.flatMap(
          (postagem) => postagem.tabelas || []
        );
        if (allTabelas.length > 0) {
          setTabelaPrecos(allTabelas[0]);
        }
      } catch (error: any) {
        console.error("Erro ao carregar dados do convênio:", error);
        setError(
          "Não foi possível carregar os dados do convênio. Tente novamente mais tarde."
        );
        toastUtil.error("Erro ao carregar informações do convênio");
      } finally {
        setLoading(false);
      }
    };

    if (convenioId) {
      fetchData();
    }
  }, [convenioId]);

  // Formatar a data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Voltar para a página anterior
  const handleBack = () => {
    router.back();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Botão de voltar */}
            <button
              onClick={handleBack}
              className="text-primary hover:text-primary-light transition-colors flex items-center mb-6">
              <ArrowLeft className="mr-2" size={18} />
              Voltar
            </button>

            {/* Estado de carregamento */}
            {loading && (
              <div className="flex justify-center items-center h-64">
                <Loader2 size={36} className="animate-spin text-primary" />
              </div>
            )}

            {/* Estado de erro */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
                <AlertTriangle
                  className="mx-auto text-red-500 mb-4"
                  size={36}
                />
                <p className="text-red-500 mb-4">{error}</p>
                <div className="flex justify-center gap-4">
                  <CustomButton
                    onClick={handleBack}
                    variant="secondary"
                    className="border border-gray-300">
                    Voltar
                  </CustomButton>
                  <CustomButton
                    onClick={() => window.location.reload()}
                    variant="primary">
                    Tentar novamente
                  </CustomButton>
                </div>
              </div>
            )}

            {/* Detalhes do convênio */}
            {!loading && !error && convenio && (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {convenio.name}
                  </h1>

                  <div className="flex items-center text-sm text-neutral-medium mb-6">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Atualizado em: {formatDate(convenio.updatedAt)}</span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <p className="text-gray-700 whitespace-pre-line">
                      {convenio.description ||
                        "Sem descrição disponível para este convênio."}
                    </p>
                  </div>
                </div>

                {/* Tabs para alternar entre postagens e tabela de preços */}
                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                      <button
                        onClick={() => setActiveTab("postagens")}
                        className={`py-4 px-6 border-b-2 font-medium text-sm ${
                          activeTab === "postagens"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}>
                        Postagens
                      </button>
                      <button
                        onClick={() => setActiveTab("tabela")}
                        className={`py-4 px-6 border-b-2 font-medium text-sm ${
                          activeTab === "tabela"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}>
                        Tabela de Valores
                      </button>
                    </nav>
                  </div>
                </div>

                {/* Conteúdo da Tab Postagens */}
                {activeTab === "postagens" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-700">
                        Postagens
                      </h2>
                      <CustomButton
                        variant="primary"
                        icon={Plus}
                        onClick={() =>
                          router.push(`/postagens/new?convenioId=${convenioId}`)
                        }>
                        Nova Postagem
                      </CustomButton>
                    </div>

                    {postagens.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {postagens.map((postagem) => (
                          <PostagemCard key={postagem.id} postagem={postagem} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 mb-4">
                          Nenhuma postagem encontrada para este convênio
                        </p>
                        <CustomButton
                          variant="primary"
                          icon={Plus}
                          onClick={() =>
                            router.push(
                              `/postagens/new?convenioId=${convenioId}`
                            )
                          }>
                          Criar Primeira Postagem
                        </CustomButton>
                      </div>
                    )}
                  </div>
                )}

                {/* Conteúdo da Tab Tabela de Valores */}
                {activeTab === "tabela" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-700">
                        Tabela de Valores
                      </h2>
                      <CustomButton
                        variant="primary"
                        icon={Plus}
                        onClick={() =>
                          router.push(`/tabelas/new?convenioId=${convenioId}`)
                        }>
                        Nova Tabela
                      </CustomButton>
                    </div>

                    {tabelaPrecos ? (
                      <TabelaVisualizacao tabela={tabelaPrecos} />
                    ) : (
                      <div className="text-center p-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 mb-4">
                          Nenhuma tabela de valores encontrada para este
                          convênio
                        </p>
                        <CustomButton
                          variant="primary"
                          icon={Plus}
                          onClick={() =>
                            router.push(`/tabelas/new?convenioId=${convenioId}`)
                          }>
                          Criar Tabela de Valores
                        </CustomButton>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <footer className="bg-gray-200 p-4 text-center text-gray-600">
          <p>
            &copy; {new Date().getFullYear()} Lavorato Saúde Integrada. Todos os
            direitos reservados.
          </p>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
