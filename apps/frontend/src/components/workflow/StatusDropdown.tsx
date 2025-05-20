// src/components/workflow/StatusDropdown.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { WorkflowStatusItemDto } from "@/types/workflow";
import workflowService from "@/services/workflow";
import toastUtil from "@/utils/toast";

interface StatusDropdownProps {
  workflowId: string;
  statusTemplateId: string | null | undefined;
  currentStatusId: string | null | undefined;
  onStatusChange: (newStatusId: string) => void;
  disabled?: boolean;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  workflowId,
  statusTemplateId,
  currentStatusId,
  onStatusChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusItems, setStatusItems] = useState<WorkflowStatusItemDto[]>([]);
  const [currentStatus, setCurrentStatus] =
    useState<WorkflowStatusItemDto | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fechar o dropdown quando clicar fora dele
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Carregar os status disponíveis quando o template mudar ou componente montar
    const fetchStatusItems = async () => {
      if (!statusTemplateId) {
        setStatusItems([]);
        setCurrentStatus(null);
        return;
      }

      try {
        setIsLoading(true);
        const items = await workflowService.getStatusItems(statusTemplateId);
        setStatusItems(items);

        // Identificar o status atual
        if (currentStatusId) {
          const current = items.find((item) => item.id === currentStatusId);
          setCurrentStatus(current || null);
        } else {
          // Se não tiver status atual, pegar o status inicial
          const initialStatus = items.find((item) => item.isInitial);
          setCurrentStatus(initialStatus || null);
        }
      } catch (error) {
        console.error("Erro ao carregar status:", error);
        toastUtil.error("Não foi possível carregar os status disponíveis");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatusItems();
  }, [statusTemplateId, currentStatusId]);

  const handleStatusChange = async (status: WorkflowStatusItemDto) => {
    if (disabled || isLoading) return;

    try {
      setIsLoading(true);
      await workflowService.updateWorkflowCustomStatus(workflowId, status.id);
      setCurrentStatus(status);
      onStatusChange(status.id);
      toastUtil.success(`Status atualizado para ${status.name}`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toastUtil.error("Não foi possível atualizar o status");
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  // Se não tiver template de status, não renderizar o componente
  if (!statusTemplateId || statusItems.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={`flex items-center py-1 px-2 rounded-md text-sm border ${
          disabled ? "opacity-70 cursor-not-allowed" : "hover:bg-gray-50"
        }`}
        style={{
          backgroundColor: currentStatus ? `${currentStatus.color}20` : "white",
          borderColor: currentStatus ? currentStatus.color : "#e5e7eb",
          color: currentStatus ? currentStatus.color : "inherit",
        }}>
        <div
          className="w-2 h-2 rounded-full mr-1"
          style={{
            backgroundColor: currentStatus ? currentStatus.color : "#808080",
          }}></div>
        <span className="truncate max-w-[80px]">
          {currentStatus ? currentStatus.name : "Status"}
        </span>
        <ChevronDown size={12} className="ml-1" />
      </button>

      {isOpen && (
        <div className="absolute mt-1 z-50 bg-white rounded-md shadow-lg py-1 w-48 max-h-48 overflow-y-auto">
          {statusItems.map((status) => (
            <button
              key={status.id}
              type="button"
              className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center text-sm"
              style={{
                color: status.color,
              }}
              onClick={() => handleStatusChange(status)}>
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: status.color }}></div>
              <span className="truncate">{status.name}</span>
              {status.isInitial && (
                <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-1 rounded">
                  I
                </span>
              )}
              {status.isFinal && (
                <span className="ml-auto text-xs bg-green-100 text-green-800 px-1 rounded">
                  F
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusDropdown;
