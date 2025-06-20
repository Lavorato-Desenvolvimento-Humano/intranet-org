import { useMemo } from "react";
import { useStatus } from "./useStatus";

export const useStatusOptions = (filterActive = true) => {
  const { statuses, loading } = useStatus();

  const options = useMemo(() => {
    const filteredStatuses = filterActive
      ? statuses.filter((s) => s.ativo)
      : statuses;

    return filteredStatuses
      .sort((a, b) => a.ordem - b.ordem)
      .map((status) => ({
        value: status.status,
        label: status.status,
        description: status.descricao,
        color: status.cor,
        icon: status.icone,
      }));
  }, [statuses, filterActive]);

  return {
    options,
    loading,
    statuses,
  };
};
