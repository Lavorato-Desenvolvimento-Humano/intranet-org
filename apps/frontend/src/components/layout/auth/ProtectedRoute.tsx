// components/auth/ProtectedRoute.tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({
  children,
  requiredRoles = [],
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Verificar se o usuário está carregando
    if (!loading) {
      if (!user) {
        // Redirecionar para login com callback URL
        const pathname = window.location.pathname;
        window.location.href = `/auth/login?callback=${encodeURIComponent(pathname)}`;
      }
      // Verificar se o usuário tem as roles necessárias (se especificadas)
      else if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some((role) =>
          user.roles.includes(role)
        );

        if (!hasRequiredRole) {
          // Redirecionar para uma página de acesso negado
          window.location.href = "/unauthorized";
        }
      }
    }
  }, [user, loading, requiredRoles]);

  // Enquanto verifica o status do usuário, exibir um indicador de carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se o usuário não estiver autenticado ou não tiver as roles necessárias, não renderizar o conteúdo
  if (
    !user ||
    (requiredRoles.length > 0 &&
      !requiredRoles.some((role) => user.roles.includes(role)))
  ) {
    return null;
  }

  // Se o usuário estiver autenticado e tiver as roles necessárias, renderizar o conteúdo
  return <>{children}</>;
}
