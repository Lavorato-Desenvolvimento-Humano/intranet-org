// app/profile/page.tsx
"use client";

import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-primary-light text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Lavorato Saúde Integrada</h1>
            <button
              onClick={logout}
              className="bg-white text-primary-light px-4 py-2 rounded hover:bg-gray-200 transition-colors">
              Sair
            </button>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Meu Perfil
            </h2>

            {user && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">
                    {user.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user.fullName}</h3>
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                </div>

                <div className="mt-6 border-t pt-4">
                  <h4 className="text-lg font-semibold mb-2">Permissões</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {role.replace("ROLE_", "")}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t pt-4">
                  <h4 className="text-lg font-semibold mb-2">Opções</h4>
                  <div className="space-y-2">
                    <Link
                      href="#"
                      className="text-primary hover:underline block">
                      Alterar senha
                    </Link>
                    <Link
                      href="#"
                      className="text-primary hover:underline block">
                      Atualizar informações
                    </Link>
                  </div>
                </div>
              </div>
            )}
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
