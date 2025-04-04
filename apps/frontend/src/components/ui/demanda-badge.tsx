// src/components/ui/demanda-badge.tsx
import React from "react";
import {
  DemandaStatus,
  DemandaPrioridade,
  PRIORIDADE_COLORS,
  STATUS_COLORS,
} from "@/types/demanda";

interface DemandaBadgeProps {
  type: "status" | "prioridade";
  value: DemandaStatus | DemandaPrioridade;
  className?: string;
}

const DemandaBadge: React.FC<DemandaBadgeProps> = ({
  type,
  value,
  className = "",
}) => {
  // Função para obter a cor de fundo baseada no tipo e valor
  const getBackgroundColor = () => {
    if (type === "status") {
      return STATUS_COLORS[value as DemandaStatus];
    } else {
      return PRIORIDADE_COLORS[value as DemandaPrioridade];
    }
  };

  // Função para formatar o texto para exibição
  const formatDisplayText = () => {
    if (type === "status") {
      switch (value) {
        case "pendente":
          return "Pendente";
        case "em_andamento":
          return "Em Andamento";
        case "concluida":
          return "Concluída";
        default:
          return value;
      }
    } else {
      switch (value) {
        case "baixa":
          return "Baixa";
        case "media":
          return "Média";
        case "alta":
          return "Alta";
        default:
          return value;
      }
    }
  };

  // Estilos baseados no tipo
  const backgroundColor = getBackgroundColor();
  const displayText = formatDisplayText();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor,
        color: "#ffffff",
      }}>
      {displayText}
    </span>
  );
};

export default DemandaBadge;
