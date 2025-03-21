"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import dashboardService, { Postagem } from "@/services/dashboardService";
import Sidebar from "@/components/dashboard/Sidebar";
import Loading from "@/components/ui/loading";
import ContentRenderer from "@/components/dashboard/ContentRenderer";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Edit,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";
import convenioService from "@/services/convenioService";
import ImageGallery from "@/components/dashboard/ImageGallery";
import AnexoList from "@/components/dashboard/AnexoList";
import TabelasList from "@/components/dashboard/TabelasList";
import toastUtil from "@/utils/toast";
import { formatDate } from "@/utils/formatters";

export default function PostagemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postagemId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [postagem, setPostagem] = useState<Postagem | null>(null);
  const [convenios, setConvenios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  const { user } = useAuth();
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const canEdit = isAdmin || isEditor;

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar dados da postagem
      const postagemData = await dashboardService.getPostagemById(postagemId);
      setPostagem(postagemData);

      // Buscar lista de convênios para a sidebar
      const conveniosData = await convenioService.getAllConvenios();
      setConvenios(conveniosData);
    } catch (error: any) {
      console.error(`Erro ao carregar dados da postagem ${postagemId}:`, error);

      if (error.response?.status === 401) {
        setError("Sua sessão expirou. Por favor, faça login novamente.");
      } else if (error.response?.status === 404) {
        setError("Postagem não encontrada.");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError(
          "Erro ao carregar os dados da postagem. Tente novamente mais tarde."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postagemId) {
      fetchData();
    }
  }, [postagemId]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleDelete = async () => {
    try {
      await postagemService.deletePostagem(postagemId);
      toastUtil.success("Postagem excluída com sucesso!");
      router.push(`/dashboard/convenio/${postagem?.convenioId}`);
    } catch (error: any) {
      console.error(`Erro ao excluir postagem ${postagemId}:`, error);

      if (error.response?.data?.message) {
        toastUtil.error(error.response.data.message);
      } else if (error.message) {
        toastUtil.error(error.message);
      } else {
        toastUtil.error(
          "Erro ao excluir postagem. Tente novamente mais tarde."
        );
      }
    }
  };

  if (loading) {
    return <Loading message="Carregando postagem..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-2 text-red-600">
            Erro ao carregar postagem
          </h2>
          <p className="mb-6 text-gray-700">{error}</p>
          <div className="flex gap-4">
            <CustomButton
              onClick={() => window.history.back()}
              icon={ArrowLeft}
              variant="secondary"
              className="flex-1">
              Voltar
            </CustomButton>
            <CustomButton
              onClick={handleRefresh}
              icon={RefreshCw}
              className="flex-1">
              Tentar novamente
            </CustomButton>
          </div>
        </div>
      </div>
    );
  }

  if (!postagem) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-2">Postagem não encontrada</h2>
          <p className="mb-6 text-gray-700">
            Não foi possível carregar os dados desta postagem.
          </p>
          <Link href="/dashboard" className="block w-full">
            <CustomButton icon={ArrowLeft} className="w-full">
              Voltar para a Dashboard
            </CustomButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar com lista de convênios */}
      <Sidebar convenios={convenios} activeConvenioId={postagem.convenioId} />

      {/* Conteúdo principal */}
      <main className="flex-grow p-6">
        <div className="container mx-auto max-w-4xl">
          {/* Navegação */}
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <Link href="/dashboard" className="hover:text-primary">
              Dashboard
            </Link>
            <span>/</span>
            <Link
              href={`/dashboard/convenio/${postagem.convenioId}`}
              className="hover:text-primary">
              {postagem.convenioName}
            </Link>
            <span>/</span>
            <span className="font-medium text-primary">Postagem</span>
          </div>

          {/* Cabeçalho da postagem */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                {postagem.title}
              </h1>

              {canEdit && (
                <div className="flex gap-2">
                  <Link href={`/dashboard/postagem/edit/${postagem.id}`}>
                    <CustomButton icon={Edit} variant="secondary" size="small">
                      Editar
                    </CustomButton>
                  </Link>

                  {!deleteConfirmation ? (
                    <CustomButton
                      icon={Trash2}
                      className="bg-red-600 hover:bg-red-700"
                      size="small"
                      onClick={() => setDeleteConfirmation(true)}>
                      Excluir
                    </CustomButton>
                  ) : (
                    <div className="flex gap-2">
                      <CustomButton
                        className="bg-red-600 hover:bg-red-700"
                        size="small"
                        onClick={handleDelete}>
                        Confirmar
                      </CustomButton>
                      <CustomButton
                        variant="secondary"
                        size="small"
                        onClick={() => setDeleteConfirmation(false)}>
                        Cancelar
                      </CustomButton>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metadados da postagem */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <User size={16} />
                <span>{postagem.createdByName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{formatDate(postagem.createdAt)}</span>
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                {postagem.convenioName}
              </div>
            </div>

            {/* Conteúdo da postagem */}
            <div className="prose max-w-none">
              <ContentRenderer content={postagem.text} />
            </div>
          </div>

          {/* Galeria de imagens, se houver */}
          {postagem.imagens && postagem.imagens.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Imagens
              </h2>
              <ImageGallery images={postagem.imagens} />
            </div>
          )}

          {/* Tabelas, se houver */}
          {postagem.tabelas && postagem.tabelas.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Tabelas
              </h2>
              <TabelasList tabelas={postagem.tabelas} />
            </div>
          )}

          {/* Anexos, se houver */}
          {postagem.anexos && postagem.anexos.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Anexos
              </h2>
              <AnexoList anexos={postagem.anexos} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
