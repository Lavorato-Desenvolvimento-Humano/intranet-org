// src/components/ui/demanda-audit.tsx
import React from "react";
import { DemandaAudit } from "@/types/demanda";
import { Clock, User } from "lucide-react";

interface DemandaAuditProps {
  audits: DemandaAudit[];
  loading?: boolean;
}

const DemandaAuditLog: React.FC<DemandaAuditProps> = ({
  audits,
  loading = false,
}) => {
  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Função para formatar nome do campo
  const formatFieldName = (fieldName: string) => {
    switch (fieldName) {
      case "titulo":
        return "Título";
      case "descricao":
        return "Descrição";
      case "status":
        return "Status";
      case "prioridade":
        return "Prioridade";
      case "dataInicio":
        return "Data de Início";
      case "dataFim":
        return "Data de Término";
      case "atribuidoParaId":
        return "Responsável";
      default:
        return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }
  };

  // Função para formatar valor de status
  const formatValue = (field: string, value: string) => {
    if (field === "status") {
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
    }

    if (field === "prioridade") {
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

    if (field === "dataInicio" || field === "dataFim") {
      try {
        return new Date(value).toLocaleDateString("pt-BR");
      } catch (e) {
        return value;
      }
    }

    return value;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-b pb-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="flex items-center mt-2">
              <div className="h-4 w-4 bg-gray-200 rounded-full mr-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!audits || audits.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        Nenhuma alteração registrada para esta demanda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {audits.map((audit) => (
        <div key={audit.id} className="border-b border-gray-200 pb-4">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <Clock size={16} className="mr-2" />
            <span>{formatDate(audit.timestamp)}</span>
          </div>

          <p className="text-gray-800">
            <span className="font-medium">{formatFieldName(audit.campo)}:</span>{" "}
            {audit.valorAntigo ? (
              <>
                <span className="line-through text-red-500 mr-2">
                  {formatValue(audit.campo, audit.valorAntigo)}
                </span>
                <span className="text-green-500">
                  {formatValue(audit.campo, audit.valorNovo)}
                </span>
              </>
            ) : (
              <span className="text-green-500">
                {formatValue(audit.campo, audit.valorNovo)}
              </span>
            )}
          </p>

          <div className="flex items-center text-xs text-gray-500 mt-1">
            <User size={14} className="mr-1" />
            <span>Por {audit.usuarioNome}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DemandaAuditLog;
