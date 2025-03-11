// providers/ToastProvider.tsx
"use client";

import { Toaster } from "react-hot-toast";
import { ReactNode } from "react";

interface ToastProviderProps {
  children: ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          // Estilos padrão para todos os toasts
          style: {
            background: "#fff",
            color: "#363636",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
            padding: "16px",
          },
          // Configurações para cada tipo de toast
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4caf50",
              secondary: "#fff",
            },
            style: {
              border: "1px solid #4caf50",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#f44336",
              secondary: "#fff",
            },
            style: {
              border: "1px solid #f44336",
            },
          },
          loading: {
            iconTheme: {
              primary: "#3498db",
              secondary: "#fff",
            },
            style: {
              border: "1px solid #3498db",
            },
          },
        }}
      />
    </>
  );
}
