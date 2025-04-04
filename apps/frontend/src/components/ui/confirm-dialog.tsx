// src/components/ui/confirm-dialog.tsx
import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info" | "success";
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  variant = "danger",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  // Define estilos baseados na variante
  const headerStyles = {
    danger: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-blue-500 text-white",
    success: "bg-green-500 text-white",
  };

  const confirmButtonStyles = {
    danger: "bg-red-500 hover:bg-red-600 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
    info: "bg-blue-500 hover:bg-blue-600 text-white",
    success: "bg-green-500 hover:bg-green-600 text-white",
  };

  const iconMap = {
    danger: <AlertTriangle className="h-6 w-6 text-white" />,
    warning: <AlertTriangle className="h-6 w-6 text-white" />,
    info: <AlertTriangle className="h-6 w-6 text-white" />,
    success: <AlertTriangle className="h-6 w-6 text-white" />,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div
          className={`p-4 rounded-t-lg flex items-center ${headerStyles[variant]}`}>
          {iconMap[variant]}
          <h3 className="text-lg font-bold ml-2">{title}</h3>
          <button
            onClick={onCancel}
            className="ml-auto text-white hover:text-gray-200"
            disabled={isLoading}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">{message}</p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              disabled={isLoading}>
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-md ${confirmButtonStyles[variant]}`}
              disabled={isLoading}>
              {isLoading ? "Processando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
