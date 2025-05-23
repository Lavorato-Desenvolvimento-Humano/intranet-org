// src/components/profile/DeleteAccount.tsx
import React, { useState } from "react";
import { User } from "@/services/auth";
import profileService from "@/services/profile";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";
import toastUtil from "@/utils/toast";
import { useAuth } from "@/context/AuthContext";

interface DeleteAccountProps {
  user: User;
}

export const DeleteAccount: React.FC<DeleteAccountProps> = ({ user }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { logout } = useAuth();

  const handleShowConfirmation = () => {
    setShowConfirmation(true);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setConfirmEmail("");
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmEmail !== user.email) {
      toastUtil.error("Email não corresponde à sua conta");
      return;
    }

    setIsSubmitting(true);
    const loadingToastId = toastUtil.loading(
      "Processando exclusão da conta..."
    );

    try {
      await profileService.deleteAccount(user.id);
      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Conta excluída com sucesso");

      // Usar setTimeout para garantir que o toast seja visto antes do redirecionamento
      setTimeout(() => {
        // Usar o método logout do AuthContext para garantir limpeza adequada
        logout();
        // Garantir redirecionamento para a página de login
        window.location.href = "/auth/login";
      }, 1500);
    } catch (error: any) {
      toastUtil.dismiss(loadingToastId);

      if (error.response?.status === 403) {
        toastUtil.error("Você não tem permissão para excluir esta conta");
      } else if (error.response?.status === 401) {
        toastUtil.error("Sua sessão expirou. Faça login novamente.");
        setTimeout(() => {
          logout();
        }, 1500);
      } else if (error.response?.data?.message) {
        toastUtil.error(error.response.data.message);
      } else if (error.message && error.message.includes("timeout")) {
        toastUtil.error("Tempo limite excedido. Tente novamente mais tarde.");
      } else {
        toastUtil.error("Erro ao excluir conta. Tente novamente.");
      }

      console.error("Detalhes do erro:", error);
      setIsSubmitting(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="mt-4 p-4 border border-red-300 rounded-md bg-red-50">
        <div className="flex items-start mb-4">
          <AlertTriangle
            className="text-red-500 mr-2 mt-1 flex-shrink-0"
            size={20}
          />
          <div>
            <h3 className="font-semibold text-red-700">
              Confirmação de exclusão
            </h3>
            <p className="text-sm text-red-600 mt-1">
              Esta ação é <strong>permanente</strong> e não pode ser desfeita.
              Todos os seus dados serão excluídos.
            </p>
          </div>
        </div>

        <form onSubmit={handleDelete}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Digite seu email para confirmar a exclusão
            </label>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={user.email}
              required
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

          <div className="flex space-x-3">
            <CustomButton
              type="button"
              variant="primary"
              onClick={handleCancel}
              className="flex-1"
              disabled={isSubmitting}>
              Cancelar
            </CustomButton>
            <CustomButton
              type="submit"
              icon={isSubmitting ? Loader2 : undefined}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting ? "Processando..." : "Confirmar exclusão"}
            </CustomButton>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Excluir conta
      </h3>
      <p className="text-gray-600 text-sm mb-4">
        Ao excluir sua conta, todos os seus dados serão permanentemente
        removidos. Esta ação não pode ser desfeita.
      </p>
      <CustomButton
        type="button"
        icon={Trash2}
        onClick={handleShowConfirmation}
        className="bg-red-600 hover:bg-red-700 text-white">
        Excluir minha conta
      </CustomButton>
    </div>
  );
};
