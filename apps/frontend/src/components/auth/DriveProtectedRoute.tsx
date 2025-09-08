"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDriveAuth } from "@/context/DriveAuthContext";
import { Loading } from "@/components/ui/loading";
import { AlertCircle, HardDrive } from "lucide-react";
import { DrivePermission } from "@/types/auth";

interface DriveProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: DrivePermission[];
  requiredRoles?: string[];
  fallbackComponent?: React.ReactNode;
}

/**
 * Componente para proteger rotas do Drive
 * Implementa RF01.1 - Integração com Sistema Existente
 * Implementa RF01.2 - Controle de Acesso Granular
 */
export default function DriveProtectedRoute({
  children,
  requiredPermissions = [DrivePermission.READ],
  requiredRoles = [],
  fallbackComponent,
}: DriveProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, checkPermission, hasAnyRole } =
    useDriveAuth();
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      setIsCheckingPermissions(true);

      // Se ainda está carregando, aguardar
      if (isLoading) {
        return;
      }

      // Se não está autenticado, redirecionar para login
      if (!isAuthenticated) {
        const redirectUrl = `/drive/login?redirect=${encodeURIComponent(pathname)}`;
        router.push(redirectUrl);
        return;
      }

      // Verificar permissões se especificadas
      if (requiredPermissions.length > 0) {
        const hasRequiredPermissions = requiredPermissions.every((permission) =>
          checkPermission(permission)
        );

        if (!hasRequiredPermissions) {
          const redirectUrl = `/drive/login?message=access_denied&redirect=${encodeURIComponent(pathname)}`;
          router.push(redirectUrl);
          return;
        }
      }

      // Verificar roles se especificadas
      if (requiredRoles.length > 0) {
        const hasRequiredRoles = hasAnyRole(requiredRoles);

        if (!hasRequiredRoles) {
          const redirectUrl = `/drive/login?message=access_denied&redirect=${encodeURIComponent(pathname)}`;
          router.push(redirectUrl);
          return;
        }
      }

      setIsCheckingPermissions(false);
    };

    checkAccess();
  }, [
    isAuthenticated,
    isLoading,
    user,
    pathname,
    router,
    requiredPermissions,
    requiredRoles,
    checkPermission,
    hasAnyRole,
  ]);

  // Loading state durante verificação de autenticação
  if (isLoading || isCheckingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loading message="Verificando permissões..." />
        </div>
      </div>
    );
  }

  // Se não está autenticado, mostrar fallback ou loading
  if (!isAuthenticated) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <HardDrive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  // Verificar permissões
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every((permission) =>
      checkPermission(permission)
    );

    if (!hasRequiredPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-600 mb-4">
              Você não tem permissão para acessar esta página do Drive.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/drive")}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                Voltar ao Drive
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors">
                Ir para Início
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Verificar roles
  if (requiredRoles.length > 0) {
    const hasRequiredRoles = hasAnyRole(requiredRoles);

    if (!hasRequiredRoles) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acesso Restrito
            </h2>
            <p className="text-gray-600 mb-4">
              Esta funcionalidade requer permissões especiais que você não
              possui.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/drive")}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                Voltar ao Drive
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Se passou por todas as verificações, renderizar o conteúdo
  return <>{children}</>;
}

/**
 * Hook para usar permissões do Drive em componentes
 */
export function useDrivePermissions() {
  const { user, checkPermission, hasRole, hasAnyRole } = useDriveAuth();

  return {
    user,
    isAdmin: hasRole("ADMIN"),
    isSupervisor: hasRole("SUPERVISOR"),
    isManager: hasRole("GERENTE"),
    canRead: checkPermission(DrivePermission.READ),
    canWrite: checkPermission(DrivePermission.WRITE),
    canDelete: checkPermission(DrivePermission.DELETE),
    canShare: checkPermission(DrivePermission.SHARE),
    canUpload: checkPermission(DrivePermission.UPLOAD),
    canDownload: checkPermission(DrivePermission.DOWNLOAD),
    canCreateFolder: checkPermission(DrivePermission.CREATE_FOLDER),
    canManagePermissions: checkPermission(DrivePermission.MANAGE_PERMISSIONS),
    canViewAudit: checkPermission(DrivePermission.VIEW_AUDIT),
    checkPermission,
    hasRole,
    hasAnyRole,
  };
}
