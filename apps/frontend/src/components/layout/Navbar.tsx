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
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const hasAdminRole = user?.roles?.some(
    (role) => role === "ROLE_ADMIN" || role === "ADMIN"
  );

  // Função para lidar com o logout
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    router.replace("/login");
  };

  // Função auxiliar para navegação com router
  const handleNavigate = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(path);
  };

  return (
    <nav className="bg-primary shadow-md text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Brand */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center"
              onClick={handleNavigate("/")}>
              <Image
                src="/logo_branca.png"
                alt="Lavorato Saúde Integrada"
                width={53}
                height={53}
                className="mr-2"
                style={{ objectFit: "contain" }}
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="text-white hover:text-gray-200 flex items-center"
              onClick={handleNavigate("/dashboard")}>
              <HomeIcon className="mr-1" size={18} />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/convenios"
              className="text-white hover:text-gray-200 flex items-center"
              onClick={handleNavigate("/convenios")}>
              <FileTextIcon className="mr-1" size={18} />
              <span>Convênios</span>
            </Link>

            <Link
              href="/tabelas-valores"
              className="text-white hover:text-gray-200 flex items-center"
              onClick={handleNavigate("/tabelas-valores")}>
              <Table className="mr-1" size={18} />
              <span>Tabelas</span>
            </Link>

            <Link
              href="/equipes"
              className="text-white hover:text-gray-200 flex items-center"
              onClick={handleNavigate("/equipes")}>
              <Users className="mr-1" size={18} />
              <span>Equipes</span>
            </Link>

            {hasAdminRole && (
              <Link
                href="/admin"
                className="text-white hover:text-gray-200 flex items-center"
                onClick={handleNavigate("/admin")}>
                <SettingsIcon className="mr-1" size={18} />
                <span>Painel Administrativo</span>
              </Link>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="text-white hover:text-gray-200 flex items-center"
              onClick={handleNavigate("/profile")}>
              <UserIcon className="mr-1" size={18} />
              <span className="hidden md:inline">
                {user?.fullName || "Perfil"}
              </span>
            </Link>

            <button
              onClick={handleLogout}
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
