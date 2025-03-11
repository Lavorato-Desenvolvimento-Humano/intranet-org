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

// Função para tentar login direto (sem usar o contexto de autenticação)
async function tentarLoginDireto(email: any, password: any) {
  try {
    console.log("Tentando login diretamente no endpoint alternativo");
    const response = await api.post("/auth/direta/login", { email, password });
    console.log("Resposta do login direto:", response.data);

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

// Componente que usa useSearchParams
function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modoLogin, setModoLogin] = useState("normal"); // normal ou direto
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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Primeiro tenta o login normal
      if (modoLogin === "normal") {
        try {
          await login({ email, password });
        } catch (error) {
          console.log(
            "Falha no login normal, tentando login direto como fallback"
          );
          // Se falhar, tenta o login direto como fallback
          const diretoBemSucedido = await tentarLoginDireto(email, password);
          if (!diretoBemSucedido) {
            throw error; // Propaga o erro se ambos falharem
          }
        }
      } else {
        // Se o modo estiver configurado para direto, tenta apenas o login direto
        await tentarLoginDireto(email, password);
      }
    } catch (error) {
      console.error("Todos os métodos de login falharam:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alterna entre os modos de login
  const toggleModoLogin = () => {
    const novoModo = modoLogin === "normal" ? "direto" : "normal";
    setModoLogin(novoModo);
    toastUtil.info(`Modo de login alterado para: ${novoModo}`);
  };

  // Função vazia para satisfazer a propriedade onInputChange
  const onInputChange = () => {};

  // Props compartilhadas para ambos os layouts
  const layoutProps = {
    showPassword,
    setShowPassword,
    email,
    setEmail,
    password,
    setPassword,
    handleSubmit,
    isSubmitting,
    onInputChange,
    modoLogin,
    toggleModoLogin,
  };

  return (
    <div className="min-h-screen flex flex-col bg-primary-light">
      {/* Header só aparece no modo mobile */}
      {isMobile && <Header />}

      {/* Estrutura principal - tela cheia no desktop, centralizado no mobile */}
      {isMobile ? (
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <MobileLoginLayout {...layoutProps} />
        </main>
      ) : (
        <DesktopLoginLayout {...layoutProps} />
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
