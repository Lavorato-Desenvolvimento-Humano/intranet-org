// apps/frontend/src/app/auth/github-callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { githubLogin } from "@/services/auth";
import toastUtil from "@/utils/toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function GitHubCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Extrair o código da URL usando window.location
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");

    if (!authCode) {
      setError("Código de autorização não encontrado");
      setProcessing(false);
      return;
    }

    const handleGitHubLogin = async () => {
      const loadingToastId = toastUtil.loading("Autenticando com GitHub...");

      try {
        await githubLogin(authCode);
        toastUtil.dismiss(loadingToastId);
        toastUtil.success("Autenticação realizada com sucesso!");
        window.location.href = "/";
      } catch (err: any) {
        console.error("Erro na autenticação com GitHub:", err);
        toastUtil.dismiss(loadingToastId);

        // Capturar erro específico de usuário não autorizado
        if (err.message && err.message.includes("não autorizado")) {
          setError(
            "Acesso restrito: Apenas os usuários GitHub 'ViniciusG03' e 'JooWilliams' podem entrar por este método."
          );
        } else if (err.response && err.response.data) {
          setError(
            err.response.data.message || "Erro na autenticação com GitHub"
          );
        } else {
          setError("Erro na autenticação com GitHub. Tente novamente.");
        }

        setProcessing(false);
      }
    };

    handleGitHubLogin();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          Autenticação com GitHub
        </h1>

        {processing ? (
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto"></div>
            </div>
            <p className="text-gray-600">
              Processando sua autenticação com GitHub...
            </p>
          </div>
        ) : error ? (
          <div className="text-center">
            <Alert variant="error" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertTitle>Erro de Autenticação</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <p className="text-gray-600 mb-4">
              Desculpe, não foi possível completar a autenticação.
            </p>

            <Link
              href="/auth/login"
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors">
              Voltar para o Login
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
