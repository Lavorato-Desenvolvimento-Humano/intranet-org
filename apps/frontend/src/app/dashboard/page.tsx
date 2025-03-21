// src/app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Search } from "lucide-react";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import PostagemCard from "@/components/postagens/PostagemCard";
import { Convenio } from "@/services/convenio";
import { Postagem } from "@/services/postagem";
import convenioService from "@/services/convenio";
import postagemService from "@/services/postagem";
import toastUtil from "@/utils/toast";

export default function DashboardPage() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [postagens, setPostagens] = useState<Postagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

        setConvenios(conveniosData || []);

        // Ordenar postagens por data (mais recentes primeiro)
        const sortedPostagens = Array.isArray(postagensData)
          ? postagensData.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
          : [];

        setPostagens(sortedPostagens);
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

  // Filtrar postagens com base no convênio selecionado
  const filteredPostagens =
    selectedConvenio && postagens && postagens.length > 0
      ? postagens.filter((postagem) => postagem.convenioId === selectedConvenio)
      : postagens || [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Dashboard</h1>

            {/* Seletor de convênio */}
            <div className="mb-6">
              <div className="relative">
                <select
                  value={selectedConvenio || ""}
                  onChange={(e) => setSelectedConvenio(e.target.value || null)}
                  className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
                  <option value="">Todas as postagens</option>
                  {convenios && convenios.length > 0
                    ? convenios.map((convenio) => (
                        <option key={convenio.id} value={convenio.id}>
                          {convenio.name}
                        </option>
                      ))
                    : null}
                </select>
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
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
                <button
                  onClick={() => window.location.reload()}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-light">
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Lista de postagens recentes */}
            {!loading && !error && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
                  Postagens Recentes{" "}
                  {selectedConvenio && "(Filtradas por Convênio)"}
                </h2>

                {filteredPostagens && filteredPostagens.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPostagens.map((postagem) => (
                      <PostagemCard key={postagem.id} postagem={postagem} />
                    ))}
                  </div>
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
