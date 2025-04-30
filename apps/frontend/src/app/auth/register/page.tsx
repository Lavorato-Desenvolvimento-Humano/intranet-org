// apps/frontend/src/app/auth/register/page.tsx
"use client";
import Header from "@/components/layout/header";
import { useState, useEffect } from "react";
import { useViewport } from "@/hooks/useViewport";
import {
  MobileRegisterLayout,
  DesktopRegisterLayout,
} from "@/components/layout/auth/register/layout";
import { useAuth } from "@/context/AuthContext";
import toastUtil from "@/utils/toast";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const viewport = useViewport();
  const isMobile = viewport === "mobile";
  const { register } = useAuth();

  useEffect(() => {
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Por favor, insira um email válido");
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação adicional antes do envio
    if (emailError) {
      toastUtil.error(emailError);
      return;
    }

    if (password !== confirmPassword) {
      toastUtil.error("As senhas não coincidem");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ fullName, email, password, confirmPassword });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Passar emailError para os componentes de layout
  const layoutProps = {
    showPassword,
    setShowPassword,
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    handleSubmit,
    isSubmitting,
    emailError,
  };

  return (
    <div className="min-h-screen flex flex-col bg-primary-light">
      {/* Header só aparece no modo mobile */}
      {isMobile && <Header />}

      {/* Estrutura principal - tela cheia no desktop, centralizado no mobile */}
      {isMobile ? (
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <MobileRegisterLayout {...layoutProps} />
        </main>
      ) : (
        <DesktopRegisterLayout {...layoutProps} />
      )}
    </div>
  );
}
