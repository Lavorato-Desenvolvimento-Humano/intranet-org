import { useMemo } from "react";
import { useStatus } from "./useStatus";

export const useStatusOptions = (filterActive = true) => {
  const { statuses, loading } = useStatus();

  const options = useMemo(() => {
    const filteredStatuses = filterActive
      ? statuses.filter((s) => s.ativo)
      : statuses;

    return filteredStatuses
      .sort((a, b) => (a.ordemExibicao ?? 0) - (b.ordemExibicao ?? 0))
      .map((status) => ({
        value: status.status,
        label: status.status,
        description: status.descricao,
        color: status.cor,
      }));
  }, [statuses, filterActive]);

  return {
    options,
    loading,
    statuses,
  };
};
