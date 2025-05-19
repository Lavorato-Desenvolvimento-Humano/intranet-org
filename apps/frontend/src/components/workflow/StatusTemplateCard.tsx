// src/components/workflow/StatusTemplateCard.tsx
"use client";

import React from "react";
import { ChevronRight, Settings, Flag, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { WorkflowStatusTemplateDto } from "@/types/workflow";

interface StatusTemplateCardProps {
  template: WorkflowStatusTemplateDto;
}

const StatusTemplateCard: React.FC<StatusTemplateCardProps> = ({
  template,
}) => {
  const router = useRouter();

  // Verificar se template está definido
  if (!template || !template.id) {
    return null;
  }

  // Valores seguros com fallbacks
  const name = template.name || "Sem nome";
  const description = template.description || "Sem descrição";
  const statusCount = template.statusItems?.length || 0;
  const workflowCount = template.workflowCount || 0;

  // Encontrar o status inicial e final
  const initialStatus = template.statusItems?.find(
    (status) => status.isInitial
  );
  const finalStatus = template.statusItems?.find((status) => status.isFinal);

  const handleClick = () => {
    router.push(`/workflows/status-templates/${template.id}`);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{name}</h3>
        <div className="flex items-center">
          {template.isDefault && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
              Padrão
            </span>
          )}
          <Settings size={16} className="text-gray-500" />
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>

      {(initialStatus || finalStatus) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {initialStatus && (
            <div
              className="flex items-center text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: `${initialStatus.color}20`, // 20% de opacidade
                color: initialStatus.color,
                borderLeft: `3px solid ${initialStatus.color}`,
              }}>
              <Flag size={12} className="mr-1" /> {initialStatus.name}
            </div>
          )}
          {finalStatus && (
            <div
              className="flex items-center text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: `${finalStatus.color}20`, // 20% de opacidade
                color: finalStatus.color,
                borderLeft: `3px solid ${finalStatus.color}`,
              }}>
              <CheckCircle size={12} className="mr-1" /> {finalStatus.name}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {template.statusItems?.map((status) => (
          <div
            key={status.id}
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: status.color }}
            title={status.name}></div>
        ))}
      </div>

      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center text-gray-500">
          <span>{statusCount} status</span>
        </div>

        <div className="flex items-center text-gray-500">
          <span>{workflowCount} fluxos</span>
          <ChevronRight size={16} className="ml-1" />
        </div>
      </div>
    </div>
  );
};

export default StatusTemplateCard;
