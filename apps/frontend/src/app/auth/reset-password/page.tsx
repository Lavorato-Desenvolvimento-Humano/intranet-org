// app/auth/reset-password/page.tsx
"use client";

import { useState } from "react";
import { useViewport } from "@/hooks/useViewport";
import {
  MobileResetPasswordLayout,
  DesktopResetPasswordLayout,
} from "@/components/layout/auth/reset-password/layouts";
import { useAuth } from "@/context/AuthContext";
import toastUtil from "@/utils/toast";

export default function ResetPasswordPage() {
  // Hook para verificar o tipo de viewport
  const viewport = useViewport();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { requestPasswordReset } = useAuth();

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toastUtil.error("Por favor, informe seu email");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderização condicional com base no tipo de dispositivo
  if (viewport === "mobile") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <MobileResetPasswordLayout
          onSubmit={handleSubmit}
          email={email}
          setEmail={setEmail}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  } else if (viewport === "tablet") {
    // Para tablets, podemos usar o layout desktop ou criar um específico
    // Por enquanto, usaremos o desktop com algumas adaptações
    return (
      <div className="min-h-screen">
        <DesktopResetPasswordLayout
          onSubmit={handleSubmit}
          email={email}
          setEmail={setEmail}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  } else {
    // Desktop
    return (
      <DesktopResetPasswordLayout
        onSubmit={handleSubmit}
        email={email}
        setEmail={setEmail}
        isSubmitting={isSubmitting}
      />
    );
  }
}
