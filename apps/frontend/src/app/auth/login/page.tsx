"use client";
import Header from "@/components/layout/header";
import { useState, useEffect, Suspense } from "react";
import { useViewport } from "@/hooks/useViewport";
import {
  MobileLoginLayout,
  DesktopLoginLayout,
} from "@/components/layout/auth/login/layout";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import toastUtil from "@/utils/toast";

// Componente que usa useSearchParams
function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const viewport = useViewport();
  const isMobile = viewport === "mobile";
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  // Mostrar toast de sucesso se o usuário acabou de redefinir a senha
  useEffect(() => {
    if (resetSuccess) {
      toastUtil.success(
        "Senha redefinida com sucesso! Faça login com sua nova senha."
      );
    }
  }, [resetSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ email, password });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função vazia para satisfazer a propriedade onInputChange
  const onInputChange = () => {};

  return (
    <div className="min-h-screen flex flex-col bg-primary-light">
      {/* Header só aparece no modo mobile */}
      {isMobile && <Header />}

      {/* Estrutura principal - tela cheia no desktop, centralizado no mobile */}
      {isMobile ? (
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <MobileLoginLayout
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onInputChange={onInputChange}
          />
        </main>
      ) : (
        <DesktopLoginLayout
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onInputChange={onInputChange}
        />
      )}
    </div>
  );
}

// Componente principal envolto com Suspense
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Carregando...
        </div>
      }>
      <LoginContent />
    </Suspense>
  );
}
