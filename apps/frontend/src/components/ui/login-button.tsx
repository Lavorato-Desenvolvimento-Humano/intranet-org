// src/components/ui/login-button.tsx
import React from "react";
import { LucideIcon } from "lucide-react";

// Interfaces separadas para cada variante
interface BaseLoginButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "icon";
  className?: string;
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
  if (props.variant === "icon") {
    const { icon: Icon, className = "", ...restProps } = props;
    return (
      <button
        className={`flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors ${className}`}
        style={{ width: "3.5rem", height: "3.5rem" }}
        {...restProps}>
        {Icon && <Icon size={28} />}
      </button>
    );
  }

  const { children, className = "", ...restProps } = props;
  return (
    <button
      className={`flex items-center justify-center bg-white text-black font-bold text-base hover:bg-gray-50 transition-colors ${className}`}
      style={{ width: "11rem", height: "2.75rem", borderRadius: "0.5rem" }}
      {...restProps}>
      {children}
    </button>
  );
}

// src/components/ui/login-divider.tsx
interface LoginDividerProps {
  text: string;
}

export function LoginDivider({ text }: LoginDividerProps) {
  return (
    <div className="mx-4">
      <span className="font-inter font-normal text-base text-white">
        {text}
      </span>
    </div>
  );
}
