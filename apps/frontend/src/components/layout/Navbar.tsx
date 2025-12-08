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
  GitBranch,
  Bell,
  FileText,
  FileSignature,
  ChevronRight,
  BarChart3,
  FilePlus,
  HousePlus,
  TicketSlash,
  LaptopIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import NotificationPanel from "@/components/workflow/NotificationPanel";
import { set } from "date-fns";
import Home from "@/app/page";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [guiasSubmenuOpen, setGuiasSubmenuOpen] = useState(false);
  const [ticketsSubmenuOpen, setTicketsSubmenuOpen] = useState(false);
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
        setGuiasSubmenuOpen(false);
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
    e.stopPropagation();
    await logout();
    router.push("auth/login");
  };

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const toggleGuiasSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setGuiasSubmenuOpen(!guiasSubmenuOpen);
  };

  const toggleTicketsSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTicketsSubmenuOpen(!ticketsSubmenuOpen);
  };

  return (
    <nav className="bg-primary shadow-md text-white">
      <div className="container px-4">
        <div className="flex justify-between items-center h-16">
          {/* Seção esquerda - Logo e Dropdown */}
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center"
              onClick={(e: any) => {
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

            {/* Componente de Notificações */}
            <NotificationPanel />

            {/* Dropdown de navegação */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center text-white hover:text-gray-200 focus:outline-none"
                onClick={() => setDropdownOpen(!dropdownOpen)}>
                {/* <span className="mr-1 font-medium">MENU</span> */}
                <ChevronDown size={16} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-50 mt-2 w-56 bg-white rounded-md shadow-lg py-1 text-gray-800">
                  <Link
                    href="/dashboard"
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                    onClick={(e: any) => {
                      e.preventDefault();
                      navigateTo("/dashboard");
                    }}>
                    <HomeIcon className="mr-2" size={16} />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/convenios"
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                    onClick={(e: any) => {
                      e.preventDefault();
                      navigateTo("/convenios");
                    }}>
                    <FileTextIcon className="mr-2" size={16} />
                    <span>Convênios</span>
                  </Link>

                  <Link
                    href="/tabelas-valores"
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                    onClick={(e: any) => {
                      e.preventDefault();
                      navigateTo("/tabelas-valores");
                    }}>
                    <Table className="mr-2" size={16} />
                    <span>Tabelas</span>
                  </Link>

                  {/* Item Tickets com submenu */}
                  <div className="relative">
                    <button
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 text-left"
                      onClick={toggleTicketsSubmenu}>
                      <div className="flex items-center">
                        <HomeIcon className="mr-2" size={16} />
                        <span>Service Desk</span>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`transform transition-transform ${ticketsSubmenuOpen ? "rotate-90" : ""}`}
                      />
                    </button>

                    {/* Submenu Guias */}
                    {ticketsSubmenuOpen && (
                      <div className="ml-4 border-l border-gray-200">
                        <Link
                          href="/tickets"
                          className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
                          onClick={(e: any) => {
                            e.preventDefault();
                            navigateTo("/tickets");
                            setDropdownOpen(false);
                            setTicketsSubmenuOpen(false);
                          }}>
                          <LaptopIcon className="mr-3" size={14} />
                          <span>Tickets</span>
                        </Link>

                        <Link
                          href="/tickets/dashboard"
                          className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
                          onClick={(e: any) => {
                            e.preventDefault();
                            navigateTo("/tickets/dashboard");
                            setDropdownOpen(false);
                            setTicketsSubmenuOpen(false);
                          }}>
                          <HomeIcon className="mr-3" size={14} />
                          <span>Dashboard</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Item Guias com submenu */}
                  <div className="relative">
                    <button
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 text-left"
                      onClick={toggleGuiasSubmenu}>
                      <div className="flex items-center">
                        <Book className="mr-2" size={16} />
                        <span>Guias</span>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`transform transition-transform ${guiasSubmenuOpen ? "rotate-90" : ""}`}
                      />
                    </button>

                    {/* Submenu Guias */}
                    {guiasSubmenuOpen && (
                      <div className="ml-4 border-l border-gray-200">
                        <Link
                          href="/pacientes"
                          className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
                          onClick={(e: any) => {
                            e.preventDefault();
                            navigateTo("/pacientes");
                            setDropdownOpen(false);
                            setGuiasSubmenuOpen(false);
                          }}>
                          <Users className="mr-3" size={14} />
                          <span>Pacientes</span>
                        </Link>

                        <Link
                          href="/guias"
                          className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
                          onClick={(e: any) => {
                            e.preventDefault();
                            navigateTo("/guias");
                            setDropdownOpen(false);
                            setGuiasSubmenuOpen(false);
                          }}>
                          <FileText className="mr-3" size={14} />
                          <span>Guias</span>
                        </Link>

                        <Link
                          href="/fichas"
                          className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
                          onClick={(e: any) => {
                            e.preventDefault();
                            navigateTo("/fichas");
                            setDropdownOpen(false);
                            setGuiasSubmenuOpen(false);
                          }}>
                          <FileSignature className="mr-3" size={14} />
                          <span>Fichas</span>
                        </Link>

                        <Link
                          href="/relatorios"
                          className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
                          onClick={(e: any) => {
                            e.preventDefault();
                            navigateTo("/relatorios");
                            setDropdownOpen(false);
                            setGuiasSubmenuOpen(false);
                          }}>
                          <BarChart3 className="mr-3" size={14} />
                          <span>Relatórios</span>
                        </Link>

                        <Link
                          href="/fichas-pdf"
                          className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
                          onClick={(e: any) => {
                            e.preventDefault();
                            navigateTo("/fichas-pdf");
                            setDropdownOpen(false);
                            setGuiasSubmenuOpen(false);
                          }}>
                          <FilePlus className="mr-3" size={14} />
                          <span>Fichas PDF</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Adicionando o item de Fluxos de Trabalho */}
                  <Link
                    href="/workflows"
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                    onClick={(e: any) => {
                      e.preventDefault();
                      navigateTo("/workflows");
                    }}>
                    <GitBranch className="mr-2" size={16} />
                    <span>Fluxos de Trabalho</span>
                  </Link>

                  {(hasSupervisorRole || hasAdminRole) && (
                    <Link
                      href="/equipes"
                      className="flex items-center px-4 py-2 hover:bg-gray-100"
                      onClick={(e: any) => {
                        e.preventDefault();
                        navigateTo("/equipes");
                      }}>
                      <Users className="mr-2" size={16} />
                      <span>Equipes</span>
                    </Link>
                  )}

                  {hasAdminRole && (
                    <Link
                      href="/admin"
                      className="flex items-center px-4 py-2 hover:bg-gray-100"
                      onClick={(e: any) => {
                        e.preventDefault();
                        navigateTo("/admin");
                      }}>
                      <SettingsIcon className="mr-2" size={16} />
                      <span>Painel Administrativo</span>
                    </Link>
                  )}

                  <Link
                    href="http://56.124.35.86:8080/"
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                    onClick={(e: any) => {
                      e.preventDefault();
                      window.open("http://56.124.35.86:8080/", "_blank");
                    }}>
                    <HousePlus className="mr-2" size={16} />
                    <span>Hipo Saúde</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="text-white hover:text-gray-200 flex items-center"
              onClick={(e: any) => {
                e.preventDefault();
                navigateTo("/profile");
              }}>
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
