"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Stethoscope,
  AlertCircle,
  Eye,
  History,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { especialidadeService } from "@/services/clinical";
import { EspecialidadeDto, EspecialidadeCreateRequest } from "@/types/clinical";
import { formatDateTime } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

export default function EditarEspecialidadePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Estados
  const [originalItem, setOriginalItem] = useState<EspecialidadeDto | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Formulário
  const [formData, setFormData] = useState<EspecialidadeCreateRequest>({
    nome: "",
    descricao: "",
    ativo: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  // Detectar mudanças
  useEffect(() => {
    if (originalItem) {
      const changed =
        formData.nome !== originalItem.nome ||
        formData.descricao !== (originalItem.descricao || "") ||
        formData.ativo !== originalItem.ativo;
      setHasChanges(changed);
    }
  }, [formData, originalItem]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await especialidadeService.getById(id);
      setOriginalItem(data);
      setFormData({
        nome: data.nome,
        descricao: data.descricao || "",
        ativo: data.ativo,
      });
    } catch (err) {
      console.error(err);
      toastUtil.error("Erro ao carregar especialidade");
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "O nome é obrigatório";
    } else if (formData.nome.trim().length < 3) {
      newErrors.nome = "O nome deve ter pelo menos 3 caracteres";
    }

    if (formData.descricao && formData.descricao.length > 255) {
      newErrors.descricao = "A descrição é muito longa (máx 255)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      await especialidadeService.update(id, {
        ...formData,
        nome: formData.nome.toUpperCase(), // Padronizar em maiúsculo
      });
      toastUtil.success("Especialidade atualizada!");
      router.back(); // Volta para a lista
    } catch (err: any) {
      // Se o erro for 409 (Conflict), é duplicidade de nome
      if (err.response?.status === 409) {
        toastUtil.error("Já existe uma especialidade com este nome.");
      } else {
        toastUtil.error("Erro ao salvar alterações.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading message="Carregando..." />;
  }

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <CustomButton
                variant="primary"
                onClick={() => router.back()}
                className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </CustomButton>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Stethoscope className="mr-2 h-6 w-6 text-blue-600" />
                  Editar Especialidade
                </h1>
                <p className="text-gray-600 text-sm">
                  Editando: {originalItem?.nome}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulário */}
            <div className="lg:col-span-2">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nome: e.target.value.toUpperCase(),
                        })
                      }
                      className={`w-full border rounded-md px-3 py-2 ${errors.nome ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Ex: CARDIOLOGIA"
                    />
                    {errors.nome && (
                      <p className="text-red-500 text-xs mt-1">{errors.nome}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo}
                      onChange={(e) =>
                        setFormData({ ...formData, ativo: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <label
                      htmlFor="ativo"
                      className="ml-2 block text-sm text-gray-900">
                      Especialidade Ativa
                    </label>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-6 border-t">
                  <CustomButton
                    type="button"
                    variant="primary"
                    onClick={() => router.back()}>
                    Cancelar
                  </CustomButton>
                  <CustomButton
                    type="submit"
                    variant="primary"
                    disabled={saving || !hasChanges}>
                    {saving ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Salvar
                      </>
                    )}
                  </CustomButton>
                </div>
              </form>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </h3>
                <div className="bg-gray-50 p-4 rounded-md border text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {formData.nome || "NOME"}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
                  <History className="mr-2 h-4 w-4" /> Metadados
                </h3>
                <div className="text-sm space-y-2 text-blue-900">
                  <p>
                    <strong>Criado em:</strong>
                    <br />{" "}
                    {originalItem?.createdAt
                      ? formatDateTime(originalItem.createdAt)
                      : "-"}
                  </p>
                  <p>
                    <strong>Última atualização:</strong>
                    <br />{" "}
                    {originalItem?.updatedAt
                      ? formatDateTime(originalItem.updatedAt)
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
