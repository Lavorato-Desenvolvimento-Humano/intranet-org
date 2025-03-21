// src/app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Search, Filter } from "lucide-react";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/header";
import ConvenioCard from "@/components/convenios/ConvenioCard";
import PostagemCard from "@/components/postagens/PostagemCard";
import { Convenio } from "@/services/convenio";
import { Postagem } from "@/services/postagem";
import convenioService from "@/services/convenio";
import postagemService from "@/services/postagem";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";

export default function DashboardPage() {
  const { user } = useAuth();
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [postagens, setPostagens] = useState<Postagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConvenio, setSelectedConvenio] = useState<string | null>(null);

  // Carregar convênios e postagens ao montar o componente
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar convênios e postagens em paralelo
        const [conveniosData, postagensData] = await Promise.all([
          convenioService.getAllConvenios(),
          postagemService.getAllPostagens(),
        ]);

        setConvenios(conveniosData);
        setPostagens(postagensData);
      } catch (error: any) {
        console.error("Erro ao carregar dados:", error);
        setError(
          "Não foi possível carregar os dados. Tente novamente mais tarde."
        );
        toastUtil.error("Erro ao carregar informações da dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar convênios com base no termo de pesquisa
  const filteredConvenios = convenios.filter(
    (convenio) =>
      convenio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (convenio.description &&
        convenio.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filtrar postagens com base no termo de pesquisa e convênio selecionado
  const filteredPostagens = postagens.filter((postagem) => {
    const matchesSearch =
      postagem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      postagem.text.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesConvenio = selectedConvenio
      ? postagem.convenioId === selectedConvenio
      : true;

    return matchesSearch && matchesConvenio;
  });

  // Encontrar o nome do convênio selecionado
  const selectedConvenioName = selectedConvenio
    ? convenios.find((c) => c.id === selectedConvenio)?.name || "Convênio"
    : null;

  // Organizar postagens por convênio
  const postagensPorConvenio: Record<string, Postagem[]> = {};
  if (selectedConvenio) {
    postagensPorConvenio[selectedConvenio] = filteredPostagens;
  } else {
    // Agrupar postagens por convênio
    filteredPostagens.forEach((postagem) => {
      if (!postagensPorConvenio[postagem.convenioId]) {
        postagensPorConvenio[postagem.convenioId] = [];
      }
      postagensPorConvenio[postagem.convenioId].push(postagem);
    });
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <main className="flex-grow container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h1 className="text-2xl font-bold mb-2 text-gray-800">
              Dashboard
              {selectedConvenioName && <span> - {selectedConvenioName}</span>}
            </h1>
            <p className="text-gray-600 mb-6">
              Visualize informações sobre convênios e postagens recentes
            </p>

            {/* Barra de filtros e pesquisa */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar convênios e postagens..."
                  className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedConvenio || ""}
                  onChange={(e) => setSelectedConvenio(e.target.value || null)}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Todos os convênios</option>
                  {convenios.map((convenio) => (
                    <option key={convenio.id} value={convenio.id}>
                      {convenio.name}
                    </option>
                  ))}
                </select>

                {selectedConvenio && (
                  <CustomButton
                    onClick={() => setSelectedConvenio(null)}
                    variant="secondary"
                    className="border border-gray-300">
                    Limpar
                  </CustomButton>
                )}
              </div>
            </div>

            {/* Estado de carregamento */}
            {loading && (
              <div className="flex justify-center items-center h-64">
                <Loader2 size={36} className="animate-spin text-primary" />
              </div>
            )}

            {/* Estado de erro */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <CustomButton
                  onClick={() => window.location.reload()}
                  variant="primary">
                  Tentar novamente
                </CustomButton>
              </div>
            )}

            {/* Lista de convênios quando não há convênio selecionado */}
            {!loading && !error && !selectedConvenio && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
                  Convênios
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredConvenios.length > 0 ? (
                    filteredConvenios.map((convenio) => (
                      <ConvenioCard key={convenio.id} convenio={convenio} />
                    ))
                  ) : (
                    <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">
                        Nenhum convênio encontrado
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lista de postagens agrupadas por convênio */}
            {!loading && !error && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
                  {selectedConvenio
                    ? "Postagens"
                    : "Postagens Recentes por Convênio"}
                </h2>

                {Object.keys(postagensPorConvenio).length > 0 ? (
                  Object.entries(postagensPorConvenio).map(
                    ([convenioId, postagens]) => {
                      const convenio = convenios.find(
                        (c) => c.id === convenioId
                      );

                      return (
                        <div key={convenioId} className="mb-8">
                          {!selectedConvenio && convenio && (
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="text-lg font-medium text-primary">
                                {convenio.name}
                              </h3>
                              <CustomButton
                                onClick={() => setSelectedConvenio(convenioId)}
                                variant="secondary"
                                className="text-sm px-3 py-1 border border-primary text-primary hover:bg-primary hover:text-white">
                                Ver todas
                              </CustomButton>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {postagens.map((postagem) => (
                              <PostagemCard
                                key={postagem.id}
                                postagem={postagem}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Nenhuma postagem encontrada</p>
                  </div>
                )}
              </div>
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
