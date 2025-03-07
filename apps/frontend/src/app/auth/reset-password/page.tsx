// app/auth/reset-password/page.tsx
"use client";

import { useViewport } from "@/hooks/useViewport";
import {
  MobileResetPasswordLayout,
  DesktopResetPasswordLayout,
} from "@/components/layout/auth/reset-password/layouts";

export default function ResetPasswordPage() {
  // Hook para verificar o tipo de viewport
  const viewport = useViewport();

  // Função para lidar com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica para enviar o código de recuperação
    console.log("Enviar código de recuperação");
  };

  // Renderização condicional com base no tipo de dispositivo
  if (viewport === "mobile") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <MobileResetPasswordLayout onSubmit={handleSubmit} />
      </div>
    );
  } else if (viewport === "tablet") {
    // Para tablets, podemos usar o layout desktop ou criar um específico
    // Por enquanto, usaremos o desktop com algumas adaptações
    return (
      <div className="min-h-screen">
        <DesktopResetPasswordLayout onSubmit={handleSubmit} />
      </div>
    );
  } else {
    // Desktop
    return <DesktopResetPasswordLayout onSubmit={handleSubmit} />;
  }
}
