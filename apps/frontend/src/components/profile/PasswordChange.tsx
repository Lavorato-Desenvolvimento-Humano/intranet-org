// src/components/profile/PasswordChange.tsx
import React, { useState } from "react";
import { User } from "@/services/auth";
import profileService from "@/services/profile";
import { CustomButton } from "@/components/ui/custom-button";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import toastUtil from "@/utils/toast";

interface PasswordChangeProps {
  user: User;
}

export const PasswordChange: React.FC<PasswordChangeProps> = ({ user }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Validar complexidade da senha
  React.useEffect(() => {
    if (newPassword) {
      const hasNumber = /\d/.test(newPassword);
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
      const isLongEnough = newPassword.length >= 8;

      if (!isLongEnough) {
        setPasswordError("A senha deve ter pelo menos 8 caracteres");
      } else if (
        !(hasNumber && hasUpperCase && hasLowerCase && hasSpecialChar)
      ) {
        setPasswordError(
          "A senha deve conter pelo menos um número, uma letra maiúscula, uma letra minúscula e um caractere especial"
        );
      } else {
        setPasswordError("");
      }
    } else {
      setPasswordError("");
    }
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (passwordError) {
      toastUtil.error(passwordError);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toastUtil.error("As senhas não coincidem");
      return;
    }

    if (!currentPassword) {
      toastUtil.error("Senha atual é obrigatória");
      return;
    }

    setIsSubmitting(true);
    try {
      await profileService.updatePassword(user.id, {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      // Limpar formulário após sucesso
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      toastUtil.success("Senha atualizada com sucesso!");
    } catch (error: any) {
      if (error.response?.status === 401) {
        toastUtil.error("Senha atual incorreta");
      } else if (error.response?.data?.message) {
        toastUtil.error(error.response.data.message);
      } else {
        toastUtil.error("Erro ao atualizar senha");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Senha atual
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
          <Lock
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nova senha
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full p-2 pl-10 border ${
              passwordError ? "border-red-500" : "border-gray-300"
            } rounded-md focus:ring-2 focus:ring-primary focus:border-transparent`}
            required
          />
          <Lock
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
        </div>
        {passwordError && (
          <p className="mt-1 text-sm text-red-500">{passwordError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar nova senha
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
          <Lock
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
        </div>
      </div>

      <CustomButton
        type="submit"
        variant="primary"
        icon={isSubmitting ? Loader2 : undefined}
        disabled={isSubmitting}
        className="w-full mt-4">
        {isSubmitting ? "Atualizando..." : "Atualizar senha"}
      </CustomButton>
    </form>
  );
};
