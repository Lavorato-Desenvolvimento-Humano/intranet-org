import React from "react";
import {
  Globe,
  Users,
  Building,
  MoreVertical,
  Image as ImageIcon,
  Paperclip,
  Table as TableIcon,
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1)
      return `Hoje às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays <= 7) return `há ${diffDays} dias`;
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getDestinoBadge = () => {
    switch (postagem.tipoDestino) {
      case "geral":
        return (
          <span className="flex items-center text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
            <Globe size={10} className="mr-1" /> Geral
          </span>
        );
      case "equipe":
        return (
          <span className="flex items-center text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
            <Users size={10} className="mr-1" />{" "}
            {postagem.equipeName || "Equipe"}
          </span>
        );
      case "convenio":
        return (
          <span className="flex items-center text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
            <Building size={10} className="mr-1" />{" "}
            {postagem.convenioName || "Convênio"}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full">
      {/* HEADER: Autor e Data */}
      <div className="p-4 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            profileImage={postagem.createdByProfileImage}
            userName={postagem.createdByName}
            size={38}
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">
              {postagem.createdByName}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatDate(postagem.createdAt.toString())}
              </span>
              {getDestinoBadge()}
            </div>
          </div>
        </div>
        {showEditButton && (
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical size={18} />
          </button>
        )}
      </div>

      {/* ÁREA DE IMAGEM (Se houver) - Estilo Instagram */}
      {postagem.coverImageUrl ? (
        <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
          {/* Fallback para imagem segura caso venha relativa */}
          <img
            src={
              postagem.coverImageUrl.startsWith("http")
                ? postagem.coverImageUrl
                : `${process.env.NEXT_PUBLIC_API_URL || ""}${postagem.coverImageUrl}`
            }
            alt="Capa da postagem"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none"; // Esconde se falhar
            }}
          />
        </div>
      ) : (
        // Se não tiver imagem, damos mais espaço para o texto
        <div className="h-2 w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
      )}

      {/* CONTEÚDO */}
      <div className="p-4 flex-grow flex flex-col">
        <h2 className="text-lg font-bold text-gray-800 mb-2 leading-tight group-hover:text-primary transition-colors">
          {postagem.title}
        </h2>

        {/* Usamos o previewText limpo vindo do backend */}
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
          {postagem.previewText || "Sem pré-visualização disponível."}
        </p>

        {/* Tags de Anexos no final */}
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {!postagem.coverImageUrl && postagem.hasImagens && (
            <span className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              <ImageIcon size={12} className="mr-1" /> + Imagens
            </span>
          )}
          {postagem.hasAnexos && (
            <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
              <Paperclip size={12} className="mr-1" /> Anexo
            </span>
          )}
          {postagem.hasTabelas && (
            <span className="inline-flex items-center text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
              <TableIcon size={12} className="mr-1" /> Tabela
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
