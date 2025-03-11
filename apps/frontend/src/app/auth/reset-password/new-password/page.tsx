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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Hook para verificar o tipo de viewport
  const viewport = useViewport();

  // Função para lidar com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Lógica para enviar o código de recuperação
    console.log("Enviando nova senha");

    // Simulando o término do envio (você substituiria isso por seu código real)
    setTimeout(() => {
      setIsSubmitting(false);
    }, 2000);
  };

  // Propriedades compartilhadas para ambos os layouts
  const layoutProps = {
    onSubmit: handleSubmit,
    showPassword,
    setShowPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isSubmitting,
  };

  // Renderização condicional com base no tipo de dispositivo
  if (viewport === "mobile") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <MobileNewPasswordLayout {...layoutProps} />
      </div>
    );
  } else if (viewport === "tablet") {
    // Para tablets, podemos usar o layout desktop ou criar um específico
    // Por enquanto, usaremos o desktop com algumas adaptações
    return (
      <div className="min-h-screen">
        <DesktopNewPasswordLayout {...layoutProps} />
      </div>
    );
  } else {
    // Desktop
    return <DesktopNewPasswordLayout {...layoutProps} />;
  }
}
