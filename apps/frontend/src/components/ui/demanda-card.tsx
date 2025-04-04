// src/components/ui/demanda-card.tsx
import React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User } from "lucide-react";
import DemandaBadge from "./demanda-badge";
import {
  Demanda,
  isDemandaAtrasada,
  isDemandaProximaAVencer,
} from "@/types/demanda";

interface DemandaCardProps {
  demanda: Demanda;
  onStatusChange?: (id: string, status: string) => void;
  showActions?: boolean;
}

const DemandaCard: React.FC<DemandaCardProps> = ({
  demanda,
  onStatusChange,
  showActions = true,
}) => {
  const router = useRouter();

  // Formatar datas para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Verificar se está atrasada ou próxima a vencer
  const isAtrasada = isDemandaAtrasada(demanda);
  const isProximaAVencer = isDemandaProximaAVencer(demanda);

  // Navegar para a página de detalhes da demanda
  const handleClick = () => {
    router.push(`/demandas/${demanda.id}`);
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 border-l-4 cursor-pointer transition-all hover:shadow-lg ${
        isAtrasada
          ? "border-red-500"
          : isProximaAVencer
            ? "border-yellow-500"
            : "border-blue-500"
      }`}
      onClick={handleClick}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-medium text-gray-800">{demanda.titulo}</h3>
        <div className="flex space-x-2">
          <DemandaBadge type="prioridade" value={demanda.prioridade} />
          <DemandaBadge type="status" value={demanda.status} />
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-4 line-clamp-2">
        {demanda.descricao}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-500">
          <User size={16} className="mr-2" />
          <span>
            Atribuído para:{" "}
            <span className="font-medium">{demanda.atribuidoParaNome}</span>
          </span>
        </div>

        <div className="flex items-center text-gray-500">
          <Calendar size={16} className="mr-2" />
          <span>
            {formatDate(demanda.dataInicio)} a {formatDate(demanda.dataFim)}
          </span>
        </div>

        <div className="flex items-center text-gray-500">
          <Clock size={16} className="mr-2" />
          <span>
            Criado em: {formatDate(demanda.criadaEm)} por{" "}
            {demanda.criadoPorNome}
          </span>
        </div>
      </div>

      {showActions && onStatusChange && demanda.status !== "concluida" && (
        <div className="mt-4 text-right">
          {demanda.status === "pendente" && (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(demanda.id, "em_andamento");
              }}>
              Iniciar
            </button>
          )}
          {demanda.status === "em_andamento" && (
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(demanda.id, "concluida");
              }}>
              Concluir
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DemandaCard;
