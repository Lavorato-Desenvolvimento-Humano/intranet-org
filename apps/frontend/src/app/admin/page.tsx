"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminRolesTab from "@/components/admin/AdminRolesTab";
import AdminPermissionsTab from "@/components/admin/AdminPermissionsTab";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AdminHeader />

        <main className="flex-grow container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
              Painel Administrativo
            </h1>

            <Tabs defaultValue={activeTab} className="w-full">
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
                  value="roles"
                  onClick={() => setActiveTab("roles")}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    activeTab === "roles"
                      ? "bg-primary text-white"
                      : "hover:bg-gray-200"
                  }`}>
                  Cargos (Roles)
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
              </TabsList>

              <TabsContent value="users">
                <AdminUsersTab />
              </TabsContent>

              <TabsContent value="roles">
                <AdminRolesTab />
              </TabsContent>

              <TabsContent value="permissions">
                <AdminPermissionsTab />
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
