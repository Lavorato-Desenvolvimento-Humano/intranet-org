"use client";

import React from "react";

interface StatusBadgeProps {
  status: string;
  color?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  color = "#6b7280",
  className = "",
}) => {
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      ATIVO: "#10b981",
      INATIVO: "#ef4444",
      PENDENTE: "#f59e0b",
      APROVADO: "#10b981",
      REJEITADO: "#ef4444",
      EM_ANALISE: "#3b82f6",
      CONCLUIDO: "#10b981",
      CANCELADO: "#ef4444",
      VENCIDO: "#dc2626",
      VIGENTE: "#059669",
    };
    return statusColors[status.toUpperCase()] || color;
  };

  const statusColor = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: `${statusColor}20`,
        color: statusColor,
        border: `1px solid ${statusColor}40`,
      }}>
      {status}
    </span>
  );
};
