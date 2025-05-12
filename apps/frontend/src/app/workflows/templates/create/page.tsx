// src/app/workflows/templates/create/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/breadcrumb";
import TemplateForm from "@/components/workflow/TemplateForm";
import { WorkflowTemplateCreateDto } from "@/types/workflow";
import workflowService from "@/services/workflow";
import toastUtil from "@/utils/toast";

export default function CreateTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: WorkflowTemplateCreateDto) => {
    try {
      setIsLoading(true);
      await workflowService.createTemplate(data);
      toastUtil.success("Template criado com sucesso!");
      router.push("/workflows/templates");
    } catch (error) {
      console.error("Erro ao criar template:", error);
      toastUtil.error("Não foi possível criar o template. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Breadcrumb
        items={[
          { label: "Fluxos de Trabalho", href: "/workflows" },
          { label: "Templates", href: "/workflows/templates" },
          { label: "Novo Template" },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Criar Novo Template</h1>
        <p className="text-gray-600">
          Defina as etapas e propriedades do novo template de fluxo
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <TemplateForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
