// src/app/workflows/status-templates/create/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/breadcrumb";
import StatusTemplateForm from "@/components/workflow/StatusTemplateForm";
import { WorkflowStatusTemplateCreateDto } from "@/types/workflow";
import workflowService from "@/services/workflow";
import toastUtil from "@/utils/toast";
import Navbar from "@/components/layout/Navbar";

export default function CreateStatusTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: WorkflowStatusTemplateCreateDto) => {
    try {
      setIsLoading(true);
      await workflowService.createStatusTemplate(data);
      toastUtil.success("Template de status criado com sucesso!");
      router.push("/workflows/status-templates");
    } catch (error) {
      console.error("Erro ao criar template de status:", error);
      toastUtil.error(
        "Não foi possível criar o template de status. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
            { label: "Novo Template" },
          ]}
        />

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Criar Novo Template de Status</h1>
          <p className="text-gray-600">
            Defina os status e suas propriedades para o novo template
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <StatusTemplateForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </>
  );
}
