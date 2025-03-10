// components/auth/register/layouts.tsx
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
  User,
} from "lucide-react";

// Props compartilhadas para os componentes de layout
interface RegisterLayoutProps {
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

// Componente de registro para Mobile
export const MobileRegisterLayout = ({
  showPassword,
  setShowPassword,
}: RegisterLayoutProps) => (
  <div className="w-full max-w-md mt-8">
    <h1 className="font-inter font-bold text-3xl text-white mb-8">
      REGISTRE-SE
    </h1>

    <Input
      icon={User}
      type="name"
      placeholder="Nome completo"
      className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg"
    />

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

    <Input
      icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
      type={showPassword ? "text" : "password"}
      placeholder="Confirme sua senha"
      onIconClick={() => setShowPassword(!showPassword)}
      className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg"
    />

    <div className="flex items-center justify-center mt-10">
      <LoginButton>REGISTRE-SE</LoginButton>
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
          Já tem uma conta?
        </span>
        <span className="mx-1"></span>
        <Link
          href="../auth/login"
          className="font-inter font-normal text-black underline hover:text-gray-200 transition-colors"
          style={{ fontSize: "0.75rem" }}>
          Entre aqui
        </Link>
      </div>
    </div>
  </div>
);

// Componente de registro para Desktop (apenas h1 alinhado à esquerda)
export const DesktopRegisterLayout = ({
  showPassword,
  setShowPassword,
}: RegisterLayoutProps) => (
  <div className="flex w-full h-screen">
    {/* Lado esquerdo - logo em fundo branco */}
    <div className="w-1/2 bg-white flex items-center justify-center">
      <div className="w-[27.75rem] h-[16.875rem]">
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
        {/* Apenas o título foi alterado para ficar à esquerda */}
        <h1
          className="font-inter font-bold text-4xl text-white mb-10 text-left"
          style={{ paddingLeft: "0.10rem" }}>
          REGISTRE-SE
        </h1>

        <Input
          icon={User}
          type="name"
          placeholder="Nome completo"
          className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
        />

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

        <Input
          icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
          type={showPassword ? "text" : "password"}
          placeholder="Confirme sua senha"
          onIconClick={() => setShowPassword(!showPassword)}
          className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
        />

        <div className="flex items-center justify-center gap-1 mt-8">
          <LoginButton size="default">REGISTRAR</LoginButton>
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
              Já tem uma conta?
            </span>
            <span className="mx-1"></span>
            <Link
              href="../auth/login"
              className="font-inter font-normal text-black underline hover:text-gray-700 transition-colors text-xs">
              Entre aqui
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);
