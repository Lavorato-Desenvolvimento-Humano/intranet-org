// Em apps/frontend/src/components/profile/AccountStatus.tsx
import React from "react";
import { User } from "@/services/auth";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface AccountStatusProps {
  user: User;
}

export const AccountStatus: React.FC<AccountStatusProps> = ({ user }) => {
  const isVerified = user.emailVerified;
  const isApproved = user.adminApproved;
  const isActive = user.active;

  const getStatusMessage = () => {
    if (!isActive) {
      return {
        title: "Conta Desativada",
        message:
          "Sua conta está desativada. Entre em contato com o administrador para mais informações.",
        icon: <XCircle className="text-red-500 w-6 h-6" />,
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800",
      };
    }

    if (!isVerified) {
      return {
        title: "Email Não Verificado",
        message: "Por favor, verifique seu email para ativar sua conta.",
        icon: <AlertTriangle className="text-yellow-500 w-6 h-6" />,
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-800",
      };
    }

    if (!isApproved) {
      return {
        title: "Aprovação Pendente",
        message: "Sua conta está aguardando aprovação do administrador.",
        icon: <Clock className="text-blue-500 w-6 h-6" />,
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
      };
    }

    return {
      title: "Conta Ativa",
      message: "Sua conta está ativa e você tem acesso completo ao sistema.",
      icon: <CheckCircle className="text-green-500 w-6 h-6" />,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
    };
  };

  const status = getStatusMessage();

  return (
    <div
      className={`${status.bgColor} ${status.borderColor} border rounded-lg p-4 mb-6`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">{status.icon}</div>
        <div>
          <h3 className={`${status.textColor} font-semibold text-lg`}>
            {status.title}
          </h3>
          <p className={`${status.textColor} mt-1`}>{status.message}</p>
        </div>
      </div>
    </div>
  );
};

export default AccountStatus;
