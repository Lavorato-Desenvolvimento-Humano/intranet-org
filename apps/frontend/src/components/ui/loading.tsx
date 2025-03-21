// src/components/ui/loading.tsx
import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "small" | "medium" | "large";
  message?: string;
  fullPage?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = "medium",
  message = "Carregando...",
  fullPage = false,
}) => {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 36,
  };

  const iconSize = sizeMap[size];

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-50">
        <Loader2 size={iconSize} className="animate-spin text-primary mb-4" />
        {message && <p className="text-gray-600 text-lg">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 size={iconSize} className="animate-spin text-primary mb-2" />
      {message && <p className="text-gray-600">{message}</p>}
    </div>
  );
};

// Componente de loading para tabelas
export const TableLoading: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} className="py-8">
      <div className="flex flex-col items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary mb-2" />
        <p className="text-gray-600">Carregando dados...</p>
      </div>
    </td>
  </tr>
);

// Componente de loading para Cards
export const CardLoading: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
);

export default Loading;
