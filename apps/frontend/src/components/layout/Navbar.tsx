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
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const hasAdminRole = user?.roles?.some(
    (role) => role === "ROLE_ADMIN" || role === "ADMIN"
  );

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.svg"
                alt="Lavorato Saúde Integrada"
                width={130}
                height={40}
                className="mr-2"
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-primary flex items-center">
              <HomeIcon className="mr-1" size={18} />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/convenios"
              className="text-gray-700 hover:text-primary flex items-center">
              <FileTextIcon className="mr-1" size={18} />
              <span>Convênios</span>
            </Link>

            {hasAdminRole && (
              <Link
                href="/admin"
                className="text-gray-700 hover:text-primary flex items-center">
                <SettingsIcon className="mr-1" size={18} />
                <span>Painel Administrativo</span>
              </Link>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="text-gray-700 hover:text-primary flex items-center">
              <UserIcon className="mr-1" size={18} />
              <span className="hidden md:inline">
                {user?.fullName || "Perfil"}
              </span>
            </Link>

            <button
              onClick={logout}
              className="text-gray-700 hover:text-red-500 flex items-center">
              <LogOutIcon className="mr-1" size={18} />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
