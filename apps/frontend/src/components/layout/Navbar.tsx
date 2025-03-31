// Ajuste para o Navbar.tsx, se necessário
"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import {
  HomeIcon,
  FileTextIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  Table,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const hasAdminRole = user?.roles?.some(
    (role) => role === "ROLE_ADMIN" || role === "ADMIN"
  );

  // Função de navegação para garantir que os links funcionem
  const navigate = (path: string) => {
    router.push(path);
  };

  return (
    <nav className="bg-primary shadow-md text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Brand */}
          <div className="flex items-center">
            <div
              onClick={() => navigate("/")}
              className="flex items-center cursor-pointer">
              <Image
                src="/logo_branca.png"
                alt="Lavorato Saúde Integrada"
                width={53}
                height={53}
                className="mr-2"
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <div
              onClick={() => navigate("/dashboard")}
              className="text-white hover:text-gray-200 flex items-center cursor-pointer">
              <HomeIcon className="mr-1" size={18} />
              <span>Dashboard</span>
            </div>

            <div
              onClick={() => navigate("/convenios")}
              className="text-white hover:text-gray-200 flex items-center cursor-pointer">
              <FileTextIcon className="mr-1" size={18} />
              <span>Convênios</span>
            </div>

            <div
              onClick={() => navigate("/tabelas-valores")}
              className="text-white hover:text-gray-200 flex items-center cursor-pointer">
              <Table className="mr-1" size={18} />
              <span>Tabelas</span>
            </div>

            {hasAdminRole && (
              <div
                onClick={() => navigate("/admin")}
                className="text-white hover:text-gray-200 flex items-center cursor-pointer">
                <SettingsIcon className="mr-1" size={18} />
                <span>Painel Administrativo</span>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <div
              onClick={() => navigate("/profile")}
              className="text-white hover:text-gray-200 flex items-center cursor-pointer">
              <UserIcon className="mr-1" size={18} />
              <span className="hidden md:inline">
                {user?.fullName || "Perfil"}
              </span>
            </div>

            <button
              onClick={logout}
              className="text-white hover:text-gray-200 flex items-center">
              <LogOutIcon className="mr-1" size={18} />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
