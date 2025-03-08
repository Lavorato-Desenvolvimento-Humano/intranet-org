// components/auth/reset-password/code/layouts.tsx
import VerificationInput from "../../../../ui/verificationInput";
import Image from "next/image";
import Logo from "../../../../../../public/logo.svg";
import { CustomButton } from "@/components/ui/custom-button";
import Link from "next/link";

// Interface para os props compartilhados
interface ResetPasswordCodeLayoutProps {
  onSubmit: (e: React.FormEvent) => void;
}

// Componente mobile para code de senha
export const MobileResetPasswordCodeLayout = ({
  onSubmit,
}: ResetPasswordCodeLayoutProps) => (
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
        CONFIRMAR CÓDIGO
      </h1>

      <p className="text-gray-600 text-base mb-8">
        Insira abaixo o código que enviamos para o e-mail:
        <br />
        exemplo********@gmail.com para confirmar sua identidade
      </p>

      <form onSubmit={onSubmit} className="w-full flex flex-col items-center">
        <div className="w-full flex justify-center mb-8">
          <VerificationInput
            containerClassName="flex gap-2 justify-center"
            inputClassName="mb-0 w-12 h-12 border border-gray-700 rounded-lg text-center text-xl font-semibold"
          />
        </div>

        <CustomButton
          type="submit"
          className="w-44 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
          size="default">
          ENVIAR
        </CustomButton>
      </form>
    </div>

    <div className="mt-8 text-left">
      <div className="mb-3">
        <span className="font-inter font-normal text-gray-700 text-xs">
          Não recebeu o código?
        </span>
        <span className="mx-1"></span>
        <Link
          href="auth/reset-password"
          className="font-inter font-normal text-black underline hover:text-gray-700 transition-colors text-xs">
          Revisar E-mail
        </Link>
      </div>
    </div>
  </div>
);

// Componente desktop para
export const DesktopResetPasswordCodeLayout = ({
  onSubmit,
}: ResetPasswordCodeLayoutProps) => (
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

    {/* Lado direito - formulário de code */}
    <div className="w-1/2 bg-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="font-inter font-bold text-4xl text-gray-800 mb-6 text-left">
          CONFIRMAR CÓDIGO
        </h1>

        <p className="text-gray-600 text-base mb-8">
          Insira abaixo o código que enviamos para o e-mail:
          <br />
          exemplo********@gmail.com para confirmar sua identidade
        </p>

        <form onSubmit={onSubmit}>
          <VerificationInput />

          <CustomButton
            type="submit"
            className="w-full max-w-44 mx-0 block py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-s-xl transition-colors"
            size="default">
            ENVIAR
          </CustomButton>
        </form>
      </div>

      <div className="mt-8 self-center w-full max-w-md">
        <div className="mb-3">
          <span className="font-inter font-normal text-gray-700 text-xs">
            Não recebeu o código?
          </span>
          <span className="mx-1"></span>
          <Link
            href="auth/reset-password"
            className="font-inter font-normal text-black underline hover:text-gray-700 transition-colors text-xs">
            Revisar E-mail
          </Link>
        </div>
      </div>
    </div>
  </div>
);
