// apps/frontend/src/app/auth/verify-email/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useViewport } from "@/hooks/useViewport";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toastUtil from "@/utils/toast";
import {
  MobileEmailVerificationLayout,
  DesktopEmailVerificationLayout,
} from "@/components/layout/auth/verify-email/layout";

// Componente que usa useSearchParams
function EmailVerificationContent() {
  const viewport = useViewport();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { verifyEmail, resendVerificationEmail } = useAuth();

  // Verificar se o email foi fornecido
  useEffect(() => {
    if (!email) {
      toastUtil.error("Email não fornecido. Volte para a página anterior.");
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    }
  }, [email]);

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length < 6) {
      toastUtil.error("Por favor, insira o código completo.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyEmail(email, code);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para reenviar o código
  const handleResendCode = async () => {
    if (!email) {
      toastUtil.error("Email não fornecido.");
      return;
    }

    try {
      await resendVerificationEmail(email);
      toastUtil.info("Se o email existir, um novo código será enviado.");
    } catch (error) {
      console.error("Erro ao reenviar código:", error);
    }
  };

  // Renderização condicional com base no tipo de dispositivo
  if (viewport === "mobile") {
    return (
      <MobileEmailVerificationLayout
        onSubmit={handleSubmit}
        code={code}
        setCode={setCode}
        isSubmitting={isSubmitting}
        email={email}
        onResendCode={handleResendCode}
      />
    );
  } else {
    return (
      <DesktopEmailVerificationLayout
        onSubmit={handleSubmit}
        code={code}
        setCode={setCode}
        isSubmitting={isSubmitting}
        email={email}
        onResendCode={handleResendCode}
      />
    );
  }
}

// Componente principal envolto com Suspense
export default function EmailVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Carregando...
        </div>
      }>
      <EmailVerificationContent />
    </Suspense>
  );
}
