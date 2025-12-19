"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Save,
  X,
  LayoutTemplate,
  Eye,
  Image as ImageIcon,
  Paperclip,
  Trash,
  Edit,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import postagemService, {
  PostagemDto,
  ImagemDto,
  AnexoDto,
  PostagemCreateDto,
  PostagemSummaryDto,
} from "@/services/postagem";
import convenioService, { ConvenioDto } from "@/services/convenio";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import dynamic from "next/dynamic";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import equipeService, { EquipeDto } from "@/services/equipe";
import { PostCard } from "@/components/postagem/PostCard";

const SimpleRichEditor = dynamic(
  () => import("@/components/ui/simple-rich-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full bg-gray-100 rounded-md animate-pulse"></div>
    ),
  }
);

export default function EditarPostagemPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [postagem, setPostagem] = useState<PostagemDto | null>(null);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [equipes, setEquipes] = useState<EquipeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    text: "",
    tipoDestino: "convenio" as "geral" | "equipe" | "convenio",
    convenioId: "",
    equipeId: "",
    categoria: "GERAL",
    pinned: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"conteudo" | "imagens" | "anexos">(
    "conteudo"
  );
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{
    show: boolean;
    type: "imagem" | "anexo";
    id: string;
    name: string;
    isDeleting: boolean;
  } | null>(null);

  const postagemId = params?.id as string;
  const canEdit = () =>
    user?.roles?.some((r) =>
      ["ROLE_ADMIN", "ADMIN", "ROLE_EDITOR", "EDITOR"].includes(r)
    ) || user?.id === postagem?.createdById;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [postData, convData, eqData] = await Promise.all([
          postagemService.getPostagemById(postagemId),
          convenioService.getAllConvenios(),
          equipeService.getAllEquipes(),
        ]);
        setPostagem(postData);
        setConvenios(convData);
        setEquipes(eqData);
        setFormData({
          title: postData.title || "",
          text: postData.text || "",
          tipoDestino: postData.equipeId
            ? "equipe"
            : postData.convenioId
              ? "convenio"
              : "geral",
          convenioId: postData.convenioId || "",
          equipeId: postData.equipeId || "",
          categoria: postData.categoria || "GERAL",
          pinned: postData.pinned || false,
        });
      } catch (err) {
        setError("Erro ao carregar postagem.");
      } finally {
        setLoading(false);
      }
    };
    if (postagemId) fetchData();
  }, [postagemId]);

  const extractCoverImageFromContent = (htmlContent: string): string | null => {
    if (!htmlContent) return null;
    const imgRegex = /<img[^>]+src="([^">]+)"/;
    const match = htmlContent.match(imgRegex);
    return match ? match[1] : null;
  };

  const getPreviewPostagem = (): PostagemSummaryDto => {
    // Tenta pegar imagem do HTML ou da lista de imagens já salvas
    const coverImage =
      extractCoverImageFromContent(formData.text) ||
      postagem?.imagens?.[0]?.url;

    return {
      id: postagem?.id || "preview",
      title: formData.title || "Título",
      previewText: formData.text || "Conteúdo...",
      coverImageUrl: coverImage || undefined,
      createdAt: postagem?.createdAt || new Date().toISOString(),
      createdByName: postagem?.createdByName || user?.fullName || "",
      createdByProfileImage:
        postagem?.createdByProfileImage || user?.profileImage,
      categoria: formData.categoria as any,
      tipoDestino: formData.tipoDestino,
      convenioName:
        formData.tipoDestino === "convenio"
          ? convenios.find((c) => c.id === formData.convenioId)?.name
          : "",
      equipeName:
        formData.tipoDestino === "equipe"
          ? equipes.find((e) => e.id === formData.equipeId)?.nome
          : "",
      viewsCount: postagem?.viewsCount || 0,
      likesCount: postagem?.likesCount || 0,
      likedByCurrentUser: postagem?.likedByCurrentUser || false,
      pinned: formData.pinned,
      hasImagens:
        formData.text.includes("<img") || (postagem?.imagens.length || 0) > 0,
      hasAnexos:
        formData.text.includes("<a") || (postagem?.anexos.length || 0) > 0,
      hasTabelas:
        formData.text.includes("<table") || (postagem?.tabelas.length || 0) > 0,
      comentariosCount: 0,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.text.trim()) return;

    setSubmitting(true);
    try {
      await postagemService.updatePostagem(postagemId, {
        ...formData,
        categoria: formData.categoria as any,
        convenioId:
          formData.tipoDestino === "convenio" ? formData.convenioId : undefined,
        equipeId:
          formData.tipoDestino === "equipe" ? formData.equipeId : undefined,
      });
      toastUtil.success("Atualizado com sucesso!");
      router.push(`/postagens/${postagemId}`);
    } catch (err) {
      toastUtil.error("Erro ao atualizar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!confirmDeleteItem) return;
    setConfirmDeleteItem({ ...confirmDeleteItem, isDeleting: true });
    try {
      if (confirmDeleteItem.type === "imagem") {
        await postagemService.deleteImagem(confirmDeleteItem.id);
        setPostagem((prev) =>
          prev
            ? {
                ...prev,
                imagens: prev.imagens.filter(
                  (i) => i.id !== confirmDeleteItem.id
                ),
              }
            : null
        );
      } else {
        await postagemService.deleteAnexo(confirmDeleteItem.id);
        setPostagem((prev) =>
          prev
            ? {
                ...prev,
                anexos: prev.anexos.filter(
                  (a) => a.id !== confirmDeleteItem.id
                ),
              }
            : null
        );
      }
      toastUtil.success("Excluído com sucesso!");
    } catch (err) {
      toastUtil.error("Erro ao excluir.");
    } finally {
      setConfirmDeleteItem(null);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="p-10">
          <Loading />
        </div>
      </div>
    );
  if (!postagem)
    return <div className="p-10 text-center">Postagem não encontrada</div>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-4 lg:p-8">
          <Breadcrumb
            items={[
              { label: "Voltar", href: `/postagens/${postagemId}` },
              { label: "Editar" },
            ]}
          />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Edit className="text-primary" /> Editar Postagem
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* COLUNA ESQUERDA - EDITOR */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Abas */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setActiveTab("conteudo")}
                    className={`flex-1 py-3 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === "conteudo" ? "bg-white text-primary border-t-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}>
                    <LayoutTemplate size={16} /> Conteúdo
                  </button>
                  <button
                    onClick={() => setActiveTab("imagens")}
                    className={`flex-1 py-3 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === "imagens" ? "bg-white text-primary border-t-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}>
                    <ImageIcon size={16} /> Imagens ({postagem.imagens.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("anexos")}
                    className={`flex-1 py-3 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === "anexos" ? "bg-white text-primary border-t-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}>
                    <Paperclip size={16} /> Anexos ({postagem.anexos.length})
                  </button>
                </div>

                <div className="p-6">
                  {activeTab === "conteudo" && (
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4 mb-6">
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          className="w-full text-lg font-bold px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                          placeholder="Título da postagem"
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <select
                            value={formData.tipoDestino}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                tipoDestino: e.target.value as any,
                              })
                            }
                            className="px-3 py-2 border rounded-lg text-sm bg-white">
                            <option value="geral">Geral</option>
                            <option value="equipe">Equipe</option>
                            <option value="convenio">Convênio</option>
                          </select>

                          {formData.tipoDestino === "convenio" && (
                            <select
                              value={formData.convenioId}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  convenioId: e.target.value,
                                })
                              }
                              className="px-3 py-2 border rounded-lg text-sm bg-white">
                              {convenios.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          )}

                          {formData.tipoDestino === "equipe" && (
                            <select
                              value={formData.equipeId}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  equipeId: e.target.value,
                                })
                              }
                              className="px-3 py-2 border rounded-lg text-sm bg-white">
                              {equipes.map((e) => (
                                <option key={e.id} value={e.id}>
                                  {e.nome}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      <SimpleRichEditor
                        value={formData.text}
                        onChange={(content) =>
                          setFormData({ ...formData, text: content })
                        }
                        onImageUpload={async (file) => {
                          const img = await postagemService.addImagem(
                            postagemId,
                            file
                          );
                          setPostagem((p) =>
                            p ? { ...p, imagens: [...p.imagens, img] } : null
                          );
                          return img.url;
                        }}
                        onFileUpload={async (file) => {
                          const anx = await postagemService.addAnexo(
                            postagemId,
                            file
                          );
                          setPostagem((p) =>
                            p ? { ...p, anexos: [...p.anexos, anx] } : null
                          );
                          return anx.url;
                        }}
                      />

                      <div className="flex justify-end gap-3 mt-6">
                        <CustomButton
                          variant="primary"
                          onClick={() => router.back()}>
                          Cancelar
                        </CustomButton>
                        <CustomButton
                          type="submit"
                          variant="primary"
                          icon={Save}
                          disabled={submitting}>
                          Salvar Alterações
                        </CustomButton>
                      </div>
                    </form>
                  )}

                  {activeTab === "imagens" && (
                    <div className="grid grid-cols-2 gap-4">
                      {postagem.imagens.map((img) => (
                        <div
                          key={img.id}
                          className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-video">
                          <img
                            src={img.url}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                          <button
                            onClick={() =>
                              setConfirmDeleteItem({
                                show: true,
                                type: "imagem",
                                id: img.id,
                                name: "Imagem",
                                isDeleting: false,
                              })
                            }
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                            <Trash size={16} />
                          </button>
                        </div>
                      ))}
                      {postagem.imagens.length === 0 && (
                        <p className="col-span-2 text-center text-gray-400 py-10">
                          Nenhuma imagem gerenciada.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === "anexos" && (
                    <div className="space-y-2">
                      {postagem.anexos.map((anx) => (
                        <div
                          key={anx.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Paperclip
                              size={16}
                              className="text-gray-400 flex-shrink-0"
                            />
                            <span className="truncate text-sm">
                              {anx.nameFile}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setConfirmDeleteItem({
                                show: true,
                                type: "anexo",
                                id: anx.id,
                                name: anx.nameFile,
                                isDeleting: false,
                              })
                            }
                            className="text-red-500 hover:bg-red-50 p-1 rounded">
                            <Trash size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA - PREVIEW */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <Eye size={14} /> Preview ao Vivo
                </h3>
                <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
                  <div className="pointer-events-none select-none transform scale-95 origin-top">
                    <PostCard
                      postagem={getPreviewPostagem()}
                      onClick={() => {}}
                      showEditButton={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {confirmDeleteItem && (
          <ConfirmDialog
            isOpen={confirmDeleteItem.show}
            title="Excluir item"
            message={`Deseja excluir ${confirmDeleteItem.name}?`}
            onConfirm={handleDeleteItem}
            onCancel={() => setConfirmDeleteItem(null)}
            isLoading={confirmDeleteItem.isDeleting}
            variant="danger"
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
