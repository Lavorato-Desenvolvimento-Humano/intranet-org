// src/app/tabelas/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Search, Plus, ArrowRight } from "lucide-react";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import { Convenio } from "@/services/convenio";
import { Postagem, TabelaPostagem } from "@/services/postagem";
import convenioService from "@/services/convenio";
import postagemService from "@/services/postagem";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ConvenioWithTabela extends Convenio {
  hasTabela: boolean;
}

export default function TabelasPage() {
  const [convenios, setConvenios] = useState<ConvenioWithTabela[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // Carregar convênios ao montar o componente
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar todos os convênios
        const conveniosData = await convenioService.getAllConvenios();

        // Para cada convênio, verificar se possui tabelas
        const conveniosWithStatus = await Promise.all(
          conveniosData.map(async (convenio) => {
            const postagens = await postagemService.getPostagensByConvenioId(
              convenio.id
            );
            const hasTabela = postagens.some(
              (postagem) => postagem.tabelas && postagem.tabelas.length > 0
            );
            return { ...convenio, hasTabela };
          })
        );

        setConvenios(conveniosWithStatus);
      } catch (error: any) {
        console.error("Erro ao carregar dados:", error);
        setError(
          "Não foi possível carregar os dados. Tente novamente mais tarde."
        );
        toastUtil.error("Erro ao carregar informações das tabelas");
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

  // Função para adicionar nova tabela
  const handleAddTabela = () => {
    router.push("/tabelas/new");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Tabelas de Valores
              </h1>

              <CustomButton
                variant="primary"
                icon={Plus}
                onClick={handleAddTabela}>
                Nova Tabela
              </CustomButton>
            </div>

            {/* Barra de pesquisa */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar convênios com tabelas..."
                  className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
                <CustomButton
                  onClick={() => window.location.reload()}
                  variant="primary">
                  Tentar novamente
                </CustomButton>
              </div>
            )}

            {/* Lista de convênios com indicação de tabelas */}
            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConvenios.length > 0 ? (
                  filteredConvenios.map((convenio) => (
                    <div
                      key={convenio.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
                      <div className="p-5 border-b border-gray-200">
                        <h3 className="text-xl font-bold text-primary mb-2">
                          {convenio.name}
                        </h3>
                        <p className="text-neutral-dark mb-4 line-clamp-2">
                          {convenio.description || "Sem descrição disponível"}
                        </p>
                        <div className="flex items-center mt-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              convenio.hasTabela
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                            {convenio.hasTabela
                              ? "Possui tabela"
                              : "Sem tabela"}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 flex justify-end">
                        <Link
                          href={`/convenios/${convenio.id}`}
                          className="text-primary flex items-center text-sm font-medium hover:text-primary-light transition-colors">
                          Ver detalhes
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Nenhum convênio encontrado</p>
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
