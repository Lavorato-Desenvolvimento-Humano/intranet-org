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
      // O redirecionamento é feito dentro de login
    } catch (error) {
      console.error("Falha ao fazer login:", error);
      // Tratamento de erro já é feito dentro de login
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

      {/* Botão de debug - apenas para desenvolvimento */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={toggleDebugger}
          className="bg-gray-800 text-white px-3 py-1 text-xs rounded-md opacity-50 hover:opacity-100">
          {showDebugger ? "Ocultar Debug" : "Debug"}
        </button>
      </div>

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
          />

          {/* Ferramenta de debug no desktop */}
          {showDebugger && (
            <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-auto">
              <LoginDebugger />
            </div>
          )}
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
