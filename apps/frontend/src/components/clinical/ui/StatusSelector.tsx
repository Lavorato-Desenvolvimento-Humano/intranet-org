// src/components/clinical/ui/StatusSelector.tsx
import React, { useState, useEffect } from "react";
import { ChevronDown, Settings, AlertCircle } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { statusService } from "@/services/clinical";
import { StatusDto } from "@/types/clinical";

interface StatusSelectorProps {
  value?: string;
  onChange: (status: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  includeInactive?: boolean;
  className?: string;
  required?: boolean;
  label?: string;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  value,
  onChange,
  placeholder = "Selecione um status",
  disabled = false,
  error,
  includeInactive = false,
  className = "",
  required = false,
  label,
}) => {
  // Estados
  const [statuses, setStatuses] = useState<StatusDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Carregar status na inicialização
  useEffect(() => {
    loadStatuses();
  }, [includeInactive]);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const statusesData = includeInactive
        ? await statusService.getAllStatuses()
        : await statusService.getAllStatusesAtivos();

      // Ordenar por ordem de exibição
      const sortedStatuses = statusesData.sort((a, b) => {
        if (a.ordemExibicao && b.ordemExibicao) {
          return a.ordemExibicao - b.ordemExibicao;
        }
        if (a.ordemExibicao && !b.ordemExibicao) return -1;
        if (!a.ordemExibicao && b.ordemExibicao) return 1;
        return a.status.localeCompare(b.status);
      });

      setStatuses(sortedStatuses);
    } catch (err) {
      console.error("Erro ao carregar status:", err);
      setLoadError("Erro ao carregar opções de status");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusSelect = (statusName: string) => {
    onChange(statusName);
    setIsOpen(false);
  };

  const selectedStatus = statuses.find((s) => s.status === value);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Botão de seleção */}
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`
          relative w-full border rounded-md px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? "border-red-500" : "border-gray-300"}
          ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white cursor-pointer hover:border-gray-400"}
          ${loading ? "cursor-wait" : ""}
        `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {loading ? (
              <span className="text-gray-500">Carregando...</span>
            ) : selectedStatus ? (
              <StatusBadge status={selectedStatus.status} size="sm" />
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loadError ? (
            <div className="p-4 text-center">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600">{loadError}</p>
              <button
                onClick={loadStatuses}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800">
                Tentar novamente
              </button>
            </div>
          ) : statuses.length === 0 ? (
            <div className="p-4 text-center">
              <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhum status disponível</p>
            </div>
          ) : (
            <div className="py-1">
              {statuses.map((status) => (
                <button
                  key={status.id}
                  type="button"
                  onClick={() => handleStatusSelect(status.status)}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between
                    ${value === status.status ? "bg-blue-50 text-blue-700" : "text-gray-900"}
                  `}>
                  <div className="flex items-center">
                    <StatusBadge status={status.status} size="sm" />
                  </div>

                  <div className="flex items-center space-x-2">
                    {status.ordemExibicao && (
                      <span className="text-xs text-gray-400">
                        #{status.ordemExibicao}
                      </span>
                    )}
                    {!status.ativo && (
                      <span className="text-xs text-red-500">Inativo</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overlay para fechar dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-5" onClick={() => setIsOpen(false)} />
      )}

      {/* Mensagem de erro */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}

      {/* Descrição do status selecionado */}
      {selectedStatus?.descricao && (
        <p className="mt-1 text-xs text-gray-500">{selectedStatus.descricao}</p>
      )}
    </div>
  );
};
