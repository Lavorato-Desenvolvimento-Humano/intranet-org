// apps/frontend/src/app/drive/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
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

export default function DriveLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/drive";
  const message = searchParams.get("message");

  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
  }, [mounted, message]);

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
        `[Drive Login] Tentando login via: ${coreApiUrl}/api/auth/login`
      );

      // Fazer login através do Core Service (sistema principal)
      const loginResponse = await fetch(`${coreApiUrl}/api/auth/login`, {
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

      // Armazenar token e dados do usuário para o Drive
      localStorage.setItem("drive_token", token);
      localStorage.setItem("drive_user", JSON.stringify(user));

      // Também armazenar no localStorage padrão para compatibilidade
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toastUtil.success("Login realizado com sucesso!");

      // Aguardar um pouco antes do redirect para permitir que o toast seja exibido
      setTimeout(() => {
        router.push(redirectTo);
      }, 1000);
    } catch (error: any) {
      console.error("[Drive Login] Erro no login:", error);

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
          general: `Erro interno: ${errorMessage}. Tente novamente.`,
        });
      }

      toastUtil.error(formErrors.general || errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Lavorato Drive
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para acessar seus arquivos
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Erro geral */}
            {formErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">
                    {formErrors.general}
                  </span>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
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
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.email
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="seu@email.com"
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
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
                  className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.password
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}>
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

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </div>
          </form>

          {/* Links úteis */}
          <div className="mt-6 text-center space-y-2">
            <a
              href="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800">
              Esqueci minha senha
            </a>
            <div className="text-sm text-gray-600">
              Novo usuário?{" "}
              <a
                href="/auth/register"
                className="text-blue-600 hover:text-blue-800">
                Criar conta
              </a>
            </div>
          </div>
        </div>

        {/* Debug Info (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === "development" && (
          <div className="bg-gray-100 p-4 rounded-lg text-xs text-gray-600">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>Core API URL: {getCoreApiUrl()}</p>
            <p>Environment: {process.env.NODE_ENV}</p>
            <p>Redirect To: {redirectTo}</p>
          </div>
        )}
      </div>
    </div>
  );
}
