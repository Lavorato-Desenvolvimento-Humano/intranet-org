// Em apps/frontend/src/components/admin/UserApprovalStatus.tsx
import React from "react";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface UserApprovalStatusProps {
  emailVerified: boolean;
  adminApproved: boolean;
  active: boolean;
}

const UserApprovalStatus: React.FC<UserApprovalStatusProps> = ({
  emailVerified,
  adminApproved,
  active,
}) => {
  if (!active) {
    return (
      <div className="flex items-center text-red-500" title="Conta Desativada">
        <XCircle size={16} className="mr-1" />
        <span className="text-xs">Desativada</span>
      </div>
    );
  }

  if (!emailVerified) {
    return (
      <div
        className="flex items-center text-yellow-500"
        title="Email Não Verificado">
        <AlertTriangle size={16} className="mr-1" />
        <span className="text-xs">Não Verificado</span>
      </div>
    );
  }

  if (!adminApproved) {
    return (
      <div
        className="flex items-center text-blue-500"
        title="Aprovação Pendente">
        <Clock size={16} className="mr-1" />
        <span className="text-xs">Aprovação Pendente</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-green-500" title="Conta Ativa">
      <CheckCircle size={16} className="mr-1" />
      <span className="text-xs">Ativa</span>
    </div>
  );
};

export default UserApprovalStatus;
