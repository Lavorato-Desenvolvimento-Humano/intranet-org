"use client";

import React from "react";
import { FileText, FileSignature, Link, Unlink } from "lucide-react";
import { TipoFichaEnum } from "@/types/clinical";

interface TipoFichaBadgeProps {
  tipoFicha: TipoFichaEnum;
  temGuia?: boolean;
  className?: string;
  showIcon?: boolean;
}

export const TipoFichaBadge: React.FC<TipoFichaBadgeProps> = ({
  tipoFicha,
  temGuia = false,
  className = "",
  showIcon = true,
}) => {
  if (tipoFicha === TipoFichaEnum.COM_GUIA) {
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 ${className}`}
        title="Ficha criada com guia">
        {showIcon && <FileText className="mr-1 h-3 w-3" />}
        Com Guia
      </span>
    );
  }

  if (tipoFicha === TipoFichaEnum.ASSINATURA) {
    if (temGuia) {
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 ${className}`}
          title="Ficha de assinatura vinculada a uma guia">
          {showIcon && <Link className="mr-1 h-3 w-3" />}
          Assinatura Vinculada
        </span>
      );
    } else {
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 ${className}`}
          title="Ficha de assinatura não vinculada">
          {showIcon && <Unlink className="mr-1 h-3 w-3" />}
          Assinatura
        </span>
      );
    }
  }

  return null;
};
