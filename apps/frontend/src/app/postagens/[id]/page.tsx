// src/app/postagens/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  User,
  AlertTriangle,
  Paperclip,
  Download,
  Edit,
  Trash,
  MessageSquare,
  Clock,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import { Postagem } from "@/services/postagem";
import { Convenio } from "@/services/convenio";
import postagemService from "@/services/postagem";
import convenioService from "@/services/convenio";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import TabelaVisualizacao from "@/components/postagens/TabelaVisualizacao";
import { useAuth } from "@/context/AuthContext";

export default function PostagemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [postagem, setPostagem] = useState<Postagem | null>(null);
  const [convenio, setConvenio] = useState<Convenio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<number>(0);

  const postagemId = params.id as string;

  // Carregar dados da postagem
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar a postagem
        const postagemData = await postagemService.getPostagemById(postagemId);
        setPostagem(postagemData);

        // Buscar o convênio associado
        if (postagemData && postagemData.convenioId) {
          const convenioData = await convenioService.getConvenioById(
            postagemData.convenioId
          );
          setConvenio(convenioData);
        }
      } catch (error: any) {
        console.error("Erro ao carregar dados da postagem:", error);
        setError(
          "Não foi possível carregar os dados da postagem. Tente novamente mais tarde."
        );
        toastUtil.error("Erro ao carregar informações da postagem");
      } finally {
        setLoading(false);
      }
    };

    if (postagemId) {
      fetchData();
    }
  }, [postagemId]);

  // Formatar a data para exibição
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Verificar se o usuário atual é o autor da postagem
  const isAuthor = user?.id === postagem?.createdBy;

  // Voltar para a página anterior
  const handleBack = () => {
    router.back();
  };

  // Navegar para a página de edição
  const handleEdit = () => {
    router.push(`/postagens/edit/${postagemId}`);
  };

  // Excluir a postagem
  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir esta postagem?")) {
      return;
    }

    try {
      setLoading(true);
      await postagemService.deletePostagem(postagemId);

      toastUtil.success("Postagem excluída com sucesso!");

      // Redirecionar para a página do convênio ou dashboard
      if (convenio) {
        router.push(`/convenios/${convenio.id}`);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Erro ao excluir postagem:", error);
      toastUtil.error("Erro ao excluir postagem. Tente novamente.");
      setLoading(false);
    }
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

            {/* Detalhes da postagem */}
            {!loading && !error && postagem && (
              <div>
                {/* Cabeçalho com título e convênio */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {postagem.title}
                  </h1>

                  <div className="flex flex-wrap gap-4 items-center text-sm text-neutral-medium mb-6">
                    {convenio && (
                      <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full">
                        {convenio.name}
                      </span>
                    )}

                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(postagem.createdAt)}</span>
                    </div>

                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>Criado por: Admin</span>
                    </div>

                    {postagem.createdAt !== postagem.updatedAt && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>
                          Atualizado em: {formatDate(postagem.updatedAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botões de ação (editar/excluir) */}
                  {isAuthor && (
                    <div className="flex gap-2 mb-6">
                      <CustomButton
                        variant="secondary"
                        icon={Edit}
                        onClick={handleEdit}
                        className="border border-gray-300">
                        Editar
                      </CustomButton>
                      <CustomButton
                        variant="secondary"
                        icon={Trash}
                        onClick={handleDelete}
                        className="border border-red-300 text-red-600 hover:bg-red-50">
                        Excluir
                      </CustomButton>
                    </div>
                  )}
                </div>

                {/* Galeria de imagens */}
                {postagem.imagens && postagem.imagens.length > 0 && (
                  <div className="mb-8">
                    <div className="relative h-80 w-full bg-gray-200 mb-2 rounded-lg overflow-hidden">
                      <Image
                        src={postagem.imagens[selectedImage].url}
                        alt={
                          postagem.imagens[selectedImage].description ||
                          postagem.title
                        }
                        fill
                        style={{ objectFit: "contain" }}
                        className="transition-opacity duration-300"
                      />

                      {postagem.imagens[selectedImage].description && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-3">
                          <p>{postagem.imagens[selectedImage].description}</p>
                        </div>
                      )}
                    </div>

                    {postagem.imagens.length > 1 && (
                      <div className="flex overflow-x-auto space-x-2 py-2">
                        {postagem.imagens.map((imagem, index) => (
                          <div
                            key={imagem.id}
                            onClick={() => setSelectedImage(index)}
                            className={`relative h-20 w-20 flex-shrink-0 bg-gray-100 cursor-pointer 
                              ${selectedImage === index ? "ring-2 ring-primary" : "hover:opacity-80"}`}>
                            <Image
                              src={imagem.url}
                              alt={imagem.description || `Imagem ${index + 1}`}
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Conteúdo da postagem */}
                <div className="prose max-w-none mb-8">
                  <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-line">
                    {postagem.text}
                  </div>
                </div>

                {/* Tabelas */}
                {postagem.tabelas && postagem.tabelas.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
                      Tabelas
                    </h2>

                    <div className="space-y-6">
                      {postagem.tabelas.map((tabela) => (
                        <TabelaVisualizacao key={tabela.id} tabela={tabela} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Anexos */}
                {postagem.anexos && postagem.anexos.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
                      Anexos
                    </h2>

                    <div className="space-y-2">
                      {postagem.anexos.map((anexo) => (
                        <div
                          key={anexo.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center">
                            <Paperclip
                              className="mr-3 text-gray-400"
                              size={20}
                            />
                            <div>
                              <p className="font-medium">{anexo.nameFile}</p>
                              {anexo.typeFile && (
                                <p className="text-xs text-gray-500">
                                  {anexo.typeFile}
                                </p>
                              )}
                            </div>
                          </div>

                          <a
                            href={anexo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center text-primary hover:text-primary-light">
                            <Download size={18} />
                          </a>
                        </div>
                      ))}
                    </div>
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
