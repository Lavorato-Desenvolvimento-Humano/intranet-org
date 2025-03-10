// app/auth/reset-password/code/page.tsx
"use client";

import { useViewport } from "@/hooks/useViewport";
import {
  MobileResetPasswordCodeLayout,
  DesktopResetPasswordCodeLayout,
} from "@/components/layout/auth/reset-password/code/layouts";

export default function ResetPasswordCodePage() {
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
        <MobileResetPasswordCodeLayout onSubmit={handleSubmit} />
      </div>
    );
  } else if (viewport === "tablet") {
    // Para tablets, podemos usar o layout desktop ou criar um específico
    // Por enquanto, usaremos o desktop com algumas adaptações
    return (
      <div className="min-h-screen">
        <DesktopResetPasswordCodeLayout onSubmit={handleSubmit} />
      </div>
    );
  } else {
    // Desktop
    return <DesktopResetPasswordCodeLayout onSubmit={handleSubmit} />;
  }
}
