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
import api from "@/services/api";

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

  // Função para tentar login direto, mas mantida dentro do componente
  async function tentarLoginDireto() {
    try {
      console.log("Tentando login direto com:", email);
      const response = await api.post("/auth/direta/login", {
        email,
        password,
      });

      // Processar resposta
      const userData = response.data;
      localStorage.setItem("token", userData.token);

      const user = {
        id: userData.id,
        fullName: userData.fullName,
        email: userData.email,
        profileImage: userData.profileImage || undefined,
        roles: userData.roles,
        token: userData.token,
      };

      localStorage.setItem("user", JSON.stringify(user));

      toastUtil.success("Login realizado com sucesso!");
      window.location.href = "/";
      return true;
    } catch (error: any) {
      console.error("Erro no login direto:", error);
      if (error.response && error.response.data) {
        toastUtil.error(error.response.data.message || "Erro ao fazer login");
      } else {
        toastUtil.error("Erro ao fazer login. Servidor indisponível.");
      }
      return false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Tenta o método de login normal primeiro
      await login({ email, password });
    } catch (error) {
      console.log("Login normal falhou, tentando método alternativo...");

      // Se falhar, tenta o método alternativo
      await tentarLoginDireto();
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
