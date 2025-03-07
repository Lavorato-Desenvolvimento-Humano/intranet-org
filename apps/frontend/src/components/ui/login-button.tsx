// src/components/ui/login-button.tsx
import React from "react";
import { LucideIcon } from "lucide-react";

// Interfaces separadas para cada variante
interface BaseLoginButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "icon";
  className?: string;
  size?: "default" | "small" | "large";
}

interface PrimaryLoginButtonProps extends BaseLoginButtonProps {
  variant?: "primary";
  children: React.ReactNode;
  icon?: never;
}

interface IconLoginButtonProps extends BaseLoginButtonProps {
  variant: "icon";
  icon: LucideIcon;
  children?: never;
}

// Union type para as props
type LoginButtonProps = PrimaryLoginButtonProps | IconLoginButtonProps;

export default function LoginButton(props: LoginButtonProps) {
  // Valor de tamanho padrão
  const size = props.size || "default";

  // Mapeia os tamanhos para dimensões concretas
  const sizeMap = {
    small: { width: "8rem", height: "2.5rem" },
    default: { width: "11rem", height: "2.75rem" },
    large: { width: "14rem", height: "3rem" },
  };

  if (props.variant === "icon") {
    const { icon: Icon, className = "", size, ...restProps } = props;
    return (
      <button
        className={`flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors ${className}`}
        style={{ width: "3.5rem", height: "3.5rem" }}
        {...restProps}>
        {Icon && <Icon size={28} />}
      </button>
    );
  }

  const { children, className = "", size: sizeKey, ...restProps } = props;

  // Obtém as dimensões baseadas no tamanho selecionado
  const dimensions = sizeMap[size];

  return (
    <button
      className={`flex items-center justify-center bg-white text-black font-bold text-base hover:bg-gray-50 transition-colors ${className}`}
      style={{ ...dimensions, borderRadius: "0.5rem" }}
      {...restProps}>
      {children}
    </button>
  );
}

// A componente LoginDivider permanece igual
interface LoginDividerProps {
  text: string;
  className?: string;
}

export function LoginDivider({ text, className = "" }: LoginDividerProps) {
  return (
    <div className={`mx-4 ${className}`}>
      <span className="font-inter font-normal text-base text-white">
        {text}
      </span>
    </div>
  );
}
