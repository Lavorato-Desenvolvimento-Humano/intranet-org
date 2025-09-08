"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, HardDrive, Loader2, AlertCircle } from "lucide-react";
import { useDriveAuth } from "@/context/DriveAuthContext";
import { CustomButton } from "@/components/ui/custom-button";
import Input from "@/components/ui/input";
import toastUtil from "@/utils/toast";

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * Página de login específica para o Drive
 * Implementa RF01.1 - Integração com Sistema Existente
 */
export default function DriveLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useDriveAuth();

  // Estados do formulário
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Parâmetros de URL
  const redirectTo = searchParams.get("redirect") || "/drive";
  const message = searchParams.get("message");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirecionar se já está autenticado
  useEffect(() => {
    if (mounted && !authLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [mounted, authLoading, isAuthenticated, router, redirectTo]);

  // Exibir mensagem da URL se existir
  useEffect(() => {
    if (mounted && message) {
      if (message === "token_expired") {
        toastUtil.warning("Sua sessão expirou. Faça login novamente.");
      } else if (message === "access_denied") {
        toastUtil.error("Acesso negado. Verifique suas credenciais.");
      } else if (message === "unauthorized") {
        toastUtil.warning("Você precisa fazer login para acessar esta página.");
      }
    }
  }, [mounted, message]);

  /**
   * Valida os campos do formulário
   */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email inválido";
    }

    if (!formData.password) {
      errors.password = "Senha é obrigatória";
    } else if (formData.password.length < 6) {
      errors.password = "Senha deve ter pelo menos 6 caracteres";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Atualiza dados do formulário
   */
  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Submete o formulário de login
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setFormErrors({});

    try {
      // Fazer login no sistema principal (simulação)
      // Em um ambiente real, você faria uma chamada para a API de autenticação principal
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!loginResponse.ok) {
        throw new Error("Credenciais inválidas");
      }

      const { token } = await loginResponse.json();

      // Fazer login no contexto do Drive
      await login(token);

      toastUtil.success("Login realizado com sucesso!");
      router.push(redirectTo);
    } catch (error: any) {
      console.error("Erro no login:", error);

      const errorMessage = error.message || "Erro ao fazer login";

      if (
        errorMessage.includes("credenciais") ||
        errorMessage.includes("inválid")
      ) {
        setFormErrors({ general: "Email ou senha incorretos" });
      } else if (errorMessage.includes("permissão")) {
        setFormErrors({
          general: "Você não tem permissão para acessar o Drive",
        });
      } else {
        setFormErrors({ general: "Erro interno. Tente novamente." });
      }

      toastUtil.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Tenta login automático com token existente do sistema
   */
  const handleAutoLogin = async () => {
    setIsLoading(true);

    try {
      // Verificar se existe token do sistema principal
      const mainToken =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("jwt_token") ||
        localStorage.getItem("access_token");

      if (mainToken) {
        await login(mainToken);
        toastUtil.success("Login automático realizado!");
        router.push(redirectTo);
      } else {
        toastUtil.info("Nenhuma sessão ativa encontrada no sistema principal");
      }
    } catch (error: any) {
      console.error("Erro no login automático:", error);
      toastUtil.warning(
        "Não foi possível fazer login automático. Use suas credenciais."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  // Loading state durante verificação de autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Formulário de login */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Cabeçalho */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-600 rounded-lg p-3">
                <HardDrive className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Drive Intranet</h2>
            <p className="mt-2 text-gray-600">
              Acesse seus arquivos e documentos
            </p>
          </div>

          {/* Botão de login automático */}
          <div className="mt-8">
            <CustomButton
              onClick={handleAutoLogin}
              disabled={isLoading}
              variant="primary"
              className="w-full">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Usar sessão ativa do sistema
            </CustomButton>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  Ou faça login manual
                </span>
              </div>
            </div>
          </div>

          {/* Formulário de login */}
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            {/* Erro geral */}
            {formErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{formErrors.general}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Campo de email */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                error={formErrors.email}
                disabled={isLoading}
              />
            </div>

            {/* Campo de senha */}
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Senha"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  error={formErrors.password}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}>
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Botão de submissão */}
            <div>
              <CustomButton
                type="submit"
                disabled={isLoading}
                className="w-full">
                Entrar no Drive
              </CustomButton>
            </div>
          </form>

          {/* Links úteis */}
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Não tem acesso?{" "}
              <a href="/contact" className="text-blue-600 hover:text-blue-500">
                Entre em contato
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Lado direito - Imagem/ilustração */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative h-full flex items-center justify-center p-12">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Bem-vindo ao Drive</h2>
              <p className="text-xl opacity-90 mb-8">
                Gerencie seus arquivos com segurança e colabore com sua equipe
              </p>
              <div className="grid grid-cols-1 gap-4 text-left">
                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span>Upload e download seguros</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span>Controle de permissões granular</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span>Integração com sistema existente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
