import React, { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { User } from "@/services/auth";
import profileService from "@/services/profile";
import toastUtil from "@/utils/toast";

interface ProfileImageUploadProps {
  user: User;
  onImageUpdate: (updatedUser: User) => void;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  user,
  onImageUpdate,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Função aprimorada para renderizar a imagem de perfil com fallback
  const renderProfileImage = () => {
    if (!user.profileImage || imageError) {
      // Se não há imagem ou ocorreu um erro, mostrar a inicial do nome
      return (
        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-600">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
      );
    }

    // Determina a URL da imagem com base no seu formato
    const baseApiUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://dev.lavorato.app.br";

    // Lógica aprimorada para determinar a URL
    let imageUrl;
    if (
      user.profileImage.startsWith("http") ||
      user.profileImage.startsWith("data:")
    ) {
      // URL completa ou data URL
      imageUrl = user.profileImage;
    } else if (user.profileImage.startsWith("/")) {
      // Caminho relativo começando com '/'
      imageUrl = `${baseApiUrl}${user.profileImage}`;
    } else {
      // Assume que é um nome de arquivo na pasta de uploads
      imageUrl = `${baseApiUrl}/uploads/images/${user.profileImage}`;
    }

    return (
      <div className="w-full h-full relative">
        <img
          src={imageUrl}
          alt={user.fullName}
          className="w-full h-full object-cover rounded-full"
          onError={() => {
            console.log("Erro ao carregar imagem:", imageUrl);
            setImageError(true);
          }}
        />
      </div>
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação melhorada do tipo de arquivo
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toastUtil.error(
        "Por favor, selecione uma imagem válida (JPEG, PNG, GIF ou WebP)"
      );
      return;
    }

    // Validar tamanho (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toastUtil.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);
    const loadingToastId = toastUtil.loading("Enviando imagem...");

    try {
      const updatedUser = await profileService.updateProfileImage(
        user.id,
        file
      );

      setImageError(false); // Resetar flag de erro
      onImageUpdate(updatedUser);

      toastUtil.dismiss(loadingToastId);
      toastUtil.success("Imagem de perfil atualizada com sucesso!");
    } catch (error: any) {
      toastUtil.dismiss(loadingToastId);

      if (error.response?.status === 413) {
        toastUtil.error("Imagem muito grande. O tamanho máximo é 5MB.");
      } else if (error.response?.data?.message) {
        toastUtil.error(error.response.data.message);
      } else if (error.message && error.message.includes("timeout")) {
        toastUtil.error("Tempo limite excedido. Tente com uma imagem menor.");
      } else {
        toastUtil.error("Erro ao atualizar imagem de perfil. Tente novamente.");
      }

      console.error("Detalhes do erro:", error);
    } finally {
      setIsUploading(false);

      // Limpar o input de arquivo para permitir o reenvio do mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative">
      <div
        onClick={handleImageClick}
        className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 relative cursor-pointer overflow-hidden hover:opacity-80 transition-opacity">
        {renderProfileImage()}

        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center">
          <Camera
            className="text-white opacity-0 hover:opacity-100"
            size={32}
          />
        </div>
      </div>

      {isUploading && (
        <div className="absolute inset-0 bg-gray-200 bg-opacity-70 rounded-full flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
      />
    </div>
  );
};
