import { useState, useEffect } from "react";
import { statusService } from "@/services/clinical";
import { StatusDto } from "@/types/clinical";

export const useStatus = () => {
  const [statuses, setStatuses] = useState<StatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar o service existente
      const data = await statusService.getAllStatusesAtivos();
      setStatuses(data);
    } catch (err) {
      console.error("Erro ao carregar status:", err);
      setError("Erro ao carregar status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    // Buscar cor do backend primeiro
    const statusData = statuses.find((s) => s.status === status.toUpperCase());

    if (statusData?.cor) {
      return statusData.cor;
    }

    // Fallback para cores padrão se não tiver no backend
    return getDefaultStatusColor(status);
  };

  const getStatusDescription = (status: string): string => {
    const statusData = statuses.find((s) => s.status === status.toUpperCase());
    return statusData?.descricao || status;
  };

  const getDefaultStatusColor = (status: string): string => {
    const upperStatus = status.toUpperCase();

    // 🟢 Status positivos/concluídos
    if (
      ["ASSINADO", "FATURADO", "APROVADO", "CONCLUIDO"].includes(upperStatus)
    ) {
      return "#10b981"; // Verde
    }

    // 🔴 Status negativos/problemas
    if (
      ["CANCELADO", "REJEITADO", "PERDIDA", "VENCIDO"].includes(upperStatus)
    ) {
      return "#ef4444"; // Vermelho
    }

    // 🟡 Status de processo/espera
    if (["PENDENTE", "ANALISE", "EM_ANALISE", "SUBIU"].includes(upperStatus)) {
      return "#f59e0b"; // Amarelo
    }

    // 🔵 Status iniciais/informativos
    if (["EMITIDO", "ENVIADO A BM", "ATIVO"].includes(upperStatus)) {
      return "#3b82f6"; // Azul
    }

    // 🟠 Status de retorno/revisão
    if (["RETORNOU", "DEVOLVIDO BM"].includes(upperStatus)) {
      return "#f97316"; // Laranja
    }

    return "#6b7280"; // Cinza padrão
  };

  return {
    statuses,
    loading,
    error,
    getStatusColor,
    getStatusDescription,
    refreshStatuses: loadStatuses,
  };
};
