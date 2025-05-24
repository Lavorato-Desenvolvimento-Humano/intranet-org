"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Users,
  Building,
  TrendingUp,
  Calendar,
  Clock,
  Globe,
  UserIcon,
  Plus,
  Eye,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import postagemService, { PostagemSummaryDto } from "@/services/postagem";
import convenioService, { ConvenioDto } from "@/services/convenio";
import equipeService, { EquipeDto } from "@/services/equipe";
import userService, { UserDto } from "@/services/user";
import toastUtil from "@/utils/toast";
import ProfileAvatar from "@/components/profile/profile-avatar";
import { CustomButton } from "@/components/ui/custom-button";
import { stripHtml } from "@/utils/textUtils";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, canViewAllPostagens, canCreatePostagem } =
    useAdminPermissions();

  // Estados para dados
  const [postagens, setPostagens] = useState<PostagemSummaryDto[]>([]);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [equipes, setEquipes] = useState<EquipeDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);

  // Estados de carregamento
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados da dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Criar array de promessas baseado nas permissões do usuário
        const promises: Promise<any>[] = [];

        // Postagens - usar método com privilégios admin se aplicável
        if (canViewAllPostagens) {
          console.log("Carregando todas as postagens (usuário admin)");
          promises.push(
            postagemService.getPostagensVisiveisComPrivilegiosAdmin()
          );
        } else {
          console.log("Carregando postagens visíveis para usuário");
          promises.push(postagemService.getPostagensVisiveis());
        }

        // Convênios
        promises.push(convenioService.getAllConvenios());

        // Equipes
        promises.push(equipeService.getAllEquipes());

        // Usuários (apenas para admins)
        if (isAdmin) {
          promises.push(userService.getAllUsers());
        } else {
          promises.push(Promise.resolve([])); // Array vazio se não for admin
        }

        // Executar todas as promessas em paralelo
        const [postagensData, conveniosData, equipesData, usersData] =
          await Promise.all(promises);

        setPostagens(postagensData);
        setConvenios(conveniosData);
        setEquipes(equipesData);
        setUsers(usersData);

        console.log(
          `Dashboard carregada: ${postagensData.length} postagens, ${conveniosData.length} convênios, ${equipesData.length} equipes, ${usersData.length} usuários`
        );
      } catch (err) {
        console.error("Erro ao carregar dados da dashboard:", err);
        setError(
          "Não foi possível carregar os dados da dashboard. Tente novamente mais tarde."
        );
        toastUtil.error("Erro ao carregar dados da dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, isAdmin, canViewAllPostagens]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Renderizar ícone baseado no tipo de destino
  const renderTipoDestinoIcon = (tipoDestino: string) => {
    switch (tipoDestino) {
      case "geral":
        return <Globe size={16} className="mr-1 text-blue-500" />;
      case "equipe":
        return <Users size={16} className="mr-1 text-green-500" />;
      case "convenio":
        return <Building size={16} className="mr-1 text-purple-500" />;
      default:
        return null;
    }
  };

  // Função para formatar o nome do destino
  const formatDestino = (postagem: PostagemSummaryDto) => {
    switch (postagem.tipoDestino) {
      case "geral":
        return "Todos os usuários";
      case "equipe":
        return postagem.equipeName || "Equipe";
      case "convenio":
        return postagem.convenioName || "Convênio";
      default:
        return "";
    }
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
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          {/* Header da Dashboard */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Olá, {user?.fullName}!
            </h1>
            <p className="text-gray-600">
              {isAdmin ? "Painel Administrativo" : "Bem-vindo à sua dashboard"}
              {canViewAllPostagens && " - Visualizando todas as postagens"}
            </p>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FileText size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {canViewAllPostagens
                      ? "Total de Postagens"
                      : "Postagens Visíveis"}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {postagens.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <Building size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Convênios</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {convenios.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <Users size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Equipes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {equipes.length}
                  </p>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                    <UserIcon size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Usuários
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Postagens Recentes */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {canViewAllPostagens
                      ? "Todas as Postagens"
                      : "Postagens Recentes"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {canViewAllPostagens
                      ? "Visualização administrativa de todas as postagens do sistema"
                      : "Últimas postagens visíveis para você"}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <CustomButton
                    variant="secondary"
                    icon={Eye}
                    onClick={() => router.push("/postagens")}>
                    Ver Todas
                  </CustomButton>
                  {canCreatePostagem && (
                    <CustomButton
                      variant="primary"
                      icon={Plus}
                      onClick={() => router.push("/postagens/nova")}>
                      Nova Postagem
                    </CustomButton>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {postagens.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    {canViewAllPostagens
                      ? "Nenhuma postagem foi criada no sistema ainda."
                      : "Nenhuma postagem visível para você no momento."}
                  </p>
                  {canCreatePostagem && (
                    <CustomButton
                      variant="primary"
                      icon={Plus}
                      onClick={() => router.push("/postagens/nova")}>
                      Criar Primeira Postagem
                    </CustomButton>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {postagens.slice(0, 5).map((postagem) => (
                    <div
                      key={postagem.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/postagens/${postagem.id}`)}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-primary">
                          {postagem.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(postagem.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          {renderTipoDestinoIcon(postagem.tipoDestino)}
                          <span className="mr-4">
                            {formatDestino(postagem)}
                          </span>

                          <div className="flex items-center">
                            <ProfileAvatar
                              profileImage={postagem.createdByProfileImage}
                              userName={postagem.createdByName}
                              size={20}
                              className="mr-2"
                            />
                            <span>Por {postagem.createdByName}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {postagem.hasImagens && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Imagens
                            </span>
                          )}
                          {postagem.hasAnexos && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Anexos
                            </span>
                          )}
                          {postagem.hasTabelas && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              Tabelas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ações Rápidas
              </h3>
              <div className="space-y-3">
                {canCreatePostagem && (
                  <button
                    onClick={() => router.push("/postagens/nova")}
                    className="w-full text-left px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
                    <Plus size={16} className="inline mr-2" />
                    Nova Postagem
                  </button>
                )}
                <button
                  onClick={() => router.push("/convenios")}
                  className="w-full text-left px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                  <Building size={16} className="inline mr-2" />
                  Ver Convênios
                </button>
                <button
                  onClick={() => router.push("/equipes")}
                  className="w-full text-left px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                  <Users size={16} className="inline mr-2" />
                  Ver Equipes
                </button>
              </div>
            </div>

            {/* Resumo dos Convênios */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Convênios Ativos
              </h3>
              {convenios.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  Nenhum convênio cadastrado.
                </p>
              ) : (
                <div className="space-y-2">
                  {convenios.slice(0, 3).map((convenio) => (
                    <div
                      key={convenio.id}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                      onClick={() => router.push(`/convenios/${convenio.id}`)}>
                      <span className="text-sm font-medium">
                        {convenio.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {convenio.postagemCount} postagens
                      </span>
                    </div>
                  ))}
                  {convenios.length > 3 && (
                    <button
                      onClick={() => router.push("/convenios")}
                      className="text-sm text-primary hover:text-primary-dark">
                      Ver todos os convênios
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Resumo das Equipes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Equipes Ativas
              </h3>
              {equipes.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  Nenhuma equipe cadastrada.
                </p>
              ) : (
                <div className="space-y-2">
                  {equipes.slice(0, 3).map((equipe) => (
                    <div
                      key={equipe.id}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                      onClick={() => router.push(`/equipes/${equipe.id}`)}>
                      <span className="text-sm font-medium">{equipe.nome}</span>
                      <span className="text-xs text-gray-500">
                        {equipe.membroCount} membros
                      </span>
                    </div>
                  ))}
                  {equipes.length > 3 && (
                    <button
                      onClick={() => router.push("/equipes")}
                      className="text-sm text-primary hover:text-primary-dark">
                      Ver todas as equipes
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
