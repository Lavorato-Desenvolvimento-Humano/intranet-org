// app/auth/github-callback/page.tsx
"use client";

import { useEffect } from "react";
import { githubLogin } from "@/services/auth";
import toastUtil from "@/utils/toast";

export default function GitHubCallbackPage() {
  useEffect(() => {
    // Extrair o código da URL usando window.location
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get("code");

    if (!authCode) {
      toastUtil.error("Código de autorização não encontrado");
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
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

        if (err.response && err.response.data) {
          toastUtil.error(
            err.response.data.message || "Erro na autenticação com GitHub"
          );
        } else {
          toastUtil.error("Erro na autenticação com GitHub. Tente novamente.");
        }

        // Adiciona um pequeno atraso antes de redirecionar
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 3000);
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

        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-gray-600">
            Processando sua autenticação com GitHub...
          </p>
        </div>
      </div>
    </div>
  );
}
