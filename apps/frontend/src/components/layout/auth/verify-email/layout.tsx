// apps/frontend/src/components/layout/auth/verify-email/layouts.tsx
import VerificationInput from "@/components/ui/verificationInput";
import Image from "next/image";
import Logo from "../../../../../public/logo.svg";
import { CustomButton } from "@/components/ui/custom-button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

// Interface para os props compartilhados
interface EmailVerificationLayoutProps {
  onSubmit: (e: React.FormEvent) => void;
  code: string;
  setCode: (code: string) => void;
  isSubmitting: boolean;
  email: string;
  onResendCode: () => void;
}

// Função para mascarar parte do email (ex: e***@exemplo.com)
function maskEmail(email: string): string {
  if (!email) return "";

  const parts = email.split("@");
  if (parts.length !== 2) return email;

  const [username, domain] = parts;

  // Se o nome de usuário for muito curto, apenas oculta o meio
  if (username.length <= 3) {
    return username[0] + "***@" + domain;
  }

  // Caso contrário, mostra o primeiro e último caractere do nome de usuário
  return username[0] + "***" + username[username.length - 1] + "@" + domain;
}

// Componente mobile para verificação de email
export const MobileEmailVerificationLayout = ({
  onSubmit,
  code,
  setCode,
  isSubmitting,
  email,
  onResendCode,
}: EmailVerificationLayoutProps) => (
  <div className="w-full flex flex-col items-center bg-white min-h-screen p-4">
    {/* Logo no topo */}
    <div className="mt-8 mb-6">
      <Image
        src={Logo}
        alt="Lavorato Saúde Integrada"
        width={181}
        height={110}
        priority
        className="w-[11.3125rem] h-auto"
      />
    </div>

    {/* Linha horizontal */}
    <div className="w-full max-w-md h-px bg-gray-800 mb-10"></div>

    {/* Conteúdo do formulário */}
    <div className="w-full max-w-md flex flex-col items-center mt-28">
      <h1 className="font-inter font-bold text-3xl text-gray-800 mb-6 text-center">
        VERIFICAR EMAIL
      </h1>

      <p className="text-gray-600 text-base mb-8">
        Insira abaixo o código que enviamos para o e-mail:
        <br />
        <span className="font-semibold">{maskEmail(email)}</span> para ativar
        sua conta.
      </p>

      <form onSubmit={onSubmit} className="w-full flex flex-col items-center">
        <div className="w-full flex justify-center mb-8">
          <VerificationInput
            containerClassName="flex gap-2 justify-center"
            inputClassName="mb-0 w-12 h-12 border border-gray-700 rounded-lg text-center text-xl font-semibold"
            value={code}
            onChange={setCode}
            length={6}
          />
        </div>

        <CustomButton
          type="submit"
          className="w-44 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
          size="default"
          disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              VERIFICANDO...
            </>
          ) : (
            "ENVIAR"
          )}
        </CustomButton>
      </form>
    </div>

    <div className="mt-8 text-center">
      <div className="mb-3">
        <span className="font-inter font-normal text-gray-700 text-xs">
          Não recebeu o código?
        </span>
        <span className="mx-1"></span>
        <button
          onClick={onResendCode}
          className="font-inter font-normal text-black underline hover:text-gray-700 transition-colors text-xs">
          Reenviar código
        </button>
      </div>
      <div>
        <Link
          href="/auth/login"
          className="font-inter font-normal text-primary underline hover:text-primary-dark transition-colors text-xs">
          Voltar para login
        </Link>
      </div>
    </div>
  </div>
);

// Componente desktop para verificação de email
export const DesktopEmailVerificationLayout = ({
  onSubmit,
  code,
  setCode,
  isSubmitting,
  email,
  onResendCode,
}: EmailVerificationLayoutProps) => (
  <div className="flex w-full h-screen relative">
    {/* Linha vertical separadora */}
    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-[606px] bg-gray-800"></div>

    {/* Lado esquerdo - logo em fundo branco */}
    <div className="w-1/2 bg-white flex items-center justify-center">
      <div className="w-[27.75rem] h-[16.875rem]">
        <Image
          src={Logo}
          alt="Lavorato Saúde Integrada"
          width={445}
          height={270}
          priority
          className="w-full h-full"
        />
      </div>
    </div>

    {/* Lado direito - formulário de verificação */}
    <div className="w-1/2 bg-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="font-inter font-bold text-4xl text-gray-800 mb-6 text-left">
          VERIFICAR EMAIL
        </h1>

        <p className="text-gray-600 text-base mb-8">
          Insira abaixo o código que enviamos para o e-mail:
          <br />
          <span className="font-semibold">{maskEmail(email)}</span> para ativar
          sua conta.
        </p>

        <form onSubmit={onSubmit}>
          <div className="mb-8">
            <VerificationInput
              containerClassName="flex gap-2 justify-start"
              inputClassName="mb-0 w-12 h-12 border border-gray-700 rounded-lg text-center text-xl font-semibold"
              value={code}
              onChange={setCode}
              length={6}
            />
          </div>

          <CustomButton
            type="submit"
            className="w-full max-w-44 mx-0 block py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-s-xl transition-colors"
            size="default"
            disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                VERIFICANDO...
              </>
            ) : (
              "ENVIAR"
            )}
          </CustomButton>
        </form>
      </div>

      <div className="mt-8 self-start ml-8">
        <div className="mb-3">
          <span className="font-inter font-normal text-gray-700 text-xs">
            Não recebeu o código?
          </span>
          <span className="mx-1"></span>
          <button
            onClick={onResendCode}
            className="font-inter font-normal text-black underline hover:text-gray-700 transition-colors text-xs">
            Reenviar código
          </button>
        </div>
        <div>
          <Link
            href="/auth/login"
            className="font-inter font-normal text-primary underline hover:text-primary-dark transition-colors text-xs">
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  </div>
);
