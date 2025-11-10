// apps/frontend/src/components/auth/DriveProtectedRoute.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
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
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Flags para controlar redirecionamentos
  const hasRedirected = useRef(false);
  const isRedirecting = useRef(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Evitar múltiplas execuções durante redirecionamento
      if (isRedirecting.current) {
        return;
      }

      // Se ainda está carregando autenticação, aguardar
      if (isLoading) {
        setIsCheckingPermissions(true);
        return;
      }

      // Se não está autenticado e ainda não redirecionou
      if (!isAuthenticated && !hasRedirected.current) {
        console.log(
          "[DriveProtectedRoute] Usuário não autenticado, redirecionando para login..."
        );
        hasRedirected.current = true;
        isRedirecting.current = true;

        const redirectUrl = `/drive/login?redirect=${encodeURIComponent(pathname)}`;

        setTimeout(() => {
          router.push(redirectUrl);
        }, 100);

        return;
      }

      // Se está autenticado, verificar permissões
      if (isAuthenticated) {
        // Verificar permissões se especificadas
        if (requiredPermissions.length > 0) {
          const hasRequiredPermissions = requiredPermissions.every(
            (permission) => checkPermission(permission)
          );

          if (!hasRequiredPermissions) {
            console.log("[DriveProtectedRoute] Permissões insuficientes");
            setPermissionError("access_denied");
            setHasPermission(false);
            setIsCheckingPermissions(false);
            return;
          }
        }

        // Verificar roles se especificadas
        if (requiredRoles.length > 0) {
          const hasRequiredRoles = hasAnyRole(requiredRoles);

          if (!hasRequiredRoles) {
            console.log("[DriveProtectedRoute] Roles insuficientes");
            setPermissionError("insufficient_role");
            setHasPermission(false);
            setIsCheckingPermissions(false);
            return;
          }
        }

        // Se passou em todas as verificações
        console.log("[DriveProtectedRoute] Acesso autorizado");
        setPermissionError(null);
        setHasPermission(true);
        setIsCheckingPermissions(false);
      }
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

  // Resetar flags quando mudar de rota ou autenticação
  useEffect(() => {
    return () => {
      hasRedirected.current = false;
      isRedirecting.current = false;
    };
  }, [pathname]);

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

  // Se não tem permissão, mostrar erro
  if (permissionError === "access_denied") {
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

  if (permissionError === "insufficient_role") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600 mb-4">
            Esta funcionalidade requer permissões especiais que você não possui.
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
