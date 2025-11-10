// apps/frontend/src/app/drive/login/page.tsx
"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import toastUtil from "@/utils/toast";
import { useDriveAuth } from "@/context/DriveAuthContext";
import toast from "react-hot-toast";

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// Componente que usa useSearchParams
function DriveLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/drive";
  const message = searchParams.get("message");

  const { loginWithToken, isAuthenticated } = useDriveAuth();

  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasRedirected = useRef(false);
  const isRedirecting = useRef(false);

  useEffect(() => {
    setMounted(true);

    // Processar mensagens da URL
    if (message) {
      if (message === "session_expired") {
        toastUtil.warning("Sua sessão expirou. Faça login novamente.");
      } else if (message === "access_denied") {
        toastUtil.error("Acesso negado. Verifique suas credenciais.");
      } else if (message === "unauthorized") {
        toastUtil.warning("Você precisa fazer login para acessar esta página.");
      }
    }
  }, [message]);

  useEffect(() => {
    // Se já está redirecionando, não fazer nada
    if (isRedirecting.current) {
      return;
    }

    // Se autenticado, montado e ainda não redirecionou
    if (isAuthenticated && mounted && !hasRedirected.current) {
      console.log("[Drive Login] Usuário já autenticado, redirecionando...");

      // Marcar as flags IMEDIATAMENTE para evitar múltiplas execuções
      hasRedirected.current = true;
      isRedirecting.current = true;

      // Redirecionar após um pequeno delay para garantir estabilidade do estado
      const timeoutId = setTimeout(() => {
        router.push(redirectTo);
      }, 100);

      // Cleanup para cancelar o timeout se o componente desmontar
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, mounted, redirectTo, router]);

  /**
   * Obter URL do Core API baseada no ambiente
   */
  const getCoreApiUrl = (): string => {
    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment) {
      return "http://localhost:8443";
    }

    // Em produção, usar dev.lavorato.app.br (Core System)
    return "https://dev.lavorato.app.br";
  };

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
      const coreApiUrl = getCoreApiUrl();

      console.log(
        `[Drive Login] Tentando login via: ${coreApiUrl}/api/api/auth/login`
      );

      const loginResponse = await fetch(`${coreApiUrl}/api/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        ...(process.env.NODE_ENV === "development" && {
          mode: "cors",
        }),
      });

      console.log(`[Drive Login] Response status: ${loginResponse.status}`);

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({
          message: `Erro HTTP ${loginResponse.status}`,
        }));

        console.error("[Drive Login] Erro na resposta:", errorData);
        throw new Error(errorData.message || "Credenciais inválidas");
      }

      const loginData = await loginResponse.json();
      const { token, user } = loginData;

      if (!token) {
        throw new Error("Token não recebido do servidor");
      }

      console.log("[Drive Login] Login realizado com sucesso");

      await loginWithToken(token);

      toastUtil.success("Login realizado com sucesso!");

      console.log(
        "[Drive Login] Aguardando atualização do contexto para redirecionar..."
      );
    } catch (error: any) {
      console.error("[Drive Login] Erro no login:", error);
      setIsLoading(false);

      const errorMessage = error.message || "Erro ao fazer login";

      if (
        errorMessage.includes("credenciais") ||
        errorMessage.includes("inválid") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("unauthorized")
      ) {
        setFormErrors({ general: "Email ou senha incorretos" });
      } else if (
        errorMessage.includes("não verificado") ||
        errorMessage.includes("Email não verificado")
      ) {
        setFormErrors({
          general:
            "Email não verificado. Verifique sua caixa de entrada antes de fazer login.",
        });
      } else if (errorMessage.includes("fetch")) {
        setFormErrors({
          general: "Erro de conexão. Verifique sua internet e tente novamente.",
        });
      } else {
        setFormErrors({
          general: `Erro interno: ${errorMessage}. Entre em contato com o suporte.`,
        });
      }

      toastUtil.error(errorMessage);
    }
  };

  // Se o usuário já está autenticado, mostrar mensagem de carregamento
  if (isAuthenticated && mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Drive - Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Entre com suas credenciais do sistema
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Geral */}
          {formErrors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{formErrors.general}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`appearance-none relative block w-full pl-10 pr-3 py-2 border ${
                    formErrors.email ? "border-red-300" : "border-gray-300"
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Email"
                  disabled={isLoading}
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`appearance-none relative block w-full pl-10 pr-10 py-2 border ${
                    formErrors.password ? "border-red-300" : "border-gray-300"
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Senha"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}>
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.password}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-sm">
          <p className="text-gray-600">
            Não tem acesso ao Drive?{" "}
            <a
              href="/"
              className="font-medium text-blue-600 hover:text-blue-500">
              Voltar ao sistema principal
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente principal com Suspense
export default function DriveLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      }>
      <DriveLoginContent />
    </Suspense>
  );
}
