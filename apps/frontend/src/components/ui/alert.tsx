// components/ui/alert.tsx
import React, { ReactNode } from "react";

interface AlertProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
}

export const Alert: React.FC<AlertProps> = ({
  children,
  className = "",
  variant = "default",
}) => {
  const baseStyles = "p-4 rounded-md mb-4";

  let variantStyles = "";
  switch (variant) {
    case "success":
      variantStyles = "bg-green-100 border border-green-400 text-green-700";
      break;
    case "error":
      variantStyles = "bg-red-100 border border-red-400 text-red-700";
      break;
    case "warning":
      variantStyles = "bg-yellow-100 border border-yellow-400 text-yellow-700";
      break;
    case "info":
      variantStyles = "bg-blue-100 border border-blue-400 text-blue-700";
      break;
    default:
      variantStyles = "bg-gray-100 border border-gray-400 text-gray-700";
      break;
  }

  return (
    <div className={`${baseStyles} ${variantStyles} ${className}`}>
      {children}
    </div>
  );
};

export const AlertTitle: React.FC<{ children: ReactNode }> = ({ children }) => (
  <h5 className="font-bold mb-1">{children}</h5>
);

export const AlertDescription: React.FC<{ children: ReactNode }> = ({
  children,
}) => <div>{children}</div>;

export default Alert;
