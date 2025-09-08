"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDriveAuth } from "@/context/DriveAuthContext";
import { DrivePermission } from "@/types/auth";
import { Loading } from "@/components/ui/loading";

interface DriveProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackUrl?: string;
  showUnauthorizedMessage?: boolean;
}

/**
 * Componente para proteger rotas do Drive
 */
export default function DriveProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackUrl = "/login",
  showUnauthorizedMessage = true,
}: DriveProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, hasAnyRole, checkPermission } =
    useDriveAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    // Se não autenticado, redireciona para o login
    if (!isAuthenticated || !user) {
      console.warn("Usuário não atenticado, redirecionando");
      router.push(fallbackUrl);
      return;
    }

    // Verifica se o usuário tem acesso básico ao Drive
    if (!user.isActive || !user.emailVerified || !user.adminApproved) {
      console.warn("Usuário não tem acesso ao Drive");
      router.push("/drive/unauthorized");
      return;
    }

    // Verifica roles necessárias
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      console.warn("Usuário não tem as roles necessárias:", requiredRoles);
      router.push("drive/forbidden");
    }

    // Verifica permissões necessárias
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        checkPermission(permission)
      );

      if (!hasAllPermissions) {
        console.warn(
          "Usuário não tem as permissões necessárias:",
          requiredPermissions
        );
        router.push("/drive/forbidden");
        return;
      }
    }
  }, [
    mounted,
    isLoading,
    isAuthenticated,
    user,
    requiredRoles,
    requiredPermissions,
    hasAnyRole,
    checkPermission,
    router,
    fallbackUrl,
  ]);

  // Loading
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loading size="large" />
          <p className="mt-4 text-gray-600">Validando acesso...</p>
        </div>
      </div>
    );
  }

  // Não autenticado
  if (!isAuthenticated || !user) {
    return null;
  }

  const hasBasicAccess =
    user.isActive && user.emailVerified && user.adminApproved;
  const hasRequiredRoles =
    requiredRoles.length === 0 || hasAnyRole(requiredRoles);
  const hasRequiredPermissions =
    requiredPermissions.length === 0 ||
    requiredPermissions.every((permission) => checkPermission(permission));

  if (!hasBasicAccess) {
    if (showUnauthorizedMessage) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Acesso Negado
              </h2>
              <p className="text-gray-600 mb-6">
                Sua conta não tem permissão para acessar o Drive. Entre em
                contato com o administrador.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                {!user.emailVerified && <p>• Email não verificado</p>}
                {!user.adminApproved && (
                  <p>• Conta não aprovada pelo administrador</p>
                )}
                {!user.isActive && <p>• Conta inativa</p>}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  if (!hasRequiredRoles) {
    if (showUnauthorizedMessage) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Permissão Insuficiente
              </h2>
              <p className="text-gray-600 mb-4">
                Você não tem as permissões necessárias para acessar esta página.
              </p>
              <p className="text-sm text-gray-500">
                Roles necessárias: {requiredRoles.join(", ")}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
