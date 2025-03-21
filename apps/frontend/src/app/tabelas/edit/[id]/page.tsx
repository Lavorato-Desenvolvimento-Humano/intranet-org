// src/app/tabelas/edit/[id]/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import Header from "@/components/layout/header";
import TabelaForm from "@/components/tabelas/TabelaForm";

export default function EditTabelaPage() {
  const params = useParams();
  const postagemId = params.id as string;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <main className="flex-grow container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
              Editar Tabela de Valores
            </h1>

            <TabelaForm postagemId={postagemId} isEditing={true} />
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
