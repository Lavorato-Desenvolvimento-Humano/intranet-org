// apps/frontend/src/app/postagens/nova/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import convenioService, { ConvenioDto } from "@/services/convenio";
import postagemService, {
  AnexoDto,
  ImagemDto,
  PostagemCreateDto,
} from "@/services/postagem";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import dynamic from "next/dynamic";

// Importando o editor simples em vez do CKEditor
const SimpleRichEditor = dynamic(
  () => import("@/components/ui/simple-rich-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse bg-gray-100 rounded-md"></div>
    ),
  }
);

export default function NovaPostagemPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PostagemCreateDto>({
    title: "",
    text: "",
    convenioId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tempUploads, setTempUploads] = useState<{
    images: ImagemDto[];
    attachments: AnexoDto[];
  }>({
    images: [],
    attachments: [],
  });

  // Verificar permissões
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const isUser =
    user?.roles?.includes("ROLE_USER") || user?.roles?.includes("USER");
  const canCreatePostagem = isAdmin || isEditor || isUser;

  // Extrair convenioId do parâmetro de consulta se disponível
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const convenioId = params.get("convenioId");
      if (convenioId) {
        setFormData((prev) => ({ ...prev, convenioId }));
      }
    }
  }, []);

  // Carregar convênios
  useEffect(() => {
    const fetchConvenios = async () => {
      setLoading(true);
      try {
        const data = await convenioService.getAllConvenios();
        setConvenios(data);
      } catch (err) {
        console.error("Erro ao carregar convênios:", err);
        setError("Erro ao carregar convênios. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchConvenios();
  }, []);

  // Redirecionar se não tem permissão
  useEffect(() => {
    if (!loading && !canCreatePostagem) {
      toastUtil.error("Você não tem permissão para criar postagens.");
      router.push("/convenios");
    }
  }, [loading, canCreatePostagem, router]);

  // Validar formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "O título é obrigatório";
    } else if (formData.title.length < 3) {
      newErrors.title = "O título deve ter pelo menos 3 caracteres";
    } else if (formData.title.length > 255) {
      newErrors.title = "O título deve ter no máximo 255 caracteres";
    }

    if (!formData.text.trim()) {
      newErrors.text = "O conteúdo da postagem é obrigatório";
    }

    if (!formData.convenioId) {
      newErrors.convenioId = "Selecione um convênio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Lidar com mudanças nos campos
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Lidar com mudanças no editor rico
  const handleEditorChange = (content: string) => {
    setFormData((prev) => ({ ...prev, text: content }));
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const createdPostagem = await postagemService.createPostagem(formData);
      toastUtil.success("Postagem criada com sucesso!");
      router.push(`/postagens/${createdPostagem.id}`);
    } catch (err: any) {
      console.error("Erro ao criar postagem:", err);

      if (err.response?.data?.message) {
        toastUtil.error(err.response.data.message);
      } else {
        toastUtil.error("Erro ao criar postagem. Tente novamente mais tarde.");
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto p-6">
        <Breadcrumb
          items={[
            { label: "Convênios", href: "/convenios" },
            { label: "Nova Postagem" },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Nova Postagem</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.title ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                placeholder="Digite o título da postagem"
                disabled={submitting}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="convenioId"
                className="block text-sm font-medium text-gray-700 mb-1">
                Convênio *
              </label>
              <select
                id="convenioId"
                name="convenioId"
                value={formData.convenioId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.convenioId ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                disabled={submitting}>
                <option value="">Selecione um convênio</option>
                {convenios.map((convenio) => (
                  <option key={convenio.id} value={convenio.id}>
                    {convenio.name}
                  </option>
                ))}
              </select>
              {errors.convenioId && (
                <p className="mt-1 text-sm text-red-500">{errors.convenioId}</p>
              )}
            </div>

            <div className="mb-6">
              <label
                htmlFor="text"
                className="block text-sm font-medium text-gray-700 mb-1">
                Conteúdo *
              </label>
              <SimpleRichEditor
                value={formData.text}
                onChange={handleEditorChange}
                placeholder="Digite o conteúdo da postagem..."
                height="400px"
                error={errors.text}
                disabled={submitting}
                onImageUpload={async (file: File) => {
                  try {
                    // Usar o endpoint temporário
                    const imagem = await postagemService.addTempImagem(file);

                    // Rastrear o upload
                    setTempUploads((prev) => ({
                      ...prev,
                      images: [...prev.images, imagem],
                    }));

                    return imagem.url;
                  } catch (err) {
                    console.error("Erro ao fazer upload da imagem:", err);
                    throw err;
                  }
                }}
                onFileUpload={async (file: File) => {
                  try {
                    // Usar o endpoint temporário
                    const anexo = await postagemService.addTempAnexo(file);

                    // Rastrear o upload
                    setTempUploads((prev) => ({
                      ...prev,
                      attachments: [...prev.attachments, anexo],
                    }));

                    return anexo.url;
                  } catch (err) {
                    console.error("Erro ao fazer upload do arquivo:", err);
                    throw err;
                  }
                }}
              />
              {errors.text && (
                <p className="mt-1 text-sm text-red-500">{errors.text}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <CustomButton
                type="button"
                variant="secondary"
                icon={X}
                onClick={() => router.push("/convenios")}
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
  );
}
