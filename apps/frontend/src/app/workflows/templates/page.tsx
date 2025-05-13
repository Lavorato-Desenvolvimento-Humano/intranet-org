// src/app/workflows/templates/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, FolderPlus } from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { CustomButton } from "@/components/ui/custom-button";
import TemplateCard from "@/components/workflow/TemplateCard";
import { Loading } from "@/components/ui/loading";
import workflowService from "@/services/workflow";
import { WorkflowTemplateDto } from "@/types/workflow";
import Navbar from "@/components/layout/Navbar";

export default function WorkflowTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkflowTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await workflowService.getAllTemplates(page, 12);
      setTemplates(response.content || []);
      setTotalPages(Math.ceil((response.totalElements || 0) / 12));
    } catch (err) {
      console.error("Erro ao carregar templates:", err);
      setError(
        "Não foi possível carregar os templates. Tente novamente mais tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [page]);

  const handleCreateTemplate = () => {
    router.push("/workflows/templates/create");
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-6 px-4">
        <Navbar />
        <Breadcrumb
          items={[
            { label: "Fluxos de Trabalho", href: "/workflows" },
            { label: "Templates" },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Templates de Fluxo</h1>
            <p className="text-gray-600">
              Gerencie os modelos de fluxos de trabalho que serão utilizados
              pela equipe
            </p>
          </div>

          <CustomButton
            variant="primary"
            icon={Plus}
            onClick={handleCreateTemplate}>
            Novo Template
          </CustomButton>
        </div>

        {loading ? (
          <Loading size="medium" message="Carregando templates..." />
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Crie seu primeiro template de fluxo de trabalho para começar
            </p>
            <CustomButton
              variant="primary"
              icon={FolderPlus}
              onClick={handleCreateTemplate}>
              Criar Primeiro Template
            </CustomButton>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className={`px-4 py-2 rounded ${
                  page === 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}>
                Anterior
              </button>

              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPage(index)}
                  className={`px-4 py-2 rounded ${
                    page === index
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}>
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className={`px-4 py-2 rounded ${
                  page === totalPages - 1
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}>
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
