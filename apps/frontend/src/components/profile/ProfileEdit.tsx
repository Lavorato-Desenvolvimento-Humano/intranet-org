// src/components/profile/ProfileEdit.tsx
import React, { useState } from "react";
import { User } from "@/services/auth";
import profileService from "@/services/profile";
import { CustomButton } from "@/components/ui/custom-button";
import { Loader2, Save } from "lucide-react";
import toastUtil from "@/utils/toast";

interface ProfileEditProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({
  user,
  onProfileUpdate,
}) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Validar domínio de e-mail sempre que o e-mail mudar
  React.useEffect(() => {
    if (email && !email.endsWith("@lavorato.com.br")) {
      setEmailError(
        "Apenas emails com domínio @lavorato.com.br são permitidos"
      );
    } else {
      setEmailError("");
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (emailError) {
      toastUtil.error(emailError);
      return;
    }

    if (!fullName.trim()) {
      toastUtil.error("Nome é obrigatório");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await profileService.updateProfile(user.id, {
        fullName,
        email,
      });
      onProfileUpdate(updatedUser);
      toastUtil.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      if (error.response?.data?.message) {
        toastUtil.error(error.response.data.message);
      } else if (error.response?.status === 409) {
        toastUtil.error("Este email já está em uso");
      } else {
        toastUtil.error("Erro ao atualizar perfil");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome completo
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full p-2 border ${
            emailError ? "border-red-500" : "border-gray-300"
          } rounded-md focus:ring-2 focus:ring-primary focus:border-transparent`}
          required
        />
        {emailError && (
          <p className="mt-1 text-sm text-red-500">{emailError}</p>
        )}
      </div>

      <CustomButton
        type="submit"
        icon={isSubmitting ? Loader2 : Save}
        disabled={isSubmitting}
        className="w-full mt-4">
        {isSubmitting ? "Salvando..." : "Salvar alterações"}
      </CustomButton>
    </form>
  );
};
