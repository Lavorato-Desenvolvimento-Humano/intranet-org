// app/auth/reset-password/new-password/page.tsx
"use client";

import { useViewport } from "@/hooks/useViewport";
import {
  MobileNewPasswordLayout,
  DesktopNewPasswordLayout,
} from "@/components/layout/auth/reset-password/new-password/layout";
import { useState } from "react";

export default function NewPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
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
        <MobileNewPasswordLayout
          onSubmit={handleSubmit}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      </div>
    );
  } else if (viewport === "tablet") {
    // Para tablets, podemos usar o layout desktop ou criar um específico
    // Por enquanto, usaremos o desktop com algumas adaptações
    return (
      <div className="min-h-screen">
        <DesktopNewPasswordLayout
          onSubmit={handleSubmit}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      </div>
    );
  } else {
    // Desktop
    return (
      <DesktopNewPasswordLayout
        onSubmit={handleSubmit}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />
    );
  }
}
