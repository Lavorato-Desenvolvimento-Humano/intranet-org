// src/components/layout/Navbar.tsx
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const hasAdminRole = user?.roles?.some(
    (role) => role === "ROLE_ADMIN" || role === "ADMIN"
  );

  // Função de navegação programática como fallback
  const navigateTo = (path: string) => {
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
              onClick={(e: { preventDefault: () => void }) => {
                e.preventDefault();
                navigateTo("/");
              }}>
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
              onClick={(e: { preventDefault: () => void }) => {
                e.preventDefault();
                navigateTo("/dashboard");
              }}>
              <HomeIcon className="mr-1" size={18} />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/convenios"
              className="text-white hover:text-gray-200 flex items-center"
              onClick={(e: { preventDefault: () => void }) => {
                e.preventDefault();
                navigateTo("/convenios");
              }}>
              <FileTextIcon className="mr-1" size={18} />
              <span>Convênios</span>
            </Link>

            <Link
              href="/tabelas-valores"
              className="text-white hover:text-gray-200 flex items-center"
              onClick={(e: { preventDefault: () => void }) => {
                e.preventDefault();
                navigateTo("/tabelas-valores");
              }}>
              <Table className="mr-1" size={18} />
              <span>Tabelas</span>
            </Link>

            {hasAdminRole && (
              <Link
                href="/admin"
                className="text-white hover:text-gray-200 flex items-center"
                onClick={(e: { preventDefault: () => void }) => {
                  e.preventDefault();
                  navigateTo("/admin");
                }}>
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
              onClick={(e: { preventDefault: () => void }) => {
                e.preventDefault();
                navigateTo("/profile");
              }}>
              <UserIcon className="mr-1" size={18} />
              <span className="hidden md:inline">
                {user?.fullName || "Perfil"}
              </span>
            </Link>

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
