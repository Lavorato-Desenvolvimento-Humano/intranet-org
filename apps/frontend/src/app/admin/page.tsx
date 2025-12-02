// src/app/admin/page.tsx - Versão corrigida
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminRolesTab from "@/components/admin/AdminRolesTab";
import AdminPermissionsTab from "@/components/admin/AdminPermissionsTab";
import AdminPendingUsersTab from "@/components/admin/AdminPendingUsersTab";
import { AlertTriangle, RefreshCw, Settings, Plus } from "lucide-react";
import { CustomButton } from "@/components/ui/custom-button";
import { useAuth } from "@/context/AuthContext";
import toastUtil from "@/utils/toast";
import AdminStatusTab from "@/components/admin/AdminStatusTab";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("users");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user, logout } = useAuth();

  useEffect(() => {
    // Verificar se o usuário tem a role de ADMIN
    const isAdmin = user?.roles?.some(
      (role) => role === "ROLE_ADMIN" || role === "ADMIN"
    );

    if (!isAdmin) {
      setError(
        "Você não tem permissões de administrador para acessar esta página"
      );
    } else {
      setError(null);
    }
  }, [user]);

  // Função para forçar o recarregamento da pagina
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    window.location.reload();
  };

  // Função para tentar reautenticar o usuário
  const handleReauth = () => {
    logout();
    toastUtil.info("Por favor, faça login novamente para continuar.");
    window.location.href = "/auth/login?callback=/admin";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex items-center text-red-500 mb-4">
            <AlertTriangle className="mr-2" />
            <h2 className="text-xl font-bold">Erro de Acesso</h2>
          </div>

          <p className="mb-6 text-gray-700">{error}</p>

          <div className="flex flex-col gap-3">
            <CustomButton onClick={handleRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </CustomButton>

            <CustomButton
              onClick={handleReauth}
              variant="primary"
              className="w-full border border-gray-300">
              Fazer login novamente
            </CustomButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
              Painel Administrativo
            </h1>

            <Tabs defaultValue={activeTab} className="w-full" key={retryCount}>
              <TabsList className="mb-6 flex space-x-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                <TabsTrigger
                  value="users"
                  onClick={() => setActiveTab("users")}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    activeTab === "users"
                      ? "bg-primary text-white"
                      : "hover:bg-gray-200"
                  }`}>
                  Usuários
                </TabsTrigger>

                <TabsTrigger
                  value="pending"
                  onClick={() => setActiveTab("pending")}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    activeTab === "pending"
                      ? "bg-primary text-white"
                      : "hover:bg-gray-200"
                  }`}>
                  Pendentes
                </TabsTrigger>

                <TabsTrigger
                  value="roles"
                  onClick={() => setActiveTab("roles")}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    activeTab === "roles"
                      ? "bg-primary text-white"
                      : "hover:bg-gray-200"
                  }`}>
                  Cargos
                </TabsTrigger>

                <TabsTrigger
                  value="permissions"
                  onClick={() => setActiveTab("permissions")}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    activeTab === "permissions"
                      ? "bg-primary text-white"
                      : "hover:bg-gray-200"
                  }`}>
                  Permissões
                </TabsTrigger>

                <TabsTrigger
                  value="status"
                  onClick={() => setActiveTab("status")}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    activeTab === "status"
                      ? "bg-primary text-white"
                      : "hover:bg-gray-200"
                  }`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Status
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <AdminUsersTab key={`users-${retryCount}`} />
              </TabsContent>

              <TabsContent value="pending">
                <AdminPendingUsersTab key={`pending-${retryCount}`} />
              </TabsContent>

              <TabsContent value="roles">
                <AdminRolesTab key={`roles-${retryCount}`} />
              </TabsContent>

              <TabsContent value="permissions">
                <AdminPermissionsTab key={`permissions-${retryCount}`} />
              </TabsContent>

              <TabsContent value="status">
                <AdminStatusTab key={`status-${retryCount}`} />
              </TabsContent>
            </Tabs>
          </div>
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
