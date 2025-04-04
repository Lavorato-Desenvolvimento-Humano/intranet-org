"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import DemandaForm from "@/components/ui/demanda-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import toastUtil from "@/utils/toast";
import demandaService from "@/services/demanda";
import userService from "@/services/user";
import { DemandaCreateDto } from "@/types/demanda";
import { UserDto } from "@/services/user";

export default function DemandaCreatePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Estados
  const [usuarios, setUsuarios] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar permissões do usuário
  const isAdmin = user?.roles.includes("ADMIN") || false;
  const isSupervisor = user?.roles.includes("SUPERVISOR") || false;
  const podeAtribuir = isAdmin || isSupervisor || true; // Por padrão, qualquer um pode atribuir

  // Carregar usuários para o formulário
  const loadUsuarios = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getAllUsers();
      setUsuarios(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setError("Não foi possível carregar a lista de usuários.");
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadUsuarios();
  }, []);

  // Lidar com envio do formulário
  const handleSubmit = async (demanda: DemandaCreateDto) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Se o usuário não tem permissão para atribuir a outros, usar o ID do próprio usuário
      if (!podeAtribuir && user) {
        demanda.atribuidoParaId = user.id;
      }

      await demandaService.createDemanda(demanda);
      toastUtil.success("Demanda criada com sucesso!");
      router.push("/demandas");
    } catch (error: any) {
      console.error("Erro ao criar demanda:", error);

      let errorMessage = "Não foi possível criar a demanda.";
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
      toastUtil.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Voltar para a página anterior
  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <Loading size="large" message="Carregando..." />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Breadcrumb
        items={[
          { label: "Demandas", href: "/demandas" },
          { label: "Nova Demanda" },
        ]}
        showHome={true}
      />

      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="mr-3 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Nova Demanda</h1>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <DemandaForm
            onSubmit={handleSubmit}
            usuarios={usuarios}
            isLoading={isSubmitting}
            podeAtribuir={podeAtribuir}
          />
        </div>
      </div>
    </div>
  );
}
