// src/app/convenios/novo/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import convenioService, { ConvenioCreateDto } from "@/services/convenio";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";

export default function NovoConvenioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [convenio, setConvenio] = useState<ConvenioCreateDto>({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Verificar se o usuário tem permissão para criar convênios
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const canCreate = isAdmin || isEditor;

  // Redirecionar se não tem permissão
  if (!canCreate) {
    router.push("/convenios");
    return null;
  }

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

    setLoading(true);
    try {
      await convenioService.createConvenio(convenio);
      toastUtil.success("Convênio criado com sucesso!");
      router.push("/convenios");
    } catch (err: any) {
      console.error("Erro ao criar convênio:", err);

      if (err.response?.data?.message) {
        toastUtil.error(err.response.data.message);
      } else if (err.response?.status === 409) {
        toastUtil.error("Já existe um convênio com este nome.");
        setErrors((prev) => ({
          ...prev,
          name: "Já existe um convênio com este nome",
        }));
      } else {
        toastUtil.error("Erro ao criar convênio. Tente novamente mais tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto p-6">
        <Breadcrumb
          items={[
            { label: "Convênios", href: "/convenios" },
            { label: "Novo Convênio" },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Novo Convênio</h1>
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
                disabled={loading}
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
              <textarea
                id="description"
                name="description"
                value={convenio.description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.description ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                placeholder="Digite a descrição do convênio"
                disabled={loading}></textarea>
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
                onClick={() => router.push("/convenios")}
                disabled={loading}>
                Cancelar
              </CustomButton>
              <CustomButton
                type="submit"
                variant="primary"
                icon={Save}
                disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </CustomButton>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
