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
  Loader2,
} from "lucide-react";

// Props compartilhadas para os componentes de layout
interface RegisterLayoutProps {
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  fullName: string;
  setFullName: (fullName: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  onInputChange?: () => void; // Agora é opcional
}

// Componente de registro para Mobile
export const MobileRegisterLayout = ({
  showPassword,
  setShowPassword,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  handleSubmit,
  isSubmitting,
  onInputChange = () => {}, // Valor padrão para quando não for fornecido
}: RegisterLayoutProps) => (
  <div className="w-full max-w-md mt-8">
    <h1 className="font-inter font-bold text-3xl text-white mb-8">
      REGISTRE-SE
    </h1>

    <form onSubmit={handleSubmit}>
      <Input
        icon={User}
        type="text"
        placeholder="Nome completo"
        className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg"
        value={fullName}
        onChange={(e) => {
          setFullName(e.target.value);
          onInputChange?.();
        }}
        required
      />

      <Input
        icon={Mail}
        type="email"
        placeholder="E-mail"
        className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          onInputChange?.();
        }}
        required
      />

      <Input
        icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
        type={showPassword ? "text" : "password"}
        placeholder="Senha"
        onIconClick={() => setShowPassword(!showPassword)}
        className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          onInputChange?.();
        }}
        required
      />

      <Input
        icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
        type={showPassword ? "text" : "password"}
        placeholder="Confirme sua senha"
        onIconClick={() => setShowPassword(!showPassword)}
        className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          onInputChange?.();
        }}
        required
      />

      <div className="flex items-center justify-center mt-10">
        <LoginButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              REGISTRANDO...
            </>
          ) : (
            "REGISTRE-SE"
          )}
        </LoginButton>
        <LoginDivider text="ou" />
        <LoginButton
          variant="icon"
          icon={Github}
          aria-label="Entrar com GitHub"
          type="button"
          onClick={() => {
            // Redirecionar para o endpoint de autenticação do GitHub
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL || ""}/auth/github-callback`;
          }}
          disabled={isSubmitting}
        />
      </div>
    </form>

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

// Componente de registro para Desktop
export const DesktopRegisterLayout = ({
  showPassword,
  setShowPassword,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  handleSubmit,
  isSubmitting,
  onInputChange = () => {}, // Valor padrão para quando não for fornecido
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

        <form onSubmit={handleSubmit}>
          <Input
            icon={User}
            type="text"
            placeholder="Nome completo"
            className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              onInputChange?.();
            }}
            required
          />

          <Input
            icon={Mail}
            type="email"
            placeholder="E-mail"
            className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              onInputChange?.();
            }}
            required
          />

          <Input
            icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            onIconClick={() => setShowPassword(!showPassword)}
            className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              onInputChange?.();
            }}
            required
          />

          <Input
            icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
            type={showPassword ? "text" : "password"}
            placeholder="Confirme sua senha"
            onIconClick={() => setShowPassword(!showPassword)}
            className="mb-6 bg-transparent border-2 border-white text-white placeholder:text-white placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              onInputChange?.();
            }}
            required
          />

          <div className="flex items-center justify-center gap-1 mt-8">
            <LoginButton size="default" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  REGISTRANDO...
                </>
              ) : (
                "REGISTRAR"
              )}
            </LoginButton>
            <LoginDivider text="ou" />
            <LoginButton
              variant="icon"
              icon={Github}
              aria-label="Entrar com GitHub"
              type="button"
              onClick={() => {
                // Redirecionar para o endpoint de autenticação do GitHub
                window.location.href = `${process.env.NEXT_PUBLIC_API_URL || ""}/auth/github-callback`;
              }}
              disabled={isSubmitting}
            />
          </div>
        </form>

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
