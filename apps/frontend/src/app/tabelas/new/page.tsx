// src/app/tabelas/new/page.tsx
"use client";

import React from "react";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import TabelaForm from "@/components/tabelas/TabelaForm";

export default function NewTabelaPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
              Nova Tabela de Valores
            </h1>

            <TabelaForm />
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
