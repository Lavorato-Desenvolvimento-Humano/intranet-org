// src/app/convenios/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Search, Plus } from "lucide-react";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import ConvenioCard from "@/components/convenios/ConvenioCard";
import { Convenio } from "@/services/convenio";
import convenioService from "@/services/convenio";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ConveniosPage() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  // Verificar se o usuário é admin para permissões de adicionar convênio
  const isAdmin = user?.roles?.some(
    (role) => role === "ROLE_ADMIN" || role === "ADMIN"
  );

  // Carregar convênios ao montar o componente
  useEffect(() => {
    const fetchConvenios = async () => {
      setLoading(true);
      setError(null);

      try {
        const conveniosData = await convenioService.getAllConvenios();
        setConvenios(conveniosData);
      } catch (error: any) {
        console.error("Erro ao carregar convênios:", error);
        setError(
          "Não foi possível carregar a lista de convênios. Tente novamente mais tarde."
        );
        toastUtil.error("Erro ao carregar lista de convênios");
      } finally {
        setLoading(false);
      }
    };

    fetchConvenios();
  }, []);

  // Filtrar convênios com base no termo de pesquisa
  const filteredConvenios = convenios.filter(
    (convenio) =>
      convenio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (convenio.description &&
        convenio.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Função para adicionar novo convênio (a ser implementada)
  const handleAddConvenio = () => {
    // Aqui deveria levar a um formulário para adicionar convênio
    // Isso requer implementação adicional que não está no escopo atual
    toastUtil.info("Funcionalidade em desenvolvimento");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Convênios</h1>

              {isAdmin && (
                <CustomButton
                  variant="primary"
                  icon={Plus}
                  onClick={handleAddConvenio}>
                  Novo Convênio
                </CustomButton>
              )}
            </div>

            {/* Barra de pesquisa */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar convênios..."
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
                <button
                  onClick={() => window.location.reload()}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-light">
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Lista de convênios */}
            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConvenios.length > 0 ? (
                  filteredConvenios.map((convenio) => (
                    <ConvenioCard key={convenio.id} convenio={convenio} />
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
