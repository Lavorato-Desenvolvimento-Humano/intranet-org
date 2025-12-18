// apps/frontend/src/components/postagem/PostCard.tsx
"use client";

import React, { useState } from "react";
import {
  Globe,
  Users,
  Building,
  MoreHorizontal,
  Paperclip,
  Table as TableIcon,
  MessageSquare,
  ThumbsUp,
  Share2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ProfileAvatar from "@/components/profile/profile-avatar";
import { PostagemSummaryDto } from "@/services/postagem";
import { cn } from "@/utils/cn";

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = diffTime / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Agora mesmo";
    if (diffHours < 24) return `${Math.floor(diffHours)}h`;
    if (diffDays <= 7) return `${diffDays}d`;

    return date
      .toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
      .replace(".", "");
  };

  const getDestinoInfo = () => {
    switch (postagem.tipoDestino) {
      case "geral":
        return { icon: Globe, label: "Geral", color: "text-blue-500" };
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
        return { icon: Globe, label: "Público", color: "text-gray-500" };
    }
  };

  const destino = getDestinoInfo();
  const DestinoIcon = destino.icon;

  // Verifica se o texto é longo o suficiente para precisar do "Ver mais"
  const isLongText = (postagem.previewText?.length || 0) > 280;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col mb-4">
      {/* HEADER: Informações do Autor e Contexto */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            profileImage={postagem.createdByProfileImage}
            userName={postagem.createdByName}
            size={48}
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 hover:text-primary hover:underline cursor-pointer">
              {postagem.createdByName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span
                className={cn(
                  "font-medium flex items-center gap-1",
                  destino.color
                )}>
                <DestinoIcon size={12} /> {destino.label}
              </span>
              <span>•</span>
              <span>{formatDate(postagem.createdAt)}</span>
            </div>
          </div>
        </div>

        {showEditButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(e);
            }}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-50 transition-colors">
            <MoreHorizontal size={20} />
          </button>
        )}
      </div>

      {/* TÍTULO E CONTEÚDO */}
      <div className="px-4 pb-3">
        <h2
          onClick={onClick}
          className="text-base font-bold text-gray-900 mb-2 leading-tight cursor-pointer hover:text-primary transition-colors">
          {postagem.title}
        </h2>

        <div className="relative">
          <div
            className={cn(
              "text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none transition-all duration-300",
              !isExpanded && "line-clamp-4 overflow-hidden"
            )}
            dangerouslySetInnerHTML={{
              __html: postagem.previewText || "Sem conteúdo disponível.",
            }}
          />

          {isLongText && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-primary text-sm font-semibold mt-2 flex items-center gap-1 hover:underline">
              {isExpanded ? (
                <>
                  Ocultar <ChevronUp size={14} />
                </>
              ) : (
                <>
                  ... ver mais <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ÁREA DE MÍDIA: Imagem de Capa */}
      {postagem.coverImageUrl && (
        <div
          onClick={onClick}
          className="w-full bg-gray-50 border-y border-gray-100 cursor-pointer overflow-hidden">
          <img
            src={
              postagem.coverImageUrl.startsWith("http")
                ? postagem.coverImageUrl
                : `${process.env.NEXT_PUBLIC_API_URL || ""}${postagem.coverImageUrl}`
            }
            alt="Capa da publicação"
            className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}

      {/* RODAPÉ: Tags e Ações Sociais */}
      <div className="p-3">
        {/* Indicadores de Anexo */}
        {(postagem.hasAnexos || postagem.hasTabelas) && (
          <div className="flex gap-2 mb-3 px-1">
            {postagem.hasAnexos && (
              <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                <Paperclip size={10} className="mr-1" /> Anexos
              </span>
            )}
            {postagem.hasTabelas && (
              <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                <TableIcon size={10} className="mr-1" /> Tabelas
              </span>
            )}
          </div>
        )}

        {/* Barra de Ações (Feel de Rede Social) */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button className="flex-1 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 text-sm font-semibold transition-all py-2 rounded-lg group">
            <ThumbsUp
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
            <span>Gostei</span>
          </button>

          <button
            onClick={onClick}
            className="flex-1 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 text-sm font-semibold transition-all py-2 rounded-lg group">
            <MessageSquare
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
            <span>Comentar</span>
          </button>

          <button className="flex-1 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 text-sm font-semibold transition-all py-2 rounded-lg group">
            <Share2
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
            <span>Partilhar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
