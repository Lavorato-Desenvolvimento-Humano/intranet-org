// components/auth/login/layouts.tsx
import Input from "@/components/ui/input";
import LoginButton from "@/components/ui/login-button";
import { LoginDivider } from "@/components/ui/login-button";
import Link from "next/link";
import Image from "next/image";
import Logo from "../../../../../public/logo.svg";
import {
  Mail,
  LockKeyholeIcon,
  LockKeyholeOpenIcon,
  Github,
} from "lucide-react";

// Props compartilhadas para os componentes de layout
interface LoginLayoutProps {
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

// Componente de login para Mobile
export const MobileLoginLayout = ({
  showPassword,
  setShowPassword,
}: LoginLayoutProps) => (
  <div className="w-full max-w-md mt-8">
    <h1 className="font-inter font-bold text-3xl text-white mb-8">ENTRE</h1>
    <Input
      icon={Mail}
      type="email"
      placeholder="E-mail"
      className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
    />

    <Input
      icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
      type={showPassword ? "text" : "password"}
      placeholder="Senha"
      onIconClick={() => setShowPassword(!showPassword)}
      className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
    />

    <div className="flex items-center justify-center mt-10">
      <LoginButton>ENTRAR</LoginButton>
      <LoginDivider text="ou" />
      <LoginButton
        variant="icon"
        icon={Github}
        aria-label="Entrar com GitHub"
      />
    </div>

    <div className="flex flex-col items-center justify-center mt-6">
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
          href="../auth/register"
          className="font-inter font-normal text-black underline hover:text-gray-200 transition-colors"
          style={{ fontSize: "0.75rem" }}>
          Registre-se aqui
        </Link>
      </div>

      <div className="mt-4">
        <Link
          href="./reset-password"
          className="font-inter font-normal text-white underline hover:text-gray-200 transition-colors text-xs">
          Esqueceu sua senha?
        </Link>
      </div>
    </div>
  </div>
);

// Componente de login para Desktop
export const DesktopLoginLayout = ({
  showPassword,
  setShowPassword,
}: LoginLayoutProps) => (
  <div className="flex w-full h-screen">
    {/* Lado esquerdo - logo em fundo branco */}
    <div className="w-1/2 bg-white flex items-center justify-center">
      <div className="w-[27.75rem] h-[16.875rem]">
        {" "}
        <Image
          src={Logo}
          alt="Lavorato Saúde Integrada"
          width={444}
          height={270}
          priority
          className="w-full h-full"
        />
      </div>
    </div>

    {/* Lado direito - formulário de login em fundo azul */}
    <div className="w-1/2 bg-primary-light flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1
          className="font-inter font-bold text-4xl text-white mb-10 text-left"
          style={{ paddingLeft: "0.1rem" }}>
          ENTRE
        </h1>

        <Input
          icon={Mail}
          type="email"
          placeholder="E-mail"
          className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
        />

        <Input
          icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
          type={showPassword ? "text" : "password"}
          placeholder="Senha"
          onIconClick={() => setShowPassword(!showPassword)}
          className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
        />

        <div className="flex items-center justify-center gap-1 mt-8">
          <LoginButton size="default">ENTRAR</LoginButton>
          <LoginDivider text="ou" />
          <LoginButton
            variant="icon"
            icon={Github}
            aria-label="Entrar com GitHub"
          />
        </div>

        <div className="mt-8 text-center">
          <div className="mb-3">
            <span className="font-inter font-normal text-white text-xs">
              Não tem uma conta?
            </span>
            <span className="mx-1"></span>
            <Link
              href="../auth/register"
              className="font-inter font-normal text-black underline hover:text-gray-700 transition-colors text-xs">
              Registre-se aqui
            </Link>
          </div>

          <Link
            href="./reset-password"
            className="font-inter font-normal text-white underline hover:text-gray-200 transition-colors text-xs">
            Esqueceu sua senha?
          </Link>
        </div>
      </div>
    </div>
  </div>
);
