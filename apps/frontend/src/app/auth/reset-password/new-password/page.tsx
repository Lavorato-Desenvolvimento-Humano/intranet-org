// app/auth/reset-password/new-password/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useViewport } from "@/hooks/useViewport";
import { useSearchParams } from "next/navigation";
import {
  MobileNewPasswordLayout,
  DesktopNewPasswordLayout,
} from "@/components/layout/auth/reset-password/new-password/layout";
import { useAuth } from "@/context/AuthContext";
import toastUtil from "@/utils/toast";

// Componente que usa useSearchParams
function NewPasswordContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const code = searchParams.get("code") || "";
  const { resetPassword } = useAuth();

  // Hook para verificar o tipo de viewport
  const viewport = useViewport();

  // Verificar se os parâmetros necessários foram fornecidos
  useEffect(() => {
    if (!email || !code) {
      toastUtil.error("Informações incompletas. Você será redirecionado.");
      setTimeout(() => {
        window.location.href = "/auth/reset-password";
      }, 2000);
    }
  }, [email, code]);

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (newPassword.length < 8) {
      toastUtil.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toastUtil.error("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        email,
        verificationCode: code,
        newPassword,
      });
    } finally {
      setIsSubmitting(false);
    }
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
  } else {
    return <DesktopNewPasswordLayout {...layoutProps} />;
  }
}

// Componente principal envolto com Suspense
export default function NewPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Carregando...
        </div>
      }>
      <NewPasswordContent />
    </Suspense>
  );
}
