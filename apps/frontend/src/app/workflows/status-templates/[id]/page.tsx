// src/app/workflows/status-templates/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/breadcrumb";
import { CustomButton } from "@/components/ui/custom-button";
import { Loading } from "@/components/ui/loading";
import StatusTemplateForm from "@/components/workflow/StatusTemplateForm";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Edit, Trash2, ArrowLeft, Play, ChartBarIcon } from "lucide-react";
import {
  WorkflowStatusTemplateDto,
  WorkflowStatusTemplateCreateDto,
} from "@/types/workflow";
import workflowService from "@/services/workflow";
import toastUtil from "@/utils/toast";
import Navbar from "@/components/layout/Navbar";

interface StatusTemplatePageProps {
  params: {
    id: string;
  };
}

export default function StatusTemplatePage({
  params,
}: StatusTemplatePageProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<WorkflowStatusTemplateDto | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getStatusTemplateById(params.id);
      setTemplate(data);
    } catch (err) {
      console.error("Erro ao carregar template de status:", err);
      setError(
        "Não foi possível carregar o template de status. Tente novamente mais tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [params.id]);

  const handleUpdate = async (data: WorkflowStatusTemplateCreateDto) => {
    try {
      setIsSubmitting(true);
      await workflowService.updateStatusTemplate(params.id, data);
      toastUtil.success("Template de status atualizado com sucesso!");
      setIsEditing(false);
      fetchTemplate();
    } catch (error) {
      console.error("Erro ao atualizar template de status:", error);
      toastUtil.error(
        "Não foi possível atualizar o template de status. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await workflowService.deleteStatusTemplate(params.id);
      toastUtil.success("Template de status excluído com sucesso!");
      router.push("/workflows/status-templates");
    } catch (error) {
      console.error("Erro ao excluir template de status:", error);
      toastUtil.error(
        "Não foi possível excluir o template de status. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Loading size="medium" message="Carregando template de status..." />
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
          onClick={() => router.push("/workflows/status-templates")}>
          Voltar
        </CustomButton>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Template de status não encontrado
        </div>
        <CustomButton
          variant="primary"
          icon={ArrowLeft}
          onClick={() => router.push("/workflows/status-templates")}>
          Voltar
        </CustomButton>
      </div>
    );
  }

  if (isEditing) {
    // Transformar o modelo para o formato do formulário
    const formData: WorkflowStatusTemplateCreateDto = {
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
              { label: template.name },
            ]}
          />

          <div className="mb-6">
            <h1 className="text-2xl font-bold">Editar Template de Status</h1>
            <p className="text-gray-600">
              Modifique os status e suas propriedades
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <StatusTemplateForm
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
            {
              label: "Templates de Status",
              href: "/workflows/status-templates",
            },
            { label: template.name },
          ]}
        />

        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold mr-2">{template.name}</h1>
              {template.isDefault && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Padrão
                </span>
              )}
            </div>
            {template.description && (
              <p className="text-gray-600 mt-1">{template.description}</p>
            )}
          </div>

          <div className="flex space-x-2">
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
              <h2 className="text-lg font-semibold mb-4">Status</h2>

              <div className="space-y-4">
                {template.statusItems.map((status) => (
                  <div
                    key={status.id}
                    className="border rounded-lg p-4"
                    style={{
                      borderLeftWidth: "4px",
                      borderLeftColor: status.color,
                    }}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: status.color }}></div>
                        <h3 className="font-medium">{status.name}</h3>
                      </div>
                      <div className="flex space-x-2">
                        {status.isInitial && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                            <Play size={12} className="mr-1" /> Inicial
                          </span>
                        )}
                        {status.isFinal && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                            <ChartBarIcon size={12} className="mr-1" /> Final
                          </span>
                        )}
                      </div>
                    </div>
                    {status.description && (
                      <p className="text-sm text-gray-600">
                        {status.description}
                      </p>
                    )}
                  </div>
                ))}
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
                    Número de Status
                  </h3>
                  <p>{template.statusItems.length}</p>
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
          title="Excluir Template de Status"
          message={
            template.workflowCount > 0
              ? `Este template está sendo usado por ${template.workflowCount} fluxo(s). Não é possível excluí-lo.`
              : "Tem certeza que deseja excluir este template de status? Esta ação não pode ser desfeita."
          }
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          variant="danger"
          isLoading={isSubmitting}
        />
      </div>
    </>
  );
}
