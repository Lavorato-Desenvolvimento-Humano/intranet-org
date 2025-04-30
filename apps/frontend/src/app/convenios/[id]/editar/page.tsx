// src/app/convenios/[id]/editar/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, X, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import convenioService, {
  ConvenioDto,
  ConvenioCreateDto,
} from "@/services/convenio";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import SimpleRichEditor from "@/components/ui/simple-rich-editor";

export default function EditarConvenioPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [convenio, setConvenio] = useState<ConvenioCreateDto>({
    name: "",
    description: "",
  });
  const [originalConvenio, setOriginalConvenio] = useState<ConvenioDto | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const convenioId = params?.id as string;

  // Verificar se o usuário tem permissão para editar convênios
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const canEdit = isAdmin || isEditor;

  // Buscar dados do convênio
  useEffect(() => {
    const fetchConvenio = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await convenioService.getConvenioById(convenioId);
        setOriginalConvenio(data);
        setConvenio({
          name: data.name,
          description: data.description || "",
        });
      } catch (err) {
        console.error("Erro ao buscar dados do convênio:", err);
        setError(
          "Não foi possível carregar os dados do convênio. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    if (convenioId) {
      fetchConvenio();
    }
  }, [convenioId]);

  // Redirecionar se não tem permissão
  useEffect(() => {
    if (!loading && !canEdit) {
      toastUtil.error("Você não tem permissão para editar convênios.");
      router.push(`/convenios/${convenioId}`);
    }
  }, [loading, canEdit, convenioId, router]);

  // Função para validar o formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!convenio.name.trim()) {
      newErrors.name = "O nome do convênio é obrigatório";
    } else if (convenio.name.length < 2) {
      newErrors.name = "O nome deve ter pelo menos 2 caracteres";
    } else if (convenio.name.length > 255) {
      newErrors.name = "O nome deve ter no máximo 255 caracteres";
    }

    if (convenio.description && convenio.description.length > 1000) {
      newErrors.description = "A descrição deve ter no máximo 1000 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para lidar com mudanças nos campos
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setConvenio((prev) => ({ ...prev, [name]: value }));
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await convenioService.updateConvenio(convenioId, convenio);
      toastUtil.success("Convênio atualizado com sucesso!");
      router.push(`/convenios/${convenioId}`);
    } catch (err: any) {
      console.error("Erro ao atualizar convênio:", err);

      if (err.response?.data?.message) {
        toastUtil.error(err.response.data.message);
      } else if (err.response?.status === 409) {
        toastUtil.error("Já existe um convênio com este nome.");
        setErrors((prev) => ({
          ...prev,
          name: "Já existe um convênio com este nome",
        }));
      } else {
        toastUtil.error(
          "Erro ao atualizar convênio. Tente novamente mais tarde."
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
          <Loading message="Carregando dados do convênio..." />
        </main>
      </div>
    );
  }

  if (error || !originalConvenio) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            {error || "Convênio não encontrado."}
          </div>
          <button
            onClick={() => router.push("/convenios")}
            className="flex items-center text-primary hover:text-primary-dark">
            <ArrowLeft size={16} className="mr-1" />
            Voltar para a lista de convênios
          </button>
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
              { label: "Convênios", href: "/convenios" },
              {
                label: originalConvenio.name,
                href: `/convenios/${convenioId}`,
              },
              { label: "Editar" },
            ]}
          />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Editar Convênio
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={convenio.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                  placeholder="Digite o nome do convênio"
                  disabled={submitting}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="mb-6">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <SimpleRichEditor
                  value={convenio.description || ""}
                  onChange={(value) =>
                    setConvenio((prev) => ({ ...prev, description: value }))
                  }
                  placeholder="Digite a descrição do convênio"
                  disabled={submitting}
                  error={errors.description}
                  height="200px"
                />

                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <CustomButton
                  type="button"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 text-white border-none"
                  icon={X}
                  onClick={() => router.push(`/convenios/${convenioId}`)}
                  disabled={submitting}>
                  Cancelar
                </CustomButton>
                <CustomButton
                  type="submit"
                  variant="primary"
                  icon={Save}
                  disabled={submitting}>
                  {submitting ? "Salvando..." : "Salvar Alterações"}
                </CustomButton>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
