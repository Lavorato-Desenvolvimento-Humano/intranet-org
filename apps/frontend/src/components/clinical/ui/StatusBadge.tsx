"use client";

import React from "react";
import { useStatus } from "@/hooks/useStatus";

interface StatusBadgeProps {
  status: string;
  showDescription?: boolean;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "default" | "outline" | "solid";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showDescription = false,
  className = "",
  size = "sm",
  variant = "default",
}) => {
  const { getStatusColor, getStatusDescription, loading } = useStatus();

  // Loading state
  if (loading) {
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500 animate-pulse ${className}`}>
        <div className="w-12 h-3 bg-gray-200 rounded"></div>
      </span>
    );
  }

  const statusColor = getStatusColor(status);
  const description = getStatusDescription(status);

  // Size classes
  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-xs",
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "outline":
        return {
          backgroundColor: "transparent",
          color: statusColor,
          border: `1px solid ${statusColor}`,
        };
      case "solid":
        return {
          backgroundColor: statusColor,
          color: "white",
          border: "none",
        };
      default: // 'default'
        return {
          backgroundColor: `${statusColor}20`,
          color: statusColor,
          border: `1px solid ${statusColor}40`,
        };
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center rounded-full font-medium transition-colors ${sizeClasses[size]} ${className}`}
        style={getVariantStyles()}
        title={description}>
        {status}
      </span>

      {/* Descrição opcional */}
      {showDescription && description !== status && (
        <span className="text-xs text-gray-500 max-w-32 truncate">
          {description}
        </span>
      )}
    </div>
  );
};
