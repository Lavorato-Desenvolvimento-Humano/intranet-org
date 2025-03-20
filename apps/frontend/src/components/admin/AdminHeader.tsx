// components/admin/AdminHeader.tsx
import React from "react";
import Link from "next/link";
import { HomeIcon, LogOutIcon, UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Lavorato - Painel Administrativo</h1>
        <div className="flex items-center space-x-4">
          <Link
            href="/profile"
            className="flex items-center text-white hover:text-gray-200">
            <UserIcon className="mr-1" size={16} />
            <span>{user?.fullName || "Perfil"}</span>
          </Link>
          <Link
            href="/"
            className="flex items-center text-white hover:text-gray-200">
            <HomeIcon className="mr-1" size={16} />
            <span>Início</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center bg-white text-primary px-4 py-2 rounded hover:bg-gray-200 transition-colors">
            <LogOutIcon className="mr-1" size={16} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
