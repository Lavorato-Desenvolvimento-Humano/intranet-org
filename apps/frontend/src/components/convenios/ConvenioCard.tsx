// src/components/convenios/ConvenioCard.tsx
import React from "react";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { Convenio } from "@/services/convenio";

interface ConvenioCardProps {
  convenio: Convenio;
}

const ConvenioCard: React.FC<ConvenioCardProps> = ({ convenio }) => {
  // Formatar a data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-xl font-bold text-primary mb-2">{convenio.name}</h3>
        <p className="text-neutral-dark mb-4 line-clamp-2">
          {convenio.description || "Sem descrição disponível"}
        </p>
        <div className="flex items-center text-xs text-neutral-medium">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Atualizado em: {formatDate(convenio.updatedAt)}</span>
        </div>
      </div>
      <div className="p-3 bg-gray-50 flex justify-end">
        <Link
          href={`/convenios/${convenio.id}`}
          className="text-primary flex items-center text-sm font-medium hover:text-primary-light transition-colors">
          Ver detalhes
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default ConvenioCard;
