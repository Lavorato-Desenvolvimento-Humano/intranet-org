import React, { useState, useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { User } from "@/services/auth";
import profileService from "@/services/profile";
import toastUtil from "@/utils/toast";
import {
  buildProfileImageUrl,
  getAlternativeImageUrls,
  findWorkingImageUrl,
  checkFileExists,
} from "@/utils/imageUtils";

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
  const [cachedImageUrl, setCachedImageUrl] = useState<string | null>(null);

  // Efeito para construir a URL da imagem quando o usuário muda
  useEffect(() => {
    if (!user.profileImage) {
      setImageError(true);
      setIsLoading(false);
      return;
    }

    const loadProfileImage = async () => {
      // Se já tivermos uma URL em cache para este usuário e imagem, use-a
      const profileImage = user.profileImage || "";
      const cacheKey = `${user.id}-${profileImage}`;
      const cachedUrl = localStorage.getItem(`profile-image-${cacheKey}`);

      if (cachedUrl) {
        console.log("Usando URL em cache:", cachedUrl);
        setImageUrl(cachedUrl);
        setCachedImageUrl(cachedUrl);
        setImageError(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const imageUrl = buildProfileImageUrl(user.profileImage);
        setImageUrl(imageUrl);
        setImageError(false);
      } catch (error) {
        console.error("Erro ao carregar imagem de perfil:", error);
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileImage();
  }, [user.id, user.profileImage]);

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
      // Se não há imagem, ocorreu um erro ou não há URL, mostrar a inicial do nome
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

      // Limpar cache de URL antiga
      if (user.profileImage) {
        const oldCacheKey = `${user.id}-${user.profileImage}`;
        localStorage.removeItem(`profile-image-${oldCacheKey}`);
      }

      // Resetar estados
      setImageError(false);
      setImageUrl("");
      setCachedImageUrl(null);

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
