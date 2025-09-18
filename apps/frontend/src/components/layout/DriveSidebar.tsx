"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  FolderOpen,
  Upload,
  Share2,
  Clock,
  Trash2,
  Star,
  Users,
  PieChart,
  Shield,
  Archive,
} from "lucide-react";
// import { useDrivePermissions } from "@/components/auth/DriveProtectedRoute";
import { useDriveAuth } from "@/context/DriveAuthContext";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  badge?: string | number;
}

export default function DriveSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useDriveAuth();
  //   const {
  //     canRead,
  //     canWrite,
  //     canAdmin,
  //     canViewAudit,
  //     isAdmin,
  //     isSupervisor,
  //     isManager,
  //   } = useDrivePermissions();

  const sidebarItems: SidebarItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      href: "/drive",
    },
    {
      id: "my-files",
      label: "Meus Arquivos",
      icon: FolderOpen,
      href: "/drive/files",
    },
    {
      id: "shared",
      label: "Compartilhados",
      icon: Share2,
      href: "/drive/shared",
    },
    {
      id: "recent",
      label: "Recentes",
      icon: Clock,
      href: "/drive/recent",
    },
    {
      id: "starred",
      label: "Favoritos",
      icon: Star,
      href: "/drive/starred",
    },
    {
      id: "teams",
      label: "Equipes",
      icon: Users,
      href: "/drive/teams",
      requiredRoles: ["SUPERVISOR", "GERENTE", "ADMIN"],
    },
    {
      id: "analytics",
      label: "Relatórios",
      icon: PieChart,
      href: "/drive/analytics",
      requiredRoles: ["SUPERVISOR", "GERENTE", "ADMIN"],
    },
    {
      id: "permissions",
      label: "Permissões",
      icon: Shield,
      href: "/drive/permissions",
      requiredRoles: ["GERENTE", "ADMIN"],
    },
    {
      id: "audit",
      label: "Auditoria",
      icon: Archive,
      href: "/drive/audit",
      requiredRoles: ["ADMIN"],
    },
    {
      id: "trash",
      label: "Lixeira",
      icon: Trash2,
      href: "/drive/trash",
    },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const isItemVisible = (item: SidebarItem): boolean => {
    // Verificar roles necessárias
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      const hasRequiredRole = item.requiredRoles.some((role) =>
        user?.roles?.some((userRole) =>
          userRole.toUpperCase().includes(role.toUpperCase())
        )
      );
      if (!hasRequiredRole) return false;
    }

    // Verificar permissões necessárias
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      // Implementar verificação de permissões específicas quando necessário
    }

    return true;
  };

  const isItemActive = (href: string): boolean => {
    if (href === "/drive") {
      return pathname === "/drive";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          {/* Upload button */}
          {/* {canWrite && (
            <button
              onClick={() => router.push("/drive/upload")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </button>
          )} */}
        </div>

        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {sidebarItems.filter(isItemVisible).map((item) => {
              const isActive = isItemActive(item.href);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                      w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                      ${
                        isActive
                          ? "bg-blue-100 text-blue-900 border-r-2 border-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}>
                  <item.icon
                    className={`
                        mr-3 flex-shrink-0 h-5 w-5
                        ${
                          isActive
                            ? "text-blue-600"
                            : "text-gray-400 group-hover:text-gray-500"
                        }
                      `}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="ml-3 inline-block py-0.5 px-2 text-xs bg-gray-100 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Informações do usuário no rodapé */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <p className="font-medium">{user?.name}</p>
              <p>{user?.email}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {user?.roles?.map((role, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {role.replace("ROLE_", "")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
