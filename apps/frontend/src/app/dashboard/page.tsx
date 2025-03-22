"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Users,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Bookmark,
  BarChart2,
  PieChart,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import postagemService, { PostagemSummaryDto } from "@/services/postagem";
import convenioService, { ConvenioDto } from "@/services/convenio";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [recentPostagens, setRecentPostagens] = useState<PostagemSummaryDto[]>(
    []
  );
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [minhasPostagens, setMinhasPostagens] = useState<PostagemSummaryDto[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPostagens: 0,
    totalConvenios: 0,
    postagemThisMonth: 0,
    convenioMaisAtivo: { name: "", count: 0 },
  });

  // Verificar permissões
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const isUser =
    user?.roles?.includes("ROLE_USER") || user?.roles?.includes("USER");
  const canCreatePostagem = isAdmin || isEditor || isUser;

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Carregar dados em paralelo
        const [postagensData, conveniosData, minhasPostagensData] =
          await Promise.all([
            postagemService.getAllPostagens(0, 5), // Apenas as 5 mais recentes
            convenioService.getAllConvenios(),
            user ? postagemService.getMinhasPostagens() : Promise.resolve([]),
          ]);

        // Definir dados básicos
        setRecentPostagens(postagensData.content || []);
        setConvenios(conveniosData);
        setMinhasPostagens(minhasPostagensData);

        // Calcular estatísticas
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        // Contar postagens deste mês
        const postagemThisMonth = postagensData.content.filter((postagem) => {
          const date = new Date(postagem.createdAt);
          return (
            date.getMonth() === thisMonth && date.getFullYear() === thisYear
          );
        }).length;

        // Encontrar convênio mais ativo (com mais postagens)
        const convenioCount: {
          [key: string]: { name: string; count: number };
        } = {};
        postagensData.content.forEach((postagem) => {
          if (!convenioCount[postagem.convenioId]) {
            convenioCount[postagem.convenioId] = {
              name: postagem.convenioName,
              count: 0,
            };
          }
          convenioCount[postagem.convenioId].count += 1;
        });

        let convenioMaisAtivo = { name: "Nenhum", count: 0 };
        Object.values(convenioCount).forEach((convenio) => {
          if (convenio.count > convenioMaisAtivo.count) {
            convenioMaisAtivo = convenio;
          }
        });

        // Atualizar estatísticas
        setStats({
          totalPostagens:
            postagensData.totalElements || postagensData.content.length,
          totalConvenios: conveniosData.length,
          postagemThisMonth,
          convenioMaisAtivo,
        });
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
        setError(
          "Não foi possível carregar os dados do dashboard. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para formatar hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando dashboard..." />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          {canCreatePostagem && (
            <CustomButton
              variant="primary"
              onClick={() => router.push("/postagens/nova")}>
              Nova Postagem
            </CustomButton>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 flex items-start">
            <div className="rounded-full p-3 bg-blue-100 mr-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Postagens</p>
              <p className="text-2xl font-semibold">{stats.totalPostagens}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 flex items-start">
            <div className="rounded-full p-3 bg-green-100 mr-4">
              <Bookmark className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Convênios</p>
              <p className="text-2xl font-semibold">{stats.totalConvenios}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 flex items-start">
            <div className="rounded-full p-3 bg-purple-100 mr-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Postagens neste mês</p>
              <p className="text-2xl font-semibold">
                {stats.postagemThisMonth}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 flex items-start">
            <div className="rounded-full p-3 bg-amber-100 mr-4">
              <BarChart2 className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Convênio mais ativo</p>
              <p
                className="text-lg font-semibold truncate max-w-[180px]"
                title={stats.convenioMaisAtivo.name}>
                {stats.convenioMaisAtivo.name || "Nenhum"}
              </p>
            </div>
          </div>
        </div>

        {/* Layout principal de dois painéis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de postagens recentes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Postagens Recentes
                  </h2>
                  <button
                    onClick={() => router.push("/postagens")}
                    className="text-primary hover:text-primary-dark text-sm font-medium flex items-center">
                    Ver todas
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {recentPostagens.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Nenhuma postagem encontrada.
                  </div>
                ) : (
                  recentPostagens.map((postagem) => (
                    <div
                      key={postagem.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/postagens/${postagem.id}`)}>
                      <div className="mb-1">
                        <h3 className="font-medium text-primary">
                          {postagem.title}
                        </h3>
                        <div className="text-sm text-gray-600 mt-0.5">
                          <span>{postagem.convenioName}</span>
                          <span className="mx-2">•</span>
                          <span>por {postagem.createdByName}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(postagem.createdAt)}
                        <Clock className="h-3 w-3 ml-3 mr-1" />
                        {formatTime(postagem.createdAt)}
                        <div className="ml-4 flex space-x-1">
                          {postagem.hasImagens && (
                            <span
                              title="Possui imagens"
                              className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                          {postagem.hasAnexos && (
                            <span
                              title="Possui anexos"
                              className="w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                          {postagem.hasTabelas && (
                            <span
                              title="Possui tabelas"
                              className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Painel lateral */}
          <div className="space-y-6">
            {/* Minhas Postagens */}
            {user && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Minhas Postagens
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {minhasPostagens.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Você ainda não criou nenhuma postagem.
                    </div>
                  ) : (
                    minhasPostagens.slice(0, 3).map((postagem) => (
                      <div
                        key={postagem.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/postagens/${postagem.id}`)
                        }>
                        <h3 className="font-medium text-primary text-sm">
                          {postagem.title}
                        </h3>
                        <div className="text-xs text-gray-600 mt-1">
                          {postagem.convenioName}
                        </div>
                      </div>
                    ))
                  )}
                  {minhasPostagens.length > 0 && (
                    <div className="p-3 text-center">
                      <button
                        onClick={() => router.push("/postagens?minhas=true")}
                        className="text-primary hover:text-primary-dark text-sm font-medium">
                        Ver todas minhas postagens
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Convênios */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Convênios Ativos
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {convenios.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum convênio cadastrado.
                  </div>
                ) : (
                  convenios.slice(0, 5).map((convenio) => (
                    <div
                      key={convenio.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center"
                      onClick={() => router.push(`/convenios/${convenio.id}`)}>
                      <div>
                        <h3 className="font-medium text-gray-800 text-sm">
                          {convenio.name}
                        </h3>
                      </div>
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {convenio.postagemCount} postagens
                      </div>
                    </div>
                  ))
                )}
                <div className="p-3 text-center">
                  <button
                    onClick={() => router.push("/convenios")}
                    className="text-primary hover:text-primary-dark text-sm font-medium">
                    Ver todos os convênios
                  </button>
                </div>
              </div>
            </div>

            {/* Links rápidos */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Links Rápidos
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/postagens/nova")}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md text-left text-sm font-medium text-gray-800 transition-colors">
                  Criar nova postagem
                </button>
                <button
                  onClick={() => router.push("/convenios")}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md text-left text-sm font-medium text-gray-800 transition-colors">
                  Gerenciar convênios
                </button>
                {isAdmin && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-md text-left text-sm font-medium text-gray-800 transition-colors">
                    Painel administrativo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
