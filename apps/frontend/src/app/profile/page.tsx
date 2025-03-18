"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/services/auth";
import { ProfileImageUpload } from "@/components/profile/ProfileImageUpload";
import { ProfileEdit } from "@/components/profile/ProfileEdit";
import { PasswordChange } from "@/components/profile/PasswordChange";
import { DeleteAccount } from "@/components/profile/DeleteAccount";
import profileService from "@/services/profile";
import toastUtil from "@/utils/toast";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserIcon,
  KeyIcon,
  LogOutIcon,
  SettingsIcon,
  HomeIcon,
} from "lucide-react";

// Componente de Tabs personalizado
const TabsUI: React.FC<{
  children: React.ReactNode;
  defaultValue?: string;
}> = ({ children, defaultValue = "personal" }) => {
  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      {children}
    </Tabs>
  );
};

export default function ProfilePage() {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) return;

      setLoading(true);
      try {
        const profile = await profileService.getCurrentProfile();
        setUser(profile);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        toastUtil.error("Não foi possível carregar seu perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [authUser]);

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);

    // Atualizar também o usuário no AuthContext
    if (authUser) {
      const updatedAuthUser = { ...authUser, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(updatedAuthUser));
      window.location.reload(); // Recarregar para atualizar o contexto
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-primary text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Lavorato Saúde Integrada</h1>
            <div className="flex items-center space-x-4">
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

        <main className="flex-grow container mx-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : user ? (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
                <div className="flex-shrink-0">
                  <ProfileImageUpload
                    user={user}
                    onImageUpdate={handleProfileUpdate}
                  />
                </div>
                <div className="flex-grow">
                  <h2 className="text-2xl font-bold mb-2 text-gray-800">
                    {user.fullName}
                  </h2>
                  <p className="text-gray-600 mb-2">{user.email}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {user.roles.map((role, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {role.replace("ROLE_", "")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <TabsUI defaultValue={activeTab}>
                <TabsList className="mb-6 flex space-x-2 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger
                    value="personal"
                    onClick={() => setActiveTab("personal")}
                    className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                      activeTab === "personal"
                        ? "bg-primary text-white"
                        : "hover:bg-gray-200"
                    }`}>
                    <UserIcon className="mr-2" size={16} />
                    Dados Pessoais
                  </TabsTrigger>
                  <TabsTrigger
                    value="password"
                    onClick={() => setActiveTab("password")}
                    className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                      activeTab === "password"
                        ? "bg-primary text-white"
                        : "hover:bg-gray-200"
                    }`}>
                    <KeyIcon className="mr-2" size={16} />
                    Alterar Senha
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    onClick={() => setActiveTab("settings")}
                    className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                      activeTab === "settings"
                        ? "bg-primary text-white"
                        : "hover:bg-gray-200"
                    }`}>
                    <SettingsIcon className="mr-2" size={16} />
                    Configurações
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Informações Pessoais
                    </h3>
                    <ProfileEdit
                      user={user}
                      onProfileUpdate={handleProfileUpdate}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="password" className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Alterar Senha
                    </h3>
                    <PasswordChange user={user} />
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Configurações da Conta
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Aqui você pode gerenciar configurações avançadas da sua
                      conta, incluindo opções de privacidade e exclusão de
                      conta.
                    </p>
                    <DeleteAccount user={user} />
                  </div>
                </TabsContent>
              </TabsUI>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto text-center">
              <p className="text-gray-600">
                Erro ao carregar informações do perfil.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors">
                Tentar novamente
              </button>
            </div>
          )}
        </main>

        <footer className="bg-gray-200 p-4 text-center text-gray-600">
          <p>
            &copy; {new Date().getFullYear()} Lavorato Saúde Integrada. Todos os
            direitos reservados.
          </p>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
