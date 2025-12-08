"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Stethoscope, Info, Eye } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { CustomButton } from "@/components/ui/custom-button";
import { especialidadeService } from "@/services/clinical";
import { EspecialidadeCreateRequest } from "@/types/clinical";
import toastUtil from "@/utils/toast";

export default function NovaEspecialidadePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<EspecialidadeCreateRequest>({
    nome: "",
    descricao: "",
    ativo: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "O nome é obrigatório";
    } else if (formData.nome.trim().length < 3) {
      newErrors.nome = "O nome deve ter pelo menos 3 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      await especialidadeService.create({
        ...formData,
        nome: formData.nome.toUpperCase(),
      });
      toastUtil.success("Especialidade criada com sucesso!");
      router.back();
    } catch (err: any) {
      if (err.response?.status === 409) {
        toastUtil.error("Já existe uma especialidade com este nome.");
      } else {
        toastUtil.error("Erro ao criar especialidade.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
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
                  Nova Especialidade
                </h1>
                <p className="text-gray-600 text-sm">
                  Adicionar nova especialidade médica ao sistema
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                      placeholder="Ex: PEDIATRIA"
                    />
                    {errors.nome && (
                      <p className="text-red-500 text-xs mt-1">{errors.nome}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      O nome será salvo automaticamente em maiúsculo.
                    </p>
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
                      placeholder="Breve descrição da especialidade..."
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
                      Ativo imediatamente
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
                    disabled={saving}>
                    {saving ? (
                      "Criando..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Criar
                      </>
                    )}
                  </CustomButton>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
                  <Info className="mr-2 h-4 w-4" /> Dicas
                </h3>
                <ul className="text-sm space-y-2 text-blue-900 list-disc list-inside">
                  <li>Use nomes claros e padronizados.</li>
                  <li>Evite abreviações se possível.</li>
                  <li>
                    A especialidade aparecerá imediatamente nas opções de
                    cadastro de médicos se estiver ativa.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
