// src/app/profile/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/services/auth";
import { ProfileImageUpload } from "@/components/profile/ProfileImageUpload";
import { ProfileEdit } from "@/components/profile/ProfileEdit";
import { PasswordChange } from "@/components/profile/PasswordChange";
import { DeleteAccount } from "@/components/profile/DeleteAccount";
import profileService from "@/services/profile";
import toastUtil from "@/utils/toast";
import AccountStatus from "@/components/profile/AccountStatus";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserIcon,
  KeyIcon,
  LogOutIcon,
  SettingsIcon,
  HomeIcon,
  RefreshCw,
} from "lucide-react";

export default function ProfilePage() {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) return;

      setLoading(true);
      setError(null);

      try {
        const profile = await profileService.getCurrentProfile();
        setUser(profile);
      } catch (error: any) {
        console.error("Erro ao buscar perfil:", error);

        // Definir mensagem de erro mais específica quando possível
        if (error.response?.status === 500) {
          setError("Erro interno do servidor. A equipe foi notificada.");
        } else if (error.response?.status === 401) {
          setError("Sua sessão expirou. Por favor, faça login novamente.");
          // Opcional: redirecionar para login
          setTimeout(() => logout(), 2000);
        } else if (error.message === "Network Error") {
          setError(
            "Erro de conexão. Verifique sua internet e tente novamente."
          );
        } else {
          setError("Não foi possível carregar seu perfil. Tente novamente.");
        }

        // Fallback para usar dados do Auth como emergência
        if (authUser) {
          setUser(authUser);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [authUser, retryCount]);

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);

    // Atualizar também o usuário no AuthContext
    if (authUser) {
      const updatedAuthUser = { ...authUser, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(updatedAuthUser));
      toastUtil.success("Perfil atualizado com sucesso!");
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto text-center">
              <div className="text-red-500 mb-4">{error}</div>
              {user ? (
                <div className="text-gray-600 mb-4">
                  Carregamos suas informações básicas para que você possa
                  continuar.
                </div>
              ) : null}
              <button
                onClick={handleRetry}
                className="flex items-center mx-auto bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </button>
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
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {role.replace("ROLE_", "")}
                        </span>
                      ))
                    ) : (
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                        Usuário
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Tabs defaultValue={activeTab} className="w-full">
                <TabsList className="mb-6 flex space-x-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
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
              </Tabs>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto text-center">
              <p className="text-gray-600">
                Erro ao carregar informações do perfil.
              </p>
              <button
                onClick={handleRetry}
                className="mt-4 flex items-center mx-auto bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors">
                <RefreshCw className="mr-2 h-4 w-4" />
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
