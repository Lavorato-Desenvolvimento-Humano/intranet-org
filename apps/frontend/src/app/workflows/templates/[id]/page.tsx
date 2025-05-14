// src/app/workflows/templates/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/breadcrumb";
import { CustomButton } from "@/components/ui/custom-button";
import { Loading } from "@/components/ui/loading";
import TemplateForm from "@/components/workflow/TemplateForm";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  Edit,
  Trash2,
  ArrowLeft,
  Eye,
  EyeOff,
  Users,
  Play,
} from "lucide-react";
import {
  WorkflowTemplateDto,
  WorkflowTemplateCreateDto,
} from "@/types/workflow";
import workflowService from "@/services/workflow";
import toastUtil from "@/utils/toast";
import Navbar from "@/components/layout/Navbar";

interface TemplatePageProps {
  params: {
    id: string;
  };
}

export default function TemplatePage({ params }: TemplatePageProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<WorkflowTemplateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUseTemplateDialog, setShowUseTemplateDialog] = useState(false);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getTemplateById(params.id);
      setTemplate(data);
    } catch (err) {
      console.error("Erro ao carregar template:", err);
      setError(
        "Não foi possível carregar o template. Tente novamente mais tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [params.id]);

  const handleUpdate = async (data: WorkflowTemplateCreateDto) => {
    try {
      setIsSubmitting(true);
      await workflowService.updateTemplate(params.id, data);
      toastUtil.success("Template atualizado com sucesso!");
      setIsEditing(false);
      fetchTemplate();
    } catch (error) {
      console.error("Erro ao atualizar template:", error);
      toastUtil.error(
        "Não foi possível atualizar o template. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await workflowService.deleteTemplate(params.id);
      toastUtil.success("Template excluído com sucesso!");
      router.push("/workflows/templates");
    } catch (error) {
      console.error("Erro ao excluir template:", error);
      toastUtil.error("Não foi possível excluir o template. Tente novamente.");
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleUseTemplate = () => {
    router.push(`/workflows/create?templateId=${params.id}`);
  };

  const getVisibilityIcon = () => {
    if (!template) return null;

    switch (template.visibility) {
      case "public":
        return <Eye size={20} className="text-green-500 mr-1" />;
      case "restricted":
        return <EyeOff size={20} className="text-orange-500 mr-1" />;
      case "team":
        return <Users size={20} className="text-blue-500 mr-1" />;
      default:
        return null;
    }
  };

  const getVisibilityText = () => {
    if (!template) return "";

    switch (template.visibility) {
      case "public":
        return "Público (visível para todos)";
      case "restricted":
        return "Restrito (apenas envolvidos)";
      case "team":
        return "Equipe (equipe e administradores)";
      default:
        return template.visibility;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Loading size="medium" message="Carregando template..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <CustomButton
          variant="primary"
          icon={ArrowLeft}
          onClick={() => router.push("/workflows/templates")}>
          Voltar
        </CustomButton>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Template não encontrado
        </div>
        <CustomButton
          variant="primary"
          icon={ArrowLeft}
          onClick={() => router.push("/workflows/templates")}>
          Voltar
        </CustomButton>
      </div>
    );
  }

  if (isEditing) {
    // Transformar o modelo para o formato do formulário
    const formData: WorkflowTemplateCreateDto = {
      name: template.name,
      description: template.description,
      visibility: template.visibility as any,
      steps: template.steps.map((step) => ({
        name: step.name,
        description: step.description,
        stepOrder: step.stepOrder,
      })),
    };

    return (
      <>
        <Navbar />
        <div className="container mx-auto py-6 px-4">
          <Breadcrumb
            items={[
              { label: "Fluxos de Trabalho", href: "/workflows" },
              { label: "Templates", href: "/workflows/templates" },
              { label: template.name },
            ]}
          />

          <div className="mb-6">
            <h1 className="text-2xl font-bold">Editar Template</h1>
            <p className="text-gray-600">
              Modifique as configurações e etapas do template
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <TemplateForm
              initialData={formData}
              onSubmit={handleUpdate}
              isLoading={isSubmitting}
            />
          </div>
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
            { label: "Templates", href: "/workflows/templates" },
            { label: template.name },
          ]}
        />

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <div className="flex items-center text-gray-600 mt-1">
              {getVisibilityIcon()}
              <span>{getVisibilityText()}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <CustomButton
              variant="primary"
              icon={Play}
              onClick={() => setShowUseTemplateDialog(true)}>
              Usar Template
            </CustomButton>
            <CustomButton
              variant="primary"
              icon={Edit}
              onClick={() => setIsEditing(true)}>
              Editar
            </CustomButton>
            <CustomButton
              variant="primary"
              icon={Trash2}
              onClick={() => setShowDeleteDialog(true)}>
              Excluir
            </CustomButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">
                Detalhes do Template
              </h2>

              {template.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Descrição
                  </h3>
                  <p className="text-gray-700">{template.description}</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Etapas do Fluxo
                </h3>
                <div className="space-y-3">
                  {template.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center mb-1">
                        <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm mr-2">
                          {index + 1}
                        </span>
                        <h4 className="font-medium">{step.name}</h4>
                      </div>
                      {step.description && (
                        <p className="text-sm text-gray-600 ml-8">
                          {step.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Informações</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Criado por
                  </h3>
                  <p>{template.createdByName}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Data de Criação
                  </h3>
                  <p>{new Date(template.createdAt).toLocaleString("pt-BR")}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Última Atualização
                  </h3>
                  <p>{new Date(template.updatedAt).toLocaleString("pt-BR")}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Número de Etapas
                  </h3>
                  <p>{template.steps.length}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Fluxos Usando Este Template
                  </h3>
                  <p>{template.workflowCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Excluir Template"
          message={
            template.workflowCount > 0
              ? `Este template está sendo usado por ${template.workflowCount} fluxo(s). Não é possível excluí-lo.`
              : "Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita."
          }
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          variant="danger"
          isLoading={isSubmitting}
        />

        <ConfirmDialog
          isOpen={showUseTemplateDialog}
          title="Usar Template"
          message={`Deseja criar um novo fluxo de trabalho usando o template "${template.name}"?`}
          confirmText="Criar Fluxo"
          cancelText="Voltar"
          onConfirm={handleUseTemplate}
          onCancel={() => setShowUseTemplateDialog(false)}
          variant="info"
        />
      </div>
    </>
  );
}
