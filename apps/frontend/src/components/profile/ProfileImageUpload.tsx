// src/components/profile/ProfileImageUpload.tsx
import React, { useState, useRef, useEffect } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  // Função para construir a URL da imagem diretamente
  const buildImageUrl = (profileImage: string | null | undefined): string => {
    if (!profileImage) return "";

    // Se já for uma URL completa
    if (profileImage.startsWith("http")) return profileImage;

    // Construindo a URL base da API
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";

    // Se o profileImage já contém a parte de profiles/
    if (profileImage.includes("profiles/")) {
      return `${apiBaseUrl}/api/${profileImage}`;
    }

    // Caso contrário, construa o caminho completo
    return `${apiBaseUrl}/api/profile-images/${profileImage}`;
  };

  // Efeito para construir a URL da imagem quando o usuário muda ou retryCount muda
  useEffect(() => {
    const loadProfileImage = async () => {
      if (!user.profileImage) {
        setImageError(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Montar a URL da imagem
      const url = buildImageUrl(user.profileImage);
      setImageUrl(url);
      setIsLoading(false);
    };

    loadProfileImage();
  }, [user.profileImage, retryCount]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageError = () => {
    console.error(`Erro ao carregar imagem: ${imageUrl}`);
    setImageError(true);
  };

  // Função para renderizar a imagem de perfil
  const renderProfileImage = () => {
    if (isLoading) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-600" size={24} />
        </div>
      );
    }

    if (!user.profileImage || imageError || !imageUrl) {
      // Usar um avatar baseado na inicial do nome
      return (
        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-600">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
      );
    }

    return (
      <div className="w-full h-full relative">
        <img
          src={imageUrl}
          alt={user.fullName}
          className="w-full h-full object-cover rounded-full"
          onError={handleImageError}
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

      // Resetar estados
      setImageError(false);

      // Atualizar a URL da imagem com a nova imagem
      const newImageUrl = buildImageUrl(updatedUser.profileImage);
      setImageUrl(newImageUrl);

      // Notificar o componente pai sobre a atualização
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
