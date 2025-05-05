"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Menu,
  ChevronDown,
  Book,
} from "lucide-react";
import { useRouter } from "next/navigation";
import adminService from "@/services/admin";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasAdminRole = user?.roles?.some(
    (role) => role === "ROLE_ADMIN" || role === "ADMIN"
  );

  const hasSupervisorRole = user?.roles?.some(
    (role) => role === "ROLE_SUPERVISOR" || role === "SUPERVISOR"
  );

  // Função para fechar o dropdown quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Função para lidar com o logout
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    router.replace("auth/login");
  };

  // Função auxiliar para navegação com router
  const handleNavigate = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(path);
    setDropdownOpen(false);
  };

  return (
    <nav className="bg-primary shadow-md text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Seção esquerda - Logo e Dropdown */}
          <div className="flex items-center space-x-4">
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

            {/* Dropdown de navegação */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center text-white hover:text-gray-200 focus:outline-none"
                onClick={() => setDropdownOpen(!dropdownOpen)}>
                {/* <span className="mr-1 font-medium">MENU</span> */}
                <ChevronDown size={16} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-10 mt-2 w-56 bg-white rounded-md shadow-lg py-1 text-gray-800">
                  <Link
                    href="/dashboard"
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                    onClick={handleNavigate("/dashboard")}>
                    <HomeIcon className="mr-2" size={16} />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/convenios"
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                    onClick={handleNavigate("/convenios")}>
                    <FileTextIcon className="mr-2" size={16} />
                    <span>Convênios</span>
                  </Link>

                  <Link
                    href="/tabelas-valores"
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                    onClick={handleNavigate("/tabelas-valores")}>
                    <Table className="mr-2" size={16} />
                    <span>Tabelas</span>
                  </Link>

                  {(hasSupervisorRole || hasAdminRole) && (
                    <Link
                      href="/equipes"
                      className="flex items-center px-4 py-2 hover:bg-gray-100"
                      onClick={handleNavigate("/equipes")}>
                      <Users className="mr-2" size={16} />
                      <span>Equipes</span>
                    </Link>
                  )}

                  {hasAdminRole && (
                    <Link
                      href="/admin"
                      className="flex items-center px-4 py-2 hover:bg-gray-100"
                      onClick={handleNavigate("/admin")}>
                      <SettingsIcon className="mr-2" size={16} />
                      <span>Painel Administrativo</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
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
