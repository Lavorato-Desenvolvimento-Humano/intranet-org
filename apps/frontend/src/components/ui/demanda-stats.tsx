// src/components/ui/demanda-stats.tsx
import React from "react";
import {
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  BarChart2,
} from "lucide-react";
import { DemandaStats } from "@/types/demanda";

interface DemandaStatsCardProps {
  stats: DemandaStats;
  className?: string;
  loading?: boolean;
}

const DemandaStatsCards: React.FC<DemandaStatsCardProps> = ({
  stats,
  className = "",
  loading = false,
}) => {
  // Dados para os cartões
  const statCards = [
    {
      title: "Total de Demandas",
      value: stats.totalDemandas,
      icon: BarChart2,
      color: "bg-blue-500",
      textColor: "text-blue-500",
    },
    {
      title: "Pendentes",
      value: stats.pendentes,
      icon: Circle,
      color: "bg-yellow-500",
      textColor: "text-yellow-500",
    },
    {
      title: "Em Andamento",
      value: stats.emAndamento,
      icon: Clock,
      color: "bg-purple-500",
      textColor: "text-purple-500",
    },
    {
      title: "Concluídas",
      value: stats.concluidas,
      icon: CheckCircle2,
      color: "bg-green-500",
      textColor: "text-green-500",
    },
    {
      title: "Atrasadas",
      value: stats.atrasadas,
      icon: AlertCircle,
      color: "bg-red-500",
      textColor: "text-red-500",
    },
  ];

  if (loading) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-lg shadow-md animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-200 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
      {statCards.map((card, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center mb-3">
            <div className={`p-2 rounded-full ${card.color}`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="ml-3 text-sm font-medium text-gray-700">
              {card.title}
            </h3>
          </div>
          <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};
