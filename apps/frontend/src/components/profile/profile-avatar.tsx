// src/components/ui/profile-avatar.tsx
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProfileAvatarProps {
  profileImage?: string | null;
  userName: string;
  size?: number;
  className?: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  profileImage,
  userName,
  size = 40,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  // Função para construir a URL da imagem
  const buildImageUrl = (profileImage: string | null | undefined): string => {
    if (!profileImage) return "";

    // Se já for uma URL completa
    if (profileImage.startsWith("http")) return profileImage;

    // Se o caminho começa com "profiles/"
    if (profileImage.startsWith("profiles/")) {
      const fileName = profileImage.substring(
        profileImage.lastIndexOf("/") + 1
      );
      return `/api/profile-images/${fileName}`;
    }

    // Outros casos, usar o caminho como está com prefixo api
    return `/api/profile-images/${profileImage}`;
  };

  // Efeito para construir a URL da imagem
  useEffect(() => {
    const loadProfileImage = async () => {
      if (!profileImage) {
        setImageError(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const url = buildImageUrl(profileImage);
      setImageUrl(url);
      setIsLoading(false);
    };

    loadProfileImage();
  }, [profileImage]);

  const handleImageError = () => {
    setImageError(true);
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 rounded-full ${className}`}
        style={{ width: size, height: size }}>
        <Loader2 className="animate-spin text-gray-600" size={size * 0.5} />
      </div>
    );
  }

  if (!profileImage || imageError || !imageUrl) {
    // Usar um avatar baseado na inicial do nome
    return (
      <div
        className={`flex items-center justify-center bg-primary text-white rounded-full ${className}`}
        style={{ width: size, height: size }}>
        <span style={{ fontSize: size * 0.4 }}>
          {userName.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}>
      <img
        src={imageUrl}
        alt={`Foto de ${userName}`}
        className="w-full h-full object-cover"
        onError={handleImageError}
      />
    </div>
  );
};

export default ProfileAvatar;
