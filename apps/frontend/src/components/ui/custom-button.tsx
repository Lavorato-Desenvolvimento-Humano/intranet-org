// components/ui/custom-button.tsx
import React from "react";
import { LucideIcon } from "lucide-react";

interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "default" | "small" | "large";
  fullWidth?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
}

// Exportando como um objeto nomeado para corresponder à importação
export function CustomButton({
  children,
  variant = "primary",
  size = "default",
  fullWidth = false,
  icon: Icon,
  iconPosition = "left",
  className = "",
  ...props
}: CustomButtonProps) {
  // Estilos base do botão
  const baseStyles = "rounded-lg font-bold transition-colors";

  // Estilos de variante
  const variantStyles = {
    primary: "bg-primary hover:bg-primary-dark text-white",
    secondary:
      "bg-transparent border-2 border-white hover:bg-white/10 text-white",
  };

  // Estilos de tamanho
  const sizeStyles = {
    small: "py-2 px-4 text-sm",
    default: "py-3 px-6",
    large: "py-4 px-8 text-lg",
  };

  // Estilo de largura total
  const widthStyle = fullWidth ? "w-full" : "";

  // Classes combinadas
  const buttonClasses = `
    ${baseStyles} 
    ${variantStyles[variant]} 
    ${sizeStyles[size]} 
    ${widthStyle} 
    ${className}
  `;

  return (
    <button className={buttonClasses} {...props}>
      <div className="flex items-center justify-center gap-2">
        {Icon && iconPosition === "left" && <Icon size={20} />}
        {children}
        {Icon && iconPosition === "right" && <Icon size={20} />}
      </div>
    </button>
  );
}

// Também exportando como padrão para compatibilidade
export default CustomButton;
