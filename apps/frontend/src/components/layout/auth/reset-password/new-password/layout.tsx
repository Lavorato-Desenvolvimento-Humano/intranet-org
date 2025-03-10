// components/layout/auth/reset-password/new-password/layout.tsx
import Input from "@/components/ui/input";
import Image from "next/image";
import Logo from "../../../../../../public/logo.svg";
import { CustomButton } from "@/components/ui/custom-button";
import { LockKeyholeIcon, LockKeyholeOpenIcon, Loader2 } from "lucide-react";

// Interface para os props compartilhados
interface NewPasswordLayoutProps {
  onSubmit: (e: React.FormEvent) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  isSubmitting: boolean;
}

// Componente mobile para nova senha
export const MobileNewPasswordLayout = ({
  onSubmit,
  showPassword,
  setShowPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isSubmitting,
}: NewPasswordLayoutProps) => (
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
        NOVA SENHA
      </h1>

      <p className="text-gray-600 text-base mb-6 text-center">
        Crie uma nova senha para sua conta.
        <br />
        Sua senha deve ter pelo menos 8 caracteres.
      </p>

      <form onSubmit={onSubmit} className="w-full flex justify-center flex-col">
        <Input
          icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
          type={showPassword ? "text" : "password"}
          placeholder="Nova senha"
          onIconClick={() => setShowPassword(!showPassword)}
          className="bg-transparent border-2 border-gray-800 text-gray-800 placeholder:text-gray-800 placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />

        <Input
          icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
          type={showPassword ? "text" : "password"}
          placeholder="Confirmar nova senha"
          onIconClick={() => setShowPassword(!showPassword)}
          className="mb-4 bg-transparent border-2 border-gray-800 text-gray-800 placeholder:text-gray-800 placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <CustomButton
          type="submit"
          className="w-52 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors mx-auto"
          size="default"
          disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              REDEFININDO...
            </>
          ) : (
            "REDEFINIR SENHA"
          )}
        </CustomButton>
      </form>
    </div>
  </div>
);

// Componente desktop para nova senha
export const DesktopNewPasswordLayout = ({
  onSubmit,
  showPassword,
  setShowPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  isSubmitting,
}: NewPasswordLayoutProps) => (
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

    {/* Lado direito - formulário de nova senha */}
    <div className="w-1/2 bg-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="font-inter font-bold text-4xl text-gray-800 mb-6 text-left">
          NOVA SENHA
        </h1>

        <p className="text-gray-600 text-base mb-8">
          Crie uma nova senha para sua conta.
          <br />
          Sua senha deve ter pelo menos 8 caracteres.
        </p>

        <form onSubmit={onSubmit}>
          <Input
            icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
            type={showPassword ? "text" : "password"}
            placeholder="Nova senha"
            onIconClick={() => setShowPassword(!showPassword)}
            className="bg-transparent border-2 border-gray-800 text-gray-800 placeholder:text-gray-800 placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />

          <Input
            icon={showPassword ? LockKeyholeOpenIcon : LockKeyholeIcon}
            type={showPassword ? "text" : "password"}
            placeholder="Confirmar nova senha"
            onIconClick={() => setShowPassword(!showPassword)}
            className="mb-4 bg-transparent border-2 border-gray-800 text-gray-800 placeholder:text-gray-800 placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <CustomButton
            type="submit"
            className="w-full max-w-52 mx-0 block py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-s-xl transition-colors"
            size="default"
            disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                REDEFININDO...
              </>
            ) : (
              "REDEFINIR SENHA"
            )}
          </CustomButton>
        </form>
      </div>
    </div>
  </div>
);
