// src/app/workflows/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import WorkflowForm from "@/components/workflow/WorkflowForm";
import { WorkflowCreateDto, WorkflowDto } from "@/types/workflow";
import workflowService from "@/services/workflow";
import toastUtil from "@/utils/toast";
import Navbar from "@/components/layout/Navbar";

interface EditWorkflowPageProps {
  params: {
    id: string;
  };
}

export default function EditWorkflowPage({ params }: EditWorkflowPageProps) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        setIsLoading(true);
        const data = await workflowService.getWorkflowById(params.id);
        setWorkflow(data);
      } catch (err) {
        console.error("Erro ao carregar fluxo:", err);
        setError(
          "Não foi possível carregar o fluxo. Tente novamente mais tarde."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflow();
  }, [params.id]);

  const handleSubmit = async (data: WorkflowCreateDto) => {
    try {
      setIsSubmitting(true);
      await workflowService.updateWorkflow(params.id, data);
      toastUtil.success("Fluxo atualizado com sucesso!");
      router.push(`/workflows/${params.id}`);
    } catch (error) {
      console.error("Erro ao atualizar fluxo:", error);
      toastUtil.error("Não foi possível atualizar o fluxo. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatar dados do workflow para o formato esperado pelo formulário
  const getInitialData = (): Partial<WorkflowCreateDto> => {
    if (!workflow) return {};

    return {
      templateId: workflow.templateId,
      title: workflow.title,
      description: workflow.description,
      priority: workflow.priority,
      visibility: workflow.visibility,
      deadline: workflow.deadline,
      teamId: workflow.teamId,
      // Não incluímos assignToId na edição pois já existe uma etapa atual
    };
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-6 px-4">
          <Loading size="medium" message="Carregando fluxo..." />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-6 px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => router.back()}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
            Voltar
          </button>
        </div>
      </>
    );
  }

  if (!workflow) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-6 px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Fluxo não encontrado
          </div>
          <button
            onClick={() => router.push("/workflows")}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
            Voltar para Fluxos
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-6 px-4">
        <Breadcrumb
          items={[
            { label: "Fluxos de Trabalho", href: "/workflows" },
            { label: workflow.title, href: `/workflows/${params.id}` },
            { label: "Editar" },
          ]}
        />

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Editar Fluxo</h1>
          <p className="text-gray-600">
            Atualize as informações do fluxo de trabalho
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <WorkflowForm
            initialData={getInitialData()}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            isEditing={true}
          />
        </div>
      </div>
    </>
  );
}
