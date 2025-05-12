// src/components/workflow/TemplateCard.tsx
"use client";

import React from "react";
import { ChevronRight, Users, Eye, EyeOff, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { WorkflowTemplateDto } from "@/types/workflow";

interface TemplateCardProps {
  template: WorkflowTemplateDto;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  const router = useRouter();

  const getVisibilityIcon = () => {
    switch (template.visibility) {
      case "public":
        return <Eye size={16} className="text-green-500" />;
      case "restricted":
        return <EyeOff size={16} className="text-orange-500" />;
      case "team":
        return <Users size={16} className="text-blue-500" />;
      default:
        return null;
    }
  };

  const handleClick = () => {
    router.push(`/workflows/templates/${template.id}`);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{template.name}</h3>
        <div className="flex items-center">
          {getVisibilityIcon()}
          <span className="ml-1 text-xs text-gray-500 capitalize">
            {template.visibility}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {template.description || "Sem descrição"}
      </p>

      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center">
          <Briefcase size={16} className="text-gray-500 mr-1" />
          <span>{template.workflowCount} fluxos</span>
        </div>

        <div className="flex items-center text-gray-500">
          <span>{template.steps.length} etapas</span>
          <ChevronRight size={16} className="ml-1" />
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
