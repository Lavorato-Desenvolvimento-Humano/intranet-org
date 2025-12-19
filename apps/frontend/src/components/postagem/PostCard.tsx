// apps/frontend/src/components/postagem/PostCard.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Globe,
  Users,
  Building,
  MoreHorizontal,
  ThumbsUp,
  Share2,
  Pin,
  Eye,
  Send,
  MessageSquare,
} from "lucide-react";
import ProfileAvatar from "@/components/profile/profile-avatar";
import postagemService, {
  PostagemSummaryDto,
  PostagemCategoria,
} from "@/services/postagem";
import { cn } from "@/utils/cn";
import toastUtil from "@/utils/toast";

interface PostCardProps {
  postagem: PostagemSummaryDto;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  showEditButton: boolean;
}

export function PostCard({
  postagem,
  onClick,
  onEdit,
  showEditButton,
}: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [liked, setLiked] = useState(postagem.likedByCurrentUser);
  const [likesCount, setLikesCount] = useState(postagem.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Estado para controlar o carregamento e orientação da imagem
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageOrientation, setImageOrientation] = useState<
    "landscape" | "portrait"
  >("landscape");
  const imageRef = useRef<HTMLImageElement>(null);

  // Mapeamento de Cores por Categoria
  const getCategoryStyle = (categoria: PostagemCategoria) => {
    switch (categoria) {
      case "AVISO":
        return "bg-red-100 text-red-700 border-red-200";
      case "MANUAL":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "CONQUISTA":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "ANUNCIO":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const previousLiked = liked;
    const previousCount = likesCount;

    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    try {
      await postagemService.toggleLike(postagem.id);
    } catch (error) {
      setLiked(previousLiked);
      setLikesCount(previousCount);
      toastUtil.error("Erro ao curtir a publicação.");
    }
  };

  const handleQuickComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await postagemService.addComment(postagem.id, commentText);
      toastUtil.success("Comentário enviado!");
      setCommentText("");
      setShowComments(false);
      onClick();
    } catch (error) {
      toastUtil.error("Erro ao enviar comentário.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Função para detectar orientação da imagem
  const checkImageOrientation = (img: HTMLImageElement) => {
    if (img.naturalHeight > img.naturalWidth) {
      setImageOrientation("portrait");
    } else {
      setImageOrientation("landscape");
    }
    setImageLoaded(true);
  };

  // Efeito para verificar imagens em cache que não disparam onLoad
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      checkImageOrientation(imageRef.current);
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = diffTime / (1000 * 60 * 60);

    if (diffHours < 24) return `${Math.floor(diffHours)}h`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const getDestinoInfo = () => {
    switch (postagem.tipoDestino) {
      case "equipe":
        return {
          icon: Users,
          label: postagem.equipeName || "Equipe",
          color: "text-green-600",
        };
      case "convenio":
        return {
          icon: Building,
          label: postagem.convenioName || "Convênio",
          color: "text-purple-600",
        };
      default:
        return { icon: Globe, label: "Geral", color: "text-blue-500" };
    }
  };

  const destino = getDestinoInfo();
  const DestinoIcon = destino.icon;
  const isLongText = (postagem.previewText?.length || 0) > 280;

  // Função para processar o HTML e corrigir URLs de imagens
  const processContentHtml = (html: string | undefined): string => {
    if (!html) return "Sem conteúdo.";

    // Corrigir URLs de imagens que não começam com http ou /api
    return html.replace(
      /<img([^>]*?)src=["']([^"']+)["']/gi,
      (match, attrs, src) => {
        // Se já é URL absoluta ou já tem /api, mantém
        if (src.startsWith("http") || src.startsWith("/api")) {
          return match;
        }
        // Se começa com /, adiciona /api
        if (src.startsWith("/")) {
          return `<img${attrs}src="/api${src}"`;
        }
        // Caso contrário, adiciona /api/
        return `<img${attrs}src="/api/${src}"`;
      }
    );
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col mb-4",
        postagem.pinned
          ? "border-l-4 border-l-yellow-400 border-gray-100"
          : "border-gray-100"
      )}>
      {/* HEADER */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            profileImage={postagem.createdByProfileImage}
            userName={postagem.createdByName}
            size={48}
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 hover:text-primary cursor-pointer">
              {postagem.createdByName}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span
                className={cn(
                  "font-medium flex items-center gap-1",
                  destino.color
                )}>
                <DestinoIcon size={12} /> {destino.label}
              </span>
              <span>•</span>
              <span>{formatDate(postagem.createdAt)}</span>
              {postagem.pinned && (
                <span
                  className="flex items-center text-yellow-600 font-semibold ml-1"
                  title="Fixado">
                  <Pin size={12} className="mr-0.5 fill-yellow-600" /> Fixado
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold border uppercase",
              getCategoryStyle(postagem.categoria)
            )}>
            {postagem.categoria}
          </span>
          {showEditButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(e);
              }}
              className="text-gray-400 hover:text-gray-700 p-1">
              <MoreHorizontal size={20} />
            </button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-4 pb-3">
        <h2
          onClick={onClick}
          className="text-base font-bold text-gray-900 mb-2 cursor-pointer hover:text-primary">
          {postagem.title}
        </h2>

        <div className="relative">
          <div
            className={cn(
              "text-sm text-gray-700 prose prose-sm max-w-none break-words",
              // Estilos para imagens inline - igual ao ContentViewer
              "prose-img:rounded-lg prose-img:shadow-sm prose-img:my-3 prose-img:max-w-full prose-img:h-auto",
              // Estilos para parágrafos e links
              "prose-p:my-2 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:underline",
              // Preservar quebras de linha e espaços
              "[&_p]:whitespace-pre-wrap [&_br]:block",
              !isExpanded && "line-clamp-4"
            )}
            dangerouslySetInnerHTML={{
              __html: processContentHtml(postagem.previewText),
            }}
          />
          {isLongText && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-primary text-xs font-semibold mt-1 flex items-center hover:underline">
              {isExpanded ? "Ocultar" : "Ver mais"}
            </button>
          )}
        </div>
      </div>

      {/* COVER IMAGE */}
      {postagem.coverImageUrl && (
        <div
          onClick={onClick}
          className={cn(
            "w-full bg-gray-50 cursor-pointer overflow-hidden border-y border-gray-100 flex items-center justify-center transition-all duration-500 ease-in-out relative",
            // Altura dinâmica baseada na orientação
            imageOrientation === "portrait" ? "h-[400px]" : "h-[250px]"
          )}>
          <img
            ref={imageRef}
            src={
              postagem.coverImageUrl.startsWith("http")
                ? postagem.coverImageUrl
                : `/api${postagem.coverImageUrl}`
            }
            alt="Capa"
            loading="lazy"
            onLoad={(e) => checkImageOrientation(e.currentTarget)}
            className={cn(
              "w-full h-full object-center transition-all duration-700",
              // Opacidade para evitar "pulo" visual enquanto carrega
              imageLoaded ? "opacity-100" : "opacity-0",
              // Hover scale apenas quando carregado
              imageLoaded && "hover:scale-105",
              // Object-fit dinâmico
              imageOrientation === "portrait"
                ? "object-contain"
                : "object-cover"
            )}
          />
        </div>
      )}

      {/* STATS BAR */}
      <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-500 border-b border-gray-50 bg-gray-50/30">
        <div className="flex items-center gap-3">
          {likesCount > 0 && (
            <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
              <div className="bg-blue-500 rounded-full p-0.5">
                <ThumbsUp size={8} className="text-white fill-white" />
              </div>
              {likesCount}
            </span>
          )}
          {postagem.viewsCount > 0 && (
            <span className="flex items-center gap-1">
              <Eye size={12} /> {postagem.viewsCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {postagem.comentariosCount > 0 && (
            <span>{postagem.comentariosCount} comentários</span>
          )}
        </div>
      </div>

      {/* ACTIONS FOOTER */}
      <div className="p-2">
        <div className="flex items-center justify-between">
          <button
            onClick={handleLike}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2 rounded-lg transition-colors",
              liked
                ? "text-blue-600 bg-blue-50"
                : "text-gray-500 hover:bg-gray-100"
            )}>
            <ThumbsUp size={18} className={cn(liked && "fill-blue-600")} />
            <span>Gostei</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className="flex-1 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-100 text-sm font-semibold py-2 rounded-lg">
            <MessageSquare size={18} />
            <span>Comentar</span>
          </button>

          <button className="flex-1 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-100 text-sm font-semibold py-2 rounded-lg">
            <Share2 size={18} />
            <span>Partilhar</span>
          </button>
        </div>

        {/* QUICK COMMENT AREA */}
        {showComments && (
          <form
            onSubmit={handleQuickComment}
            className="mt-2 flex gap-2 px-2 pb-2 animate-in slide-in-from-top-2 fade-in duration-200">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 text-sm border border-gray-300 rounded-full px-4 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              className="bg-primary text-white p-2 rounded-full hover:bg-primary-dark disabled:opacity-50 transition-colors">
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
