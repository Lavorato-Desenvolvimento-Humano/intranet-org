"use client";
import Header from "@/components/layout/header";
import Input from "@/components/ui/input";
import LoginButton from "@/components/ui/login-button";
import { LoginDivider } from "@/components/ui/login-button";
import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  LockKeyholeIcon,
  LockKeyholeOpenIcon,
  Github,
} from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-primary-light">
      <Header />

      {/* Container para centralizar horizontalmente*/}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-14 py-8 sm:py-16 md:py-24">
        <div className="w-full max-w-md mt-8">
          <h1 className="font-inter font-bold text-3xl sm:text-4xl text-white mb-8 sm:mb-12">
            ENTRE
          </h1>
          <Input
            icon={Mail}
            type="email"
            placeholder="E-mail"
            className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg"
          />

          <Input
            icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            onIconClick={() => setShowPassword(!showPassword)}
            className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg"
          />

          {/* Layout horizontal de botões com responsividade */}
          <div className="flex items-center justify-center mt-10">
            <LoginButton>ENTRAR</LoginButton>

            <LoginDivider text="ou" />

            <LoginButton
              variant="icon"
              icon={Github}
              aria-label="Entrar com GitHub"
            />
          </div>

          {/* Texto de registro com espaçamento em rem */}
          <div
            className="flex items-center justify-center"
            style={{ marginTop: "1.25rem" }}>
            <span
              className="font-inter font-normal text-white"
              style={{ fontSize: "0.75rem" }}>
              Não tem uma conta?
            </span>
            <span className="mx-1"></span>
            <Link
              href="/register"
              className="font-inter font-normal text-black underline hover:text-gray-200 transition-colors"
              style={{ fontSize: "0.75rem" }}>
              Registre-se aqui
            </Link>
          </div>

          <div
            className="flex items-center justify-center"
            style={{ marginTop: "0.75rem" }}>
            <Link
              href="/forgot-password"
              className="font-inter font-normal text-white underline hover:text-gray-200 transition-colors"
              style={{ fontSize: "0.75rem" }}>
              Esqueceu sua senha?
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
