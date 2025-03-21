// src/components/postagens/PostagemCard.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, FileText, Table, Paperclip, ArrowRight } from "lucide-react";
import { Postagem } from "@/services/postagem";

interface PostagemCardProps {
  postagem: Postagem;
}

const PostagemCard: React.FC<PostagemCardProps> = ({ postagem }) => {
  // Formatar a data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para criar uma versão resumida do texto
  const getExcerpt = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all">
      {/* Imagem principal caso exista */}
      {postagem.imagens && postagem.imagens.length > 0 && (
        <div className="relative h-48 w-full bg-gray-200">
          <Image
            src={postagem.imagens[0].url}
            alt={postagem.imagens[0].description || postagem.title}
            fill
            style={{ objectFit: "cover" }}
            className="transition-opacity opacity-0 duration-500"
            onLoadingComplete={(image: HTMLImageElement) =>
              image.classList.remove("opacity-0")
            }
          />
        </div>
      )}

      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {postagem.title}
        </h3>

        <div className="flex items-center text-xs text-neutral-medium mb-3">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{formatDate(postagem.createdAt)}</span>

          {/* Indicadores de conteúdo */}
          <div className="flex items-center ml-auto space-x-2">
            {postagem.imagens && postagem.imagens.length > 0 && (
              <span
                className="flex items-center"
                title={`${postagem.imagens.length} imagem(ns)`}>
                <Image
                  src="/icons/image.svg"
                  alt="Imagens"
                  width={14}
                  height={14}
                  className="mr-1"
                />
                {postagem.imagens.length}
              </span>
            )}

            {postagem.anexos && postagem.anexos.length > 0 && (
              <span
                className="flex items-center"
                title={`${postagem.anexos.length} anexo(s)`}>
                <Paperclip className="h-3 w-3 mr-1" />
                {postagem.anexos.length}
              </span>
            )}

            {postagem.tabelas && postagem.tabelas.length > 0 && (
              <span
                className="flex items-center"
                title={`${postagem.tabelas.length} tabela(s)`}>
                <Table className="h-3 w-3 mr-1" />
                {postagem.tabelas.length}
              </span>
            )}
          </div>
        </div>

        <p className="text-neutral-dark text-sm mb-4">
          {getExcerpt(postagem.text)}
        </p>

        <Link
          href={`/postagens/${postagem.id}`}
          className="text-primary flex items-center text-sm font-medium hover:text-primary-light transition-colors">
          Ler mais
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default PostagemCard;
