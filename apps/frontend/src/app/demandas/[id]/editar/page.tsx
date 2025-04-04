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
import { Demanda, DemandaUpdateDto } from "@/types/demanda";
import { UserDto } from "@/services/user";

interface DemandaEditPageProps {
  params: {
    id: string;
  };
}

export default function DemandaEditPage({ params }: DemandaEditPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = params;

  // Estados
  const [demanda, setDemanda] = useState<Demanda | null>(null);
  const [usuarios, setUsuarios] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar permissões do usuário
  const isAdmin = user?.roles.includes("ADMIN") || false;
  const isSupervisor = user?.roles.includes("SUPERVISOR") || false;
  const podeAtribuir = isAdmin || isSupervisor;

  // Carregar demanda existente
  const loadDemanda = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await demandaService.getDemandaById(id);
      setDemanda(data);

      // Verificar permissão para editar
      if (!canEdit(data)) {
        router.push(`/demandas/${id}`);
        toastUtil.error("Você não tem permissão para editar esta demanda.");
      }
    } catch (error) {
      console.error("Erro ao carregar demanda:", error);
      setError("Não foi possível carregar os detalhes da demanda.");
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar usuários para o formulário
  const loadUsuarios = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsuarios(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setError("Não foi possível carregar a lista de usuários.");
    }
  };

  // Verificar se o usuário pode editar esta demanda
  const canEdit = (demandaData: Demanda) => {
    if (!user) return false;

    // Admins e supervisores podem editar qualquer demanda
    if (isAdmin || isSupervisor) return true;

    // Criador pode editar sua própria demanda
    return demandaData.criadoPorId === user.id;
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (id) {
      loadDemanda();
      loadUsuarios();
    }
  }, [id, user]);

  // Lidar com envio do formulário
  const handleSubmit = async (formData: DemandaUpdateDto) => {
    try {
      setIsSubmitting(true);
      setError(null);

      await demandaService.updateDemanda(id, formData);
      toastUtil.success("Demanda atualizada com sucesso!");
      router.push(`/demandas/${id}`);
    } catch (error: any) {
      console.error("Erro ao atualizar demanda:", error);

      let errorMessage = "Não foi possível atualizar a demanda.";
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
        <Loading size="large" message="Carregando detalhes da demanda..." />
      </div>
    );
  }

  if (error || !demanda) {
    return (
      <div className="container py-8">
        <Alert variant="error" className="mb-6">
          <AlertDescription>
            {error || "Não foi possível carregar os detalhes da demanda."}
          </AlertDescription>
        </Alert>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Breadcrumb
        items={[
          { label: "Demandas", href: "/demandas" },
          { label: demanda.titulo, href: `/demandas/${id}` },
          { label: "Editar" },
        ]}
        showHome={true}
      />

      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="mr-3 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Editar Demanda</h1>
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
            demanda={demanda}
            usuarios={usuarios}
            isLoading={isSubmitting}
            editMode={true}
            podeAtribuir={podeAtribuir}
          />
        </div>
      </div>
    </div>
  );
}
