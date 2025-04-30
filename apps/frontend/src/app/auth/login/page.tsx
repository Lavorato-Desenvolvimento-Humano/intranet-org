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
import LoginDebugger from "@/components/LoginDebugger";

// Componente que usa useSearchParams
function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const viewport = useViewport();
  const isMobile = viewport === "mobile";
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const [customError, setCustomError] = useState<string | null>(null);

  // Mostrar toast de sucesso se o usuário acabou de redefinir a senha
  useEffect(() => {
    if (resetSuccess) {
      toastUtil.success(
        "Senha redefinida com sucesso! Faça login com sua nova senha."
      );
    }

    const emailVerified = searchParams.get("verified") === "true";
    if (emailVerified) {
      toastUtil.success(
        "Email verificado com sucesso! Agora você pode fazer login."
      );
    }
  }, [resetSuccess, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCustomError(null);

    try {
      await login({ email, password });
      // O redirecionamento é feito dentro de login
    } catch (error: any) {
      console.error("Falha ao fazer login:", error);
      if (error.response?.data?.message?.includes("aguardando aprovação"))
        setCustomError(
          "Sua conta ainda está aguardando aprovação do administrador. Você receberá um email quando sua for aprovada."
        );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInputChange = () => {};

  // Toggle para a ferramenta de debug - apenas para desenvolvimento
  const toggleDebugger = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDebugger(!showDebugger);
  };

  return (
    <div className="min-h-screen flex flex-col bg-primary-light">
      {/* Header só aparece no modo mobile */}
      {isMobile && <Header />}

      {/* Estrutura principal - tela cheia no desktop, centralizado no mobile */}
      {isMobile ? (
        <main className="flex-1 flex items-center justify-center px-4 py-8 flex-col">
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
            customError={customError ?? undefined}
          />

          {/* Ferramenta de debug no mobile */}
          {showDebugger && (
            <div className="mt-10 w-full max-w-md">
              <LoginDebugger />
            </div>
          )}
        </main>
      ) : (
        <div className="flex flex-col">
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
            customError={customError ?? undefined}
          />
        </div>
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
