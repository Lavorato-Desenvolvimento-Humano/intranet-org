// src/app/equipes/nova/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import equipeService, { EquipeDto, EquipeCreateDto } from "@/services/equipe";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";

export default function EquipeFormPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [equipe, setEquipe] = useState<EquipeDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<EquipeCreateDto>({
    nome: "",
    descricao: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = params?.id !== undefined;
  const equipeId = params?.id as string;

  // Verificar permissões
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const canEditEquipe = isAdmin || isEditor;

  // Carregar dados da equipe no modo de edição
  useEffect(() => {
    if (isEditMode && equipeId) {
      setLoading(true);
      equipeService
        .getEquipeById(equipeId)
        .then((data) => {
          setEquipe(data);
          setFormData({
            nome: data.nome,
            descricao: data.descricao || "",
          });
        })
        .catch((err) => {
          console.error("Erro ao carregar equipe:", err);
          toastUtil.error("Erro ao carregar dados da equipe.");
          router.push("/equipes");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isEditMode, equipeId, router]);

  // Verificar se o usuário tem permissão
  useEffect(() => {
    if (!canEditEquipe) {
      toastUtil.error("Você não tem permissão para criar ou editar equipes.");
      router.push("/equipes");
    }
  }, [canEditEquipe, router]);

  // Função para validar o formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "O nome da equipe é obrigatório";
    } else if (formData.nome.length < 3) {
      newErrors.nome = "O nome deve ter pelo menos 3 caracteres";
    } else if (formData.nome.length > 255) {
      newErrors.nome = "O nome deve ter no máximo 255 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para lidar com mudanças nos campos
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        // Atualizar equipe existente
        await equipeService.updateEquipe(equipeId, formData);
        toastUtil.success("Equipe atualizada com sucesso!");
      } else {
        // Criar nova equipe
        const newEquipe = await equipeService.createEquipe(formData);
        toastUtil.success("Equipe criada com sucesso!");
        router.push(`/equipes/${newEquipe.id}`);
        return; // Evitar redirecionamento duplo
      }

      // No modo de edição, redirecionar para a página de detalhes
      router.push(`/equipes/${equipeId}`);
    } catch (err: any) {
      console.error("Erro ao salvar equipe:", err);

      if (err.response?.data?.message) {
        toastUtil.error(err.response.data.message);
      } else {
        toastUtil.error(
          `Erro ao ${isEditMode ? "atualizar" : "criar"} equipe. Tente novamente mais tarde.`
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando..." />
        </main>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          <Breadcrumb
            items={[
              { label: "Equipes", href: "/equipes" },
              {
                label: isEditMode
                  ? equipe?.nome || "Editar Equipe"
                  : "Nova Equipe",
              },
            ]}
          />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? "Editar Equipe" : "Nova Equipe"}
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Equipe *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.nome ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                  placeholder="Digite o nome da equipe"
                  disabled={submitting}
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-500">{errors.nome}</p>
                )}
              </div>

              <div className="mb-6">
                <label
                  htmlFor="descricao"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Descrição da equipe (opcional)"
                  disabled={submitting}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <CustomButton
                  type="button"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 text-white border-none"
                  icon={X}
                  onClick={() => router.push("/equipes")}
                  disabled={submitting}>
                  Cancelar
                </CustomButton>
                <CustomButton
                  type="submit"
                  variant="primary"
                  icon={Save}
                  disabled={submitting}>
                  {submitting ? "Salvando..." : "Salvar"}
                </CustomButton>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
