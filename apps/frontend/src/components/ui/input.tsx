import React from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  label?: string;
  error?: string;
  onIconClick?: () => void;
}

export default function Input({
  icon: Icon, // Renomeie para Icon (com I maiúsculo) para usar como componente
  label,
  error,
  className = "",
  onIconClick,
  ...props
}: InputProps) {
  return (
    <div className="w-full max-w-md mb-4">
      {label && (
        <label className="block tex text-sm font-medium mb-2">{label}</label>
      )}

      <div className="relative flex items-center">
        <input
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent
          ${error ? "border-red-500" : "border-neutral-light"}
          ${Icon ? "pr-12" : ""} ${className}`}
          {...props}
        />

        {/* Renderização do ícone da biblioteca Lucide */}
        {Icon && (
          <div
            className={`absolute right-3 -top-2.5 flex items-center justify-center h-full pointer-events-none
                      ${onIconClick ? "cursor-pointer hover:text-primary transition-colors pointer-events-auto" : ""}`}
            onClick={onIconClick}>
            <Icon size={20} className="text-white" />
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
