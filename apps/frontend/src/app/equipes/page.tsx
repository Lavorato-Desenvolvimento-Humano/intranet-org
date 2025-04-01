// src/app/equipes/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, UserPlus, User, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import DataTable from "@/components/ui/data-table";
import { useAuth } from "@/context/AuthContext";
import equipeService, { EquipeDto } from "@/services/equipe";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";

export default function EquipesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [equipes, setEquipes] = useState<EquipeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Verificar permissões
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const canCreateEquipe = isAdmin || isEditor;

  // Carregar dados das equipes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await equipeService.getAllEquipes();
        setEquipes(data);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError(
          "Não foi possível carregar as equipes. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar equipes com base na pesquisa
  const filteredEquipes = equipes.filter((equipe) => {
    return (
      equipe.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (equipe.descricao &&
        equipe.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Definição das colunas da tabela
  const columns = [
    {
      key: "nome",
      header: "Nome",
      width: "30%",
      render: (value: string, record: EquipeDto) => (
        <div className="font-medium text-primary hover:text-primary-dark">
          {value}
        </div>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      width: "40%",
      render: (value: string) => (
        <div className="text-gray-700">{value || "-"}</div>
      ),
    },
    {
      key: "membroCount",
      header: "Membros",
      width: "15%",
      render: (value: number) => (
        <div className="text-gray-600 flex items-center">
          <Users size={16} className="mr-1 text-gray-400" />
          {value}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Data de Criação",
      width: "15%",
      sortable: true,
      render: (value: string) => (
        <div className="text-gray-600">{formatDate(value)}</div>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          <Breadcrumb items={[{ label: "Equipes" }]} />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Equipes</h1>
            {canCreateEquipe && (
              <CustomButton
                variant="primary"
                icon={Plus}
                onClick={() => router.push("/equipes/nova")}>
                Nova Equipe
              </CustomButton>
            )}
          </div>

          {/* Barra de pesquisa */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar equipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {loading ? (
            <Loading message="Carregando equipes..." />
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              {error}
            </div>
          ) : (
            <DataTable
              data={filteredEquipes}
              columns={columns}
              keyExtractor={(item) => item.id}
              searchable={false} // Já temos nossa própria pesquisa
              onRowClick={(equipe) => router.push(`/equipes/${equipe.id}`)}
              emptyMessage={
                searchTerm
                  ? "Nenhuma equipe encontrada com os filtros aplicados."
                  : "Nenhuma equipe encontrada."
              }
              title="Lista de Equipes"
              showActions={canCreateEquipe}
              onEdit={
                canCreateEquipe
                  ? (equipe) => router.push(`/equipes/${equipe.id}/editar`)
                  : undefined
              }
              onDelete={
                isAdmin
                  ? (equipe) => {
                      if (
                        window.confirm(
                          `Tem certeza que deseja excluir a equipe "${equipe.nome}"?`
                        )
                      ) {
                        equipeService
                          .deleteEquipe(equipe.id)
                          .then(() => {
                            toastUtil.success("Equipe excluída com sucesso!");
                            setEquipes(
                              equipes.filter((e) => e.id !== equipe.id)
                            );
                          })
                          .catch((err) => {
                            console.error("Erro ao excluir equipe:", err);
                            toastUtil.error(
                              "Erro ao excluir equipe. Tente novamente."
                            );
                          });
                      }
                    }
                  : undefined
              }
            />
          )}

          {!loading && filteredEquipes.length === 0 && equipes.length > 0 && (
            <div className="mt-4">
              <CustomButton
                variant="secondary"
                onClick={() => setSearchTerm("")}>
                Limpar Filtros
              </CustomButton>
            </div>
          )}

          {!loading && equipes.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Users size={48} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-6">
                Nenhuma equipe foi encontrada no sistema.
              </p>
              {canCreateEquipe && (
                <CustomButton
                  variant="primary"
                  icon={Plus}
                  onClick={() => router.push("/equipes/nova")}>
                  Criar Primeira Equipe
                </CustomButton>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
