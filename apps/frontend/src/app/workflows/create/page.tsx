// src/app/workflows/create/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/ui/breadcrumb";
import WorkflowForm from "@/components/workflow/WorkflowForm";
import { WorkflowCreateDto } from "@/types/workflow";
import workflowService from "@/services/workflow";
import toastUtil from "@/utils/toast";

export default function CreateWorkflowPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<Partial<WorkflowCreateDto>>(
    {}
  );

  useEffect(() => {
    // Verificar se há templateId na URL
    const templateId = searchParams?.get("templateId");
    if (templateId) {
      setInitialData({ templateId });
    }
  }, [searchParams]);

  const handleSubmit = async (data: WorkflowCreateDto) => {
    try {
      setIsLoading(true);
      const workflow = await workflowService.createWorkflow(data);
      toastUtil.success("Fluxo de trabalho criado com sucesso!");
      router.push(`/workflows/${workflow.id}`);
    } catch (error) {
      console.error("Erro ao criar fluxo de trabalho:", error);
      toastUtil.error(
        "Não foi possível criar o fluxo de trabalho. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Breadcrumb
        items={[
          { label: "Fluxos de Trabalho", href: "/workflows" },
          { label: "Novo Fluxo" },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Criar Novo Fluxo</h1>
        <p className="text-gray-600">
          Inicie um novo fluxo de trabalho baseado em um template
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <WorkflowForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
