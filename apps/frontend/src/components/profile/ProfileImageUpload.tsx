import React, { useState, useRef } from "react";
import Image from "next/image";
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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toastUtil.error(
        "Por favor, selecione uma imagem válida (JPEG, PNG ou GIF)"
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
    try {
      const updatedUser = await profileService.updateProfileImage(
        user.id,
        file
      );
      onImageUpdate(updatedUser);
      toastUtil.success("Imagem de perfil atualizada com sucesso!");
    } catch (error) {
      toastUtil.error("Erro ao atualizar imagem de perfil");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <div
        onClick={handleImageClick}
        className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600 relative cursor-pointer overflow-hidden hover:opacity-80 transition-opacity">
        {user.profileImage ? (
          <Image
            src={
              user.profileImage.startsWith("http")
                ? user.profileImage
                : `${process.env.NEXT_PUBLIC_API_URL || ""}/uploads/images/${user.profileImage}`
            }
            alt={user.fullName}
            layout="fill"
            objectFit="cover"
          />
        ) : (
          <span>{user.fullName.charAt(0)}</span>
        )}
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
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFileChange}
      />
    </div>
  );
};
