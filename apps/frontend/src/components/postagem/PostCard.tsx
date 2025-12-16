// apps/frontend/src/components/postagem/PostCard.tsx
import React from "react";
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
        return { icon: Globe, label: "Geral", color: "text-gray-500" };
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

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col">
      {/* HEADER: Autor, Data e Contexto */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            profileImage={postagem.createdByProfileImage}
            userName={postagem.createdByName}
            size={42}
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 leading-none">
              {postagem.createdByName}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
              <span>{postagem.createdByName.split(" ")[0]} publicou em</span>
              <span
                className={cn(
                  "font-medium flex items-center gap-1",
                  destino.color
                )}>
                <DestinoIcon size={12} /> {destino.label}
              </span>
              <span className="text-gray-300">•</span>
              <span>{formatDate(postagem.createdAt.toString())}</span>
            </div>
          </div>
        </div>

        {showEditButton && (
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-50 transition-colors">
            <MoreHorizontal size={20} />
          </button>
        )}
      </div>

      {/* CONTEÚDO DE TEXTO */}
      <div className="px-4 pb-2">
        <h2 className="text-base font-bold text-gray-900 mb-2 leading-tight">
          {postagem.title}
        </h2>
        {/* CORREÇÃO AQUI: Uso de dangerouslySetInnerHTML para renderizar o HTML */}
        <div
          className="text-sm text-gray-700 leading-relaxed line-clamp-4 prose prose-sm max-w-none [&>p]:mb-0 [&>p]:inline"
          dangerouslySetInnerHTML={{
            __html: postagem.previewText || "Ver detalhes da publicação...",
          }}
        />
      </div>

      {/* ÁREA DE MÍDIA (Imagem Grande) */}
      {postagem.coverImageUrl && (
        <div className="mt-3 w-full bg-gray-50 border-t border-b border-gray-50 relative">
          <img
            src={
              postagem.coverImageUrl.startsWith("http")
                ? postagem.coverImageUrl
                : `${process.env.NEXT_PUBLIC_API_URL || ""}${postagem.coverImageUrl}`
            }
            alt="Anexo da publicação"
            className="w-full h-auto max-h-[500px] object-cover object-center"
            loading="lazy"
          />
        </div>
      )}

      {/* RODAPÉ: Tags e Ações Simuladas */}
      <div className="p-4">
        {/* Tags de Anexos */}
        {(postagem.hasAnexos || postagem.hasTabelas) && (
          <div className="flex gap-2 mb-4">
            {postagem.hasAnexos && (
              <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                <Paperclip size={12} className="mr-1.5" /> Material Anexo
              </span>
            )}
            {postagem.hasTabelas && (
              <span className="inline-flex items-center text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                <TableIcon size={12} className="mr-1.5" /> Dados Tabulares
              </span>
            )}
          </div>
        )}

        {/* Botões de Ação (Visual Only - para dar feel de rede social) */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors py-1 px-2 rounded hover:bg-gray-50">
            <ThumbsUp size={18} />{" "}
            <span className="hidden sm:inline">Curtir</span>
          </button>
          <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors py-1 px-2 rounded hover:bg-gray-50">
            <MessageSquare size={18} />{" "}
            <span className="hidden sm:inline">Comentar</span>
          </button>
          <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors py-1 px-2 rounded hover:bg-gray-50">
            <Share2 size={18} />{" "}
            <span className="hidden sm:inline">Compartilhar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
