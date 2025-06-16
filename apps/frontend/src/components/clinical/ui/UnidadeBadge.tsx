"use client";

import React from "react";
import { Baby, Users } from "lucide-react";
import { UnidadeEnum } from "@/types/clinical";

interface UnidadeBadgeProps {
  unidade: UnidadeEnum;
  className?: string;
}

export const UnidadeBadge: React.FC<UnidadeBadgeProps> = ({
  unidade,
  className = "",
}) => {
  const isKids = unidade === UnidadeEnum.KIDS;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isKids
          ? "bg-pink-100 text-pink-800 border border-pink-200"
          : "bg-blue-100 text-blue-800 border border-blue-200"
      } ${className}`}>
      {isKids ? (
        <Baby className="mr-1 h-3 w-3" />
      ) : (
        <Users className="mr-1 h-3 w-3" />
      )}
      {unidade}
    </span>
  );
};
