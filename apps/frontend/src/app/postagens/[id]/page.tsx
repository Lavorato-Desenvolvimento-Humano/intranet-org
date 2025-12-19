"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Globe,
  Users,
  Building,
  MessageSquare,
  Share2,
  ThumbsUp,
  MoreVertical,
  Send,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useAuth } from "@/context/AuthContext";
import postagemService, {
  PostagemDto,
  TabelaPostagemDto,
} from "@/services/postagem";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import ProfileAvatar from "@/components/profile/profile-avatar";
import ContentViewer from "@/components/ui/content-viewer";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { cn } from "@/utils/cn";

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
  const [commentText, setCommentText] = useState("");

  // Estado para capa
  const [coverImageOrientation, setCoverImageOrientation] = useState<
    "landscape" | "portrait"
  >("landscape");
  const [coverLoaded, setCoverLoaded] = useState(false);
  const coverImgRef = useRef<HTMLImageElement>(null);

  const postagemId = params?.id as string;

  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");

  useEffect(() => {
    const fetchPostagem = async () => {
      setLoading(true);
      try {
        const data = await postagemService.getPostagemById(postagemId);
        setPostagem(data);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError("Não foi possível carregar a postagem.");
      } finally {
        setLoading(false);
      }
    };
    if (postagemId) fetchPostagem();
  }, [postagemId]);

  // Lógica de orientação da imagem de capa (igual ao PostCard)
  const checkImageOrientation = (img: HTMLImageElement) => {
    if (img.naturalHeight > img.naturalWidth) {
      setCoverImageOrientation("portrait");
    } else {
      setCoverImageOrientation("landscape");
    }
    setCoverLoaded(true);
  };

  const isAuthor = () => user && postagem && user.id === postagem.createdById;
  const canEdit = () => isAdmin || isEditor || isAuthor();
  const canDelete = () => isAdmin || isAuthor();

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const newComment = await postagemService.addComment(
        postagemId,
        commentText
      );
      setPostagem((prev) =>
        prev
          ? { ...prev, comentarios: [newComment, ...(prev.comentarios || [])] }
          : null
      );
      setCommentText("");
      toastUtil.success("Comentário enviado.");
    } catch (err) {
      toastUtil.error("Erro ao enviar comentário.");
    }
  };

  const handleDeletePostagem = async () => {
    setConfirmDelete({ ...confirmDelete, isDeleting: true });
    try {
      await postagemService.deletePostagem(postagemId);
      toastUtil.success("Postagem excluída!");
      router.push(
        postagem?.convenioId
          ? `/convenios/${postagem.convenioId}`
          : "/convenios"
      );
    } catch (err) {
      toastUtil.error("Erro ao excluir postagem.");
      setConfirmDelete({ show: false, isDeleting: false });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-10">
          <Loading />
        </div>
      </div>
    );
  if (error || !postagem)
    return <div className="p-10 text-center">Erro ao carregar postagem</div>;

  // Extrair imagem de capa se não houver explícita, usar a primeira do array de imagens ou do HTML
  const coverUrl =
    postagem.coverImageUrl ||
    (postagem.imagens?.length > 0 ? postagem.imagens[0].url : null);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />

        <main className="flex-grow container mx-auto p-4 lg:p-8 max-w-6xl">
          <Breadcrumb
            items={[
              { label: "Feed", href: "/convenios" },
              { label: postagem.categoria, href: "#" },
              { label: "Visualizar Postagem" },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            {/* CONTEÚDO PRINCIPAL (8 Colunas) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* CABEÇALHO COM IMAGEM (SE HOUVER) */}
                {coverUrl && (
                  <div
                    className={cn(
                      "w-full bg-gray-100 flex items-center justify-center relative overflow-hidden",
                      coverImageOrientation === "portrait"
                        ? "h-[500px]"
                        : "h-[350px]"
                    )}>
                    <img
                      ref={coverImgRef}
                      src={
                        coverUrl.startsWith("http")
                          ? coverUrl
                          : `/api${coverUrl}`
                      }
                      alt={postagem.title}
                      onLoad={(e) => checkImageOrientation(e.currentTarget)}
                      className={cn(
                        "transition-all duration-700",
                        coverLoaded ? "opacity-100" : "opacity-0",
                        coverImageOrientation === "portrait"
                          ? "h-full w-auto object-contain"
                          : "w-full h-full object-cover"
                      )}
                    />
                  </div>
                )}

                {/* CORPO DA POSTAGEM */}
                <div className="p-8">
                  {/* Categoria e Data */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase rounded-full border border-blue-100">
                      {postagem.categoria}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar size={14} />{" "}
                      {new Date(postagem.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h1 className="text-3xl font-extrabold text-gray-900 mb-6 leading-tight">
                    {postagem.title}
                  </h1>

                  {/* Conteúdo Rico */}
                  <div className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-primary">
                    <ContentViewer content={postagem.text} />
                  </div>

                  {/* Galeria de Imagens Adicionais (se houver mais de 1 ou se não tiver capa usada) */}
                  {postagem.imagens &&
                    postagem.imagens.length > (coverUrl ? 1 : 0) && (
                      <div className="mt-8 border-t pt-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                          <ImageIcon size={20} /> Galeria
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {postagem.imagens
                            .filter((img) => img.url !== coverUrl)
                            .map((img, idx) => (
                              <div
                                key={idx}
                                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition">
                                <img
                                  src={img.url}
                                  className="w-full h-full object-cover"
                                  alt=""
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Anexos */}
                  {postagem.anexos && postagem.anexos.length > 0 && (
                    <div className="mt-8 bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <h3 className="text-sm font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
                        <Paperclip size={16} /> Arquivos Anexados
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {postagem.anexos.map((anexo) => (
                          <a
                            key={anexo.id}
                            href={anexo.url}
                            target="_blank"
                            className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-primary transition-all group">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-md mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <Download size={20} />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {anexo.nameFile}
                              </p>
                              <p className="text-xs text-gray-500 uppercase">
                                {anexo.typeFile?.split("/")[1] || "FILE"}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rodapé de Ações */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="flex gap-4">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-medium text-sm">
                      <ThumbsUp size={18} /> Curtir ({postagem.likesCount || 0})
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-medium text-sm">
                      <Share2 size={18} /> Compartilhar
                    </button>
                  </div>
                  {canEdit() && (
                    <div className="flex gap-2">
                      <CustomButton
                        size="small"
                        variant="primary"
                        icon={Edit}
                        onClick={() =>
                          router.push(`/postagens/${postagemId}/editar`)
                        }>
                        Editar
                      </CustomButton>
                      {canDelete() && (
                        <CustomButton
                          size="small"
                          variant="primary"
                          icon={Trash}
                          onClick={() =>
                            setConfirmDelete({ show: true, isDeleting: false })
                          }>
                          Excluir
                        </CustomButton>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção de Comentários */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <MessageSquare className="text-primary" /> Comentários (
                  {postagem.comentarios?.length || 0})
                </h3>

                {/* Input */}
                <div className="flex gap-4 mb-8">
                  <ProfileAvatar
                    profileImage={user?.profileImage}
                    userName={user?.fullName || "Eu"}
                    size={40}
                  />
                  <div className="flex-grow">
                    <form onSubmit={handlePostComment} className="relative">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Escreva um comentário construtivo..."
                        className="w-full border border-gray-200 rounded-xl p-4 pr-12 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-gray-50 h-24 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="absolute bottom-3 right-3 bg-white p-2 rounded-full shadow-sm border hover:bg-primary hover:text-white text-primary transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-primary">
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Lista */}
                <div className="space-y-6">
                  {postagem.comentarios?.map((comment) => (
                    <div key={comment.id} className="group">
                      <div className="flex gap-3 mb-2">
                        <ProfileAvatar
                          profileImage={comment.userProfileImage}
                          userName={comment.userName}
                          size={32}
                        />
                        <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4 flex-grow">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-gray-900">
                              {comment.userName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BARRA LATERAL (4 Colunas) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Autor
                </h4>
                <div className="flex items-center gap-3 mb-6">
                  <ProfileAvatar
                    profileImage={postagem.createdByProfileImage}
                    userName={postagem.createdByName}
                    size={56}
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-lg leading-tight">
                      {postagem.createdByName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Publicado em{" "}
                      {new Date(postagem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 my-4 pt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Globe size={14} /> Visibilidade
                    </span>
                    <span className="font-medium text-gray-900 capitalize">
                      {postagem.tipoDestino}
                    </span>
                  </div>
                  {postagem.convenioName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Building size={14} /> Convênio
                      </span>
                      <span className="font-medium text-gray-900">
                        {postagem.convenioName}
                      </span>
                    </div>
                  )}
                  {postagem.equipeName && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Users size={14} /> Equipe
                      </span>
                      <span className="font-medium text-gray-900">
                        {postagem.equipeName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {confirmDelete.show && (
          <ConfirmDialog
            isOpen={confirmDelete.show}
            title="Excluir Postagem"
            message="Tem certeza? Isso não pode ser desfeito."
            confirmText="Excluir Definitivamente"
            cancelText="Voltar"
            onConfirm={handleDeletePostagem}
            onCancel={() =>
              setConfirmDelete({ show: false, isDeleting: false })
            }
            isLoading={confirmDelete.isDeleting}
            variant="danger"
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
