"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Edit,
  Trash,
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Paperclip,
  Table,
  AlertTriangle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useAuth } from "@/context/AuthContext";
import postagemService, {
  PostagemDto,
  AnexoDto,
  ImagemDto,
  TabelaPostagemDto,
} from "@/services/postagem";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";

export default function PostagemViewPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [postagem, setPostagem] = useState<PostagemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    isDeleting: false,
  });
  const [activeTab, setActiveTab] = useState<
    "conteudo" | "anexos" | "imagens" | "tabelas"
  >("conteudo");

  const postagemId = params?.id as string;

  // Verificar permissões
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");

  // Buscar dados da postagem
  useEffect(() => {
    const fetchPostagem = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await postagemService.getPostagemById(postagemId);
        setPostagem(data);
      } catch (err) {
        console.error("Erro ao buscar dados da postagem:", err);
        setError(
          "Não foi possível carregar os dados da postagem. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    if (postagemId) {
      fetchPostagem();
    }
  }, [postagemId]);

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

  // Função para verificar se o usuário atual é o autor da postagem
  const isAuthor = () => {
    return user && postagem && user.id === postagem.createdById;
  };

  // Verificar se o usuário pode editar a postagem
  const canEdit = () => {
    return isAdmin || isEditor || isAuthor();
  };

  // Verificar se o usuário pode excluir a postagem
  const canDelete = () => {
    return isAdmin || isAuthor();
  };

  // Função para excluir postagem
  const handleDeletePostagem = async () => {
    setConfirmDelete({ ...confirmDelete, isDeleting: true });
    try {
      await postagemService.deletePostagem(postagemId);
      toastUtil.success("Postagem excluída com sucesso!");
      // Redirecionar para a página do convênio
      if (postagem?.convenioId) {
        router.push(`/convenios/${postagem.convenioId}`);
      } else {
        router.push("/convenios");
      }
    } catch (err) {
      console.error("Erro ao excluir postagem:", err);
      toastUtil.error("Erro ao excluir postagem. Tente novamente mais tarde.");
      setConfirmDelete({ show: false, isDeleting: false });
    }
  };

  // Função para renderizar tabela
  const renderTabela = (tabela: TabelaPostagemDto) => {
    try {
      // Tentar analisar o JSON da tabela
      const tabelaData = JSON.parse(tabela.conteudo);

      // Verificar se é um array de objetos com cabeçalhos e linhas
      if (
        tabelaData &&
        tabelaData.headers &&
        Array.isArray(tabelaData.headers) &&
        tabelaData.rows &&
        Array.isArray(tabelaData.rows)
      ) {
        return (
          <div className="overflow-x-auto mt-4 mb-6">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {tabelaData.headers.map((header: string, index: number) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 last:border-r-0">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tabelaData.rows.map((row: any[], rowIndex: number) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-300 last:border-r-0">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } else if (Array.isArray(tabelaData)) {
        // Caso seja um array simples (possivelmente um array de objetos)
        if (tabelaData.length === 0) {
          return <div className="p-4 text-gray-500">Tabela vazia</div>;
        }

        // Extrair cabeçalhos dos campos do primeiro objeto
        const headers = Object.keys(tabelaData[0]);

        return (
          <div className="overflow-x-auto mt-4 mb-6">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 last:border-r-0">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tabelaData.map((row: any, rowIndex: number) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {headers.map((header, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-300 last:border-r-0">
                        {row[header]?.toString() || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } else {
        // Tentar renderizar tabela genérica ou objeto
        return (
          <div className="bg-gray-50 p-4 rounded-md mt-4 mb-6">
            <p className="text-sm text-gray-700 mb-2">Conteúdo da tabela:</p>
            <pre className="bg-white p-3 rounded-md border border-gray-300 overflow-auto max-h-96 text-sm">
              {JSON.stringify(tabelaData, null, 2)}
            </pre>
          </div>
        );
      }
    } catch (error) {
      console.error("Erro ao renderizar tabela:", error);
      return (
        <div className="bg-red-50 p-4 rounded-md mt-4 mb-6 flex">
          <AlertTriangle className="text-red-500 mr-2" size={20} />
          <div>
            <p className="text-sm font-medium text-red-800">
              Erro ao carregar tabela
            </p>
            <p className="text-sm text-red-600">
              O formato da tabela é inválido ou não pode ser processado.
            </p>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando dados da postagem..." />
        </main>
      </div>
    );
  }

  if (error || !postagem) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 flex items-center">
            <AlertTriangle className="mr-2" />
            {error || "Postagem não encontrada."}
          </div>
          <button
            onClick={() => router.push("/convenios")}
            className="flex items-center text-primary hover:text-primary-dark transition-colors">
            <ArrowLeft size={16} className="mr-1" />
            Voltar para a lista de convênios
          </button>
        </main>
      </div>
    );
  }

  const hasImagens = postagem.imagens && postagem.imagens.length > 0;
  const hasAnexos = postagem.anexos && postagem.anexos.length > 0;
  const hasTabelas = postagem.tabelas && postagem.tabelas.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto p-6">
        <Breadcrumb
          items={[
            { label: "Convênios", href: "/convenios" },
            {
              label: postagem.convenioName,
              href: `/convenios/${postagem.convenioId}`,
            },
            { label: postagem.title },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{postagem.title}</h1>
          <div className="flex space-x-2">
            {canEdit() && (
              <CustomButton
                variant="primary"
                icon={Edit}
                onClick={() => router.push(`/postagens/${postagemId}/editar`)}>
                Editar
              </CustomButton>
            )}
            {canDelete() && (
              <CustomButton
                variant="secondary"
                icon={Trash}
                onClick={() =>
                  setConfirmDelete({ show: true, isDeleting: false })
                }
                className="text-red-500 border-red-500 hover:bg-red-50">
                Excluir
              </CustomButton>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Informações da postagem */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Detalhes da Postagem
                </h2>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar size={16} className="mr-1 text-gray-400" />
                {formatDate(postagem.createdAt)}
                <Clock size={16} className="ml-3 mr-1 text-gray-400" />
                {formatTime(postagem.createdAt)}
              </div>
            </div>
            <div className="flex flex-wrap">
              <div className="w-full md:w-1/2 mb-2 md:mb-0">
                <p className="text-sm text-gray-500">Autor:</p>
                <p className="text-gray-800">{postagem.createdByName}</p>
              </div>
              <div className="w-full md:w-1/2">
                <p className="text-sm text-gray-500">Convênio:</p>
                <p className="text-gray-800">{postagem.convenioName}</p>
              </div>
            </div>
          </div>

          {/* Navegação entre conteúdo, anexos, imagens e tabelas */}
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px">
              <button
                onClick={() => setActiveTab("conteudo")}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === "conteudo"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                Conteúdo
              </button>
              {hasImagens && (
                <button
                  onClick={() => setActiveTab("imagens")}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "imagens"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}>
                  <div className="flex items-center">
                    <ImageIcon size={16} className="mr-2" />
                    Imagens ({postagem.imagens.length})
                  </div>
                </button>
              )}
              {hasAnexos && (
                <button
                  onClick={() => setActiveTab("anexos")}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "anexos"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}>
                  <div className="flex items-center">
                    <Paperclip size={16} className="mr-2" />
                    Anexos ({postagem.anexos.length})
                  </div>
                </button>
              )}
              {hasTabelas && (
                <button
                  onClick={() => setActiveTab("tabelas")}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "tabelas"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}>
                  <div className="flex items-center">
                    <Table size={16} className="mr-2" />
                    Tabelas ({postagem.tabelas.length})
                  </div>
                </button>
              )}
            </nav>
          </div>

          {/* Conteúdo da aba selecionada */}
          <div className="p-6">
            {activeTab === "conteudo" && (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: postagem.text }}
              />
            )}

            {activeTab === "imagens" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {postagem.imagens.map((imagem, index) => (
                  <div key={imagem.id} className="bg-gray-50 p-4 rounded-lg">
                    <img
                      src={imagem.url}
                      alt={imagem.description || `Imagem ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg mb-2"
                    />
                    {imagem.description && (
                      <p className="text-sm text-gray-600 text-center">
                        {imagem.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "anexos" && (
              <div className="space-y-2">
                {postagem.anexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="mr-3 text-gray-400">
                      <Paperclip size={20} />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-700">
                        {anexo.nameFile}
                      </p>
                      <p className="text-xs text-gray-500">{anexo.typeFile}</p>
                    </div>
                    <a
                      href={anexo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-primary hover:text-primary-dark transition-colors"
                      title="Baixar anexo">
                      <Download size={20} />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "tabelas" && (
              <div className="space-y-8">
                {postagem.tabelas.map((tabela, index) => (
                  <div key={tabela.id} className="bg-white">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Tabela {index + 1}
                    </h3>
                    {renderTabela(tabela)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Diálogo de confirmação de exclusão */}
      {confirmDelete.show && (
        <ConfirmDialog
          isOpen={confirmDelete.show}
          title="Excluir Postagem"
          message="Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={handleDeletePostagem}
          onCancel={() => setConfirmDelete({ show: false, isDeleting: false })}
          isLoading={confirmDelete.isDeleting}
          variant="danger"
        />
      )}
    </div>
  );
}
