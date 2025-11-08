"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import toastUtil from "@/utils/toast";
import { useDriveAuth } from "@/context/DriveAuthContext";

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
    if (isAuthenticated && mounted && !hasRedirected.current) {
      console.log("[Drive Login] Usuário já autenticado, redirecionando...");
      hasRedirected.current = true; // Marcar que já redirecionamos
      router.push(redirectTo);
    }
  }, [isAuthenticated, mounted, redirectTo, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated]);

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

      // Fazer login através do Core Service (sistema principal)
      const loginResponse = await fetch(`${coreApiUrl}/api/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        // Para HTTPS com certificados self-signed em dev
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
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acesse o Drive
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Faça login com suas credenciais
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {formErrors.general && (
            <div className="flex items-center p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>{formErrors.general}</span>
            </div>
          )}

          <div className="space-y-4">
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
                  className={`appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border ${
                    formErrors.email ? "border-red-300" : "border-gray-300"
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Email"
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

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
                  className={`appearance-none rounded-md relative block w-full pl-10 pr-10 py-3 border ${
                    formErrors.password ? "border-red-300" : "border-gray-300"
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="Senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
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

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : (
                "Entrar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente principal envolto com Suspense
export default function DriveLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
      <DriveLoginContent />
    </Suspense>
  );
}
