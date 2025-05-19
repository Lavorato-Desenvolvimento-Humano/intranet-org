// src/app/workflows/status-templates/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import StatusTemplateForm from "@/components/workflow/StatusTemplateForm";
import {
  WorkflowStatusTemplateDto,
  WorkflowStatusTemplateCreateDto,
} from "@/types/workflow";
import workflowService from "@/services/workflow";
import toastUtil from "@/utils/toast";
import Navbar from "@/components/layout/Navbar";

interface EditStatusTemplatePageProps {
  params: {
    id: string;
  };
}

export default function EditStatusTemplatePage({
  params,
}: EditStatusTemplatePageProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<WorkflowStatusTemplateDto | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setIsLoading(true);
        const data = await workflowService.getStatusTemplateById(params.id);
        setTemplate(data);
      } catch (err) {
        console.error("Erro ao carregar template de status:", err);
        setError(
          "Não foi possível carregar o template de status. Tente novamente mais tarde."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [params.id]);

  const handleSubmit = async (data: WorkflowStatusTemplateCreateDto) => {
    try {
      setIsSubmitting(true);
      await workflowService.updateStatusTemplate(params.id, data);
      toastUtil.success("Template de status atualizado com sucesso!");
      router.push(`/workflows/status-templates/${params.id}`);
    } catch (error) {
      console.error("Erro ao atualizar template de status:", error);
      toastUtil.error(
        "Não foi possível atualizar o template. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatar dados do template para o formato esperado pelo formulário
  const getInitialData = (): WorkflowStatusTemplateCreateDto => {
    if (!template)
      return {
        name: "",
        description: "",
        isDefault: false,
        statusItems: [],
      };

    return {
      name: template.name,
      description: template.description,
      isDefault: template.isDefault,
      statusItems: template.statusItems.map((item) => ({
        name: item.name,
        description: item.description,
        color: item.color,
        orderIndex: item.orderIndex,
        isInitial: item.isInitial,
        isFinal: item.isFinal,
      })),
    };
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-6 px-4">
          <Loading size="medium" message="Carregando template de status..." />
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

  if (!template) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-6 px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Template de status não encontrado
          </div>
          <button
            onClick={() => router.push("/workflows/status-templates")}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark">
            Voltar para Templates
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
            {
              label: "Templates de Status",
              href: "/workflows/status-templates",
            },
            {
              label: template.name,
              href: `/workflows/status-templates/${params.id}`,
            },
            { label: "Editar" },
          ]}
        />

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Editar Template de Status</h1>
          <p className="text-gray-600">
            Atualize as informações e os status do template
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <StatusTemplateForm
            initialData={getInitialData()}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    </>
  );
}
