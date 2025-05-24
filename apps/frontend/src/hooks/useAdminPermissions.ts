// src/hooks/useAdminPermissions.ts
import { useAuth } from "@/context/AuthContext";

export const useAdminPermissions = () => {
  const { user } = useAuth();

  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");

  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");

  const isSupervisor =
    user?.roles?.includes("ROLE_SUPERVISOR") ||
    user?.roles?.includes("SUPERVISOR");

  const canViewAllPostagens = isAdmin;
  const canCreatePostagem = isAdmin || isEditor;
  const canManageUsers = isAdmin;
  const canManageSystem = isAdmin;

  return {
    isAdmin,
    isEditor,
    isSupervisor,
    canViewAllPostagens,
    canCreatePostagem,
    canManageUsers,
    canManageSystem,
    hasAnyAdminRole: isAdmin || isEditor || isSupervisor,
  };
};
