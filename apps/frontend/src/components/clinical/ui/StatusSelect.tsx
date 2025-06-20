"use client";

import React from "react";
import { useStatusOptions } from "@/hooks/useStatusOptions";
import { StatusBadge } from "./StatusBadge";

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  showPreview?: boolean;
  disabled?: boolean;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  placeholder = "Selecione o status",
  required = false,
  className = "",
  showPreview = true,
  disabled = false,
}) => {
  const { options, loading } = useStatusOptions();

  if (loading) {
    return (
      <div
        className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Preview do status atual */}
      {showPreview && value && (
        <div>
          <StatusBadge status={value} size="sm" />
        </div>
      )}

      {/* Select */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} - {option.description}
          </option>
        ))}
      </select>
    </div>
  );
};
