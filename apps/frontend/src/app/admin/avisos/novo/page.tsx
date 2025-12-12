"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import Button from "@/components/ui/custom-button";
import Input from "@/components/ui/input";
import SimpleRichEditor from "@/components/ui/simple-rich-editor";
import toast from "@/utils/toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import postagemService from "@/services/postagem";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";

export default function NovoAvisoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    type: "info", // info, warning, critical
    content: "", // Aqui vai o HTML
    targetRoles: "",
    mandatory: false,
    active: true,
  });

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const imagem = await postagemService.addTempImagem(file);
      return imagem.url;
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast.error("Erro ao fazer upload da imagem");
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error("Título e Conteúdo são obrigatórios");
      return;
    }

    setLoading(true);
    try {
      await api.post("/notifications", formData);
      toast.success("Aviso cadastrado com sucesso!");
      router.push("/admin");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cadastrar aviso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <Navbar />
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            Novo Aviso do Sistema
          </h1>
          <Link href="/admin">
            <Button variant="primary" size="small">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
          {/* Título e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ex: Manutenção Programada"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }>
                <option value="info">Informação (Azul)</option>
                <option value="warning">Atenção (Amarelo)</option>
                <option value="critical">Crítico (Vermelho)</option>
              </select>
            </div>
          </div>

          {/* Editor de Texto (Gera o HTML) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conteúdo do Aviso
            </label>
            <div className="border rounded-md overflow-hidden min-h-[200px]">
              <SimpleRichEditor
                value={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                onImageUpload={handleImageUpload}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Você pode colar imagens, usar negrito e criar listas.
            </p>
          </div>

          {/* Configurações Extras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destinatários (Roles)
              </label>
              <Input
                value={formData.targetRoles}
                onChange={(e) =>
                  setFormData({ ...formData, targetRoles: e.target.value })
                }
                placeholder="Ex: ADMIN, USER (Deixe vazio para todos)"
              />
              <p className="text-xs text-gray-500 mt-1">Separe por vírgulas.</p>
            </div>

            <div className="flex items-center space-x-4 pt-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  checked={formData.mandatory}
                  onChange={(e) =>
                    setFormData({ ...formData, mandatory: e.target.checked })
                  }
                />
                <span className="text-sm text-gray-700">
                  Leitura Obrigatória?
                </span>
              </label>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="pt-4 border-t flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto">
              {loading ? (
                "Salvando..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Publicar Aviso
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
