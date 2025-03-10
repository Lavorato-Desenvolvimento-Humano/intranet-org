// app/auth/reset-password/code/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useViewport } from "@/hooks/useViewport";
import { useSearchParams } from "next/navigation";
import {
  MobileResetPasswordCodeLayout,
  DesktopResetPasswordCodeLayout,
} from "@/components/layout/auth/reset-password/code/layouts";
import { useAuth } from "@/context/AuthContext";
import toastUtil from "@/utils/toast";

export default function ResetPasswordCodePage() {
  // Hook para verificar o tipo de viewport
  const viewport = useViewport();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { verifyResetCode } = useAuth();

  // Verificar se o email foi fornecido
  useEffect(() => {
    if (!email) {
      toastUtil.error("Email não fornecido. Volte para a página anterior.");
      setTimeout(() => {
        window.location.href = "/auth/reset-password";
      }, 2000);
    }
  }, [email]);

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length < 4) {
      toastUtil.error("Por favor, insira o código completo.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyResetCode(email, code);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para lidar com a mudança do código
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  // Renderização condicional com base no tipo de dispositivo
  if (viewport === "mobile") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <MobileResetPasswordCodeLayout
          onSubmit={handleSubmit}
          code={code}
          setCode={handleCodeChange}
          isSubmitting={isSubmitting}
          email={email}
        />
      </div>
    );
  } else if (viewport === "tablet") {
    // Para tablets, podemos usar o layout desktop
    return (
      <div className="min-h-screen">
        <DesktopResetPasswordCodeLayout
          onSubmit={handleSubmit}
          code={code}
          setCode={handleCodeChange}
          isSubmitting={isSubmitting}
          email={email}
        />
      </div>
    );
  } else {
    // Desktop
    return (
      <DesktopResetPasswordCodeLayout
        onSubmit={handleSubmit}
        code={code}
        setCode={handleCodeChange}
        isSubmitting={isSubmitting}
        email={email}
      />
    );
  }
}
