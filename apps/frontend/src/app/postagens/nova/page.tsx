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
import RichTextPreview from "@/components/ui/rich-text-preview";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import equipeService, { EquipeDto } from "@/services/equipe";

// Importando o editor melhorado com carregamento dinâmico
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
    tipoDestino: "convenio", // Valor padrão
    convenioId: "",
    equipeId: "",
  });
  const [equipes, setEquipes] = useState<EquipeDto[]>([]);
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
  const canCreatePostagem = isAdmin || isEditor;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const convenioId = params.get("convenioId");
      const equipeId = params.get("equipeId");
      const tipoDestino = params.get("tipoDestino");

      if (
        tipoDestino &&
        ["geral", "equipe", "convenio"].includes(tipoDestino)
      ) {
        setFormData((prev) => ({
          ...prev,
          tipoDestino: tipoDestino as "geral" | "equipe" | "convenio",
        }));
      }

      if (convenioId) {
        setFormData((prev) => ({ ...prev, convenioId }));
      }

      if (equipeId) {
        setFormData((prev) => ({ ...prev, equipeId }));
      }
    }
  }, []);

  // Carregar convênios e equipes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Carregar dados em paralelo
        const [conveniosData, equipesData] = await Promise.all([
          convenioService.getAllConvenios(),
          equipeService.getAllEquipes(),
        ]);

        setConvenios(conveniosData);
        setEquipes(equipesData);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Erro ao carregar dados. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

    // Validar campos específicos com base no tipo de destino selecionado
    switch (formData.tipoDestino) {
      case "convenio":
        if (!formData.convenioId) {
          newErrors.convenioId = "Selecione um convênio";
        }
        break;
      case "equipe":
        if (!formData.equipeId) {
          newErrors.equipeId = "Selecione uma equipe";
        }
        break;
      case "geral":
        // Tipo "geral" não precisa de validação adicional
        break;
      default:
        newErrors.tipoDestino = "Tipo de destino inválido";
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
    // Garantir que as quebras de linha HTML sejam preservadas
    const processedContent = content
      .replace(/<p>\s*<\/p>/g, "<br />")
      .replace(/\n/g, "<br />");

    setFormData((prev) => ({ ...prev, text: processedContent }));
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Criar a postagem
      const createdPostagem = await postagemService.createPostagem(formData);

      // Arrays para armazenar as promessas de associação
      const associationPromises = [];

      // Adicionar promessas para associar anexos temporários
      for (const anexo of tempUploads.attachments) {
        associationPromises.push(
          postagemService
            .associarAnexo(createdPostagem.id, anexo.id)
            .catch((err) => {
              console.error(`Erro ao associar anexo ${anexo.id}:`, err);
              return null; // Continuar mesmo se um anexo falhar
            })
        );
      }

      // Adicionar promessas para associar imagens temporárias
      for (const imagem of tempUploads.images) {
        associationPromises.push(
          postagemService
            .associarImagem(createdPostagem.id, imagem.id)
            .catch((err) => {
              console.error(`Erro ao associar imagem ${imagem.id}:`, err);
              return null; // Continuar mesmo se uma imagem falhar
            })
        );
      }

      // Aguardar todas as associações
      if (associationPromises.length > 0) {
        await Promise.allSettled(associationPromises);
      }

      // Verificar e relatar quaisquer problemas
      const totalAttachments =
        tempUploads.attachments.length + tempUploads.images.length;
      const successMessage =
        totalAttachments > 0
          ? `Postagem criada com sucesso! ${totalAttachments} arquivos associados.`
          : "Postagem criada com sucesso!";

      toastUtil.success(successMessage);
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
    <ProtectedRoute>
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
                  htmlFor="tipoDestino"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Visibilidade da Postagem *
                </label>
                <select
                  id="tipoDestino"
                  name="tipoDestino"
                  value={formData.tipoDestino}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={submitting}>
                  <option value="geral">Geral</option>
                  <option value="equipe">Equipe específica</option>
                  <option value="convenio">Convênio específico</option>
                </select>
              </div>

              {/* Campo de seleção de convênio (mostrar apenas se tipoDestino for "convenio") */}
              {formData.tipoDestino === "convenio" && (
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
                    <p className="mt-1 text-sm text-red-500">
                      {errors.convenioId}
                    </p>
                  )}
                </div>
              )}

              {/* Campo de seleção de equipe (mostrar apenas se tipoDestino for "equipe") */}
              {formData.tipoDestino === "equipe" && (
                <div className="mb-4">
                  <label
                    htmlFor="equipeId"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    Equipe *
                  </label>
                  <select
                    id="equipeId"
                    name="equipeId"
                    value={formData.equipeId}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.equipeId ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                    disabled={submitting}>
                    <option value="">Selecione uma equipe</option>
                    {equipes.map((equipe) => (
                      <option key={equipe.id} value={equipe.id}>
                        {equipe.nome}
                      </option>
                    ))}
                  </select>
                  {errors.equipeId && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.equipeId}
                    </p>
                  )}
                </div>
              )}

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
                  error={errors.text}
                  disabled={submitting}
                  onImageUpload={async (file: File) => {
                    try {
                      // Usar o endpoint temporário com tratamento de erros aprimorado
                      const imagem = await postagemService.addTempImagem(file);

                      // Rastrear o upload para associação posterior quando a postagem for criada
                      setTempUploads((prev) => ({
                        ...prev,
                        images: [...prev.images, imagem],
                      }));

                      // Se a URL não começar com http ou /, adicionar / no início
                      let url = imagem.url;
                      if (!url.startsWith("http") && !url.startsWith("/")) {
                        url = "/" + url;
                      }

                      // Verificar se a URL existe e é acessível
                      try {
                        const response = await fetch(url, { method: "HEAD" });
                        if (!response.ok) {
                          console.warn(
                            `A URL da imagem ${url} não está acessível diretamente. Tentando URL alternativa.`
                          );
                          // Tentar URL alternativa
                          url = `/api${url}`;
                        }
                      } catch (err) {
                        console.warn(
                          `Erro ao verificar URL da imagem: ${err}. Tentando URL alternativa.`
                        );
                        url = `/api${url}`;
                      }

                      return url;
                    } catch (err: any) {
                      console.error("Erro ao fazer upload da imagem:", err);
                      toastUtil.error(
                        err.message || "Erro ao fazer upload da imagem"
                      );
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

                {/* Adicionar componente de pré-visualização */}
                <RichTextPreview content={formData.text} />
              </div>

              <div className="flex justify-end space-x-3">
                <CustomButton
                  type="button"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 text-white border-none"
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
    </ProtectedRoute>
  );
}
