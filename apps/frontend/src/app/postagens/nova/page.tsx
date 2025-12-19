"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X, LayoutTemplate, Eye } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import convenioService, { ConvenioDto } from "@/services/convenio";
import postagemService, {
  AnexoDto,
  ImagemDto,
  PostagemCreateDto,
  PostagemSummaryDto,
} from "@/services/postagem";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import equipeService, { EquipeDto } from "@/services/equipe";
import { PostCard } from "@/components/postagem/PostCard"; // Importando o PostCard para o preview

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
    categoria: "GERAL",
    pinned: false,
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

  // Função auxiliar para extrair a primeira imagem do conteúdo HTML para o preview
  const extractCoverImageFromContent = (htmlContent: string): string | null => {
    if (!htmlContent) return null;
    const imgRegex = /<img[^>]+src="([^">]+)"/;
    const match = htmlContent.match(imgRegex);
    return match ? match[1] : null;
  };

  // Gerar o objeto mock para o preview do PostCard
  const getPreviewPostagem = (): PostagemSummaryDto => {
    const coverImage = extractCoverImageFromContent(formData.text);

    // Encontrar nomes para exibição
    let convenioName = "";
    let equipeName = "";

    if (formData.tipoDestino === "convenio" && formData.convenioId) {
      convenioName =
        convenios.find((c) => c.id === formData.convenioId)?.name || "";
    }

    if (formData.tipoDestino === "equipe" && formData.equipeId) {
      equipeName = equipes.find((e) => e.id === formData.equipeId)?.nome || "";
    }

    return {
      id: "preview-id",
      title: formData.title || "Título da Postagem",
      previewText:
        formData.text || "O conteúdo da sua postagem aparecerá aqui...",
      coverImageUrl: coverImage || undefined,
      createdByName: user?.fullName || "Seu Nome",
      createdByProfileImage: user?.profileImage || undefined,
      categoria: formData.categoria,
      tipoDestino: formData.tipoDestino,
      convenioName: convenioName,
      equipeName: equipeName,
      viewsCount: 0,
      likesCount: 0,
      comentariosCount: 0,
      likedByCurrentUser: false,
      pinned: formData.pinned ?? false,
      createdAt: "",
      hasImagens: formData.text.includes("<img"),
      hasAnexos: formData.text.includes("<a"),
      hasTabelas: formData.text.includes("<table"),
    };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "O título é obrigatório";
    } else if (formData.title.length < 3) {
      newErrors.title = "O título deve ter pelo menos 3 caracteres";
    }

    if (!formData.text.trim()) {
      newErrors.text = "O conteúdo da postagem é obrigatório";
    }

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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (content: string) => {
    const processedContent = content
      .replace(/<p>\s*<\/p>/g, "<br />")
      .replace(/\n/g, "<br />");

    setFormData((prev) => ({ ...prev, text: processedContent }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toastUtil.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setSubmitting(true);
    try {
      const createdPostagem = await postagemService.createPostagem(formData);

      const associationPromises = [];

      for (const anexo of tempUploads.attachments) {
        associationPromises.push(
          postagemService
            .associarAnexo(createdPostagem.id, anexo.id)
            .catch((err) => null)
        );
      }

      for (const imagem of tempUploads.images) {
        associationPromises.push(
          postagemService
            .associarImagem(createdPostagem.id, imagem.id)
            .catch((err) => null)
        );
      }

      if (associationPromises.length > 0) {
        await Promise.allSettled(associationPromises);
      }

      toastUtil.success("Postagem criada com sucesso!");
      router.push(`/postagens/${createdPostagem.id}`);
    } catch (err: any) {
      console.error("Erro ao criar postagem:", err);
      toastUtil.error(err.response?.data?.message || "Erro ao criar postagem.");
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

        <main className="flex-grow container mx-auto p-4 lg:p-8">
          <Breadcrumb
            items={[
              { label: "Convênios", href: "/convenios" },
              { label: "Nova Postagem" },
            ]}
          />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <LayoutTemplate className="text-primary" />
              Nova Postagem
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* COLUNA DO FORMULÁRIO (2/3 da tela) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 border border-red-100">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Título */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Título da Postagem *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border rounded-lg transition-all ${
                        errors.title
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-300 focus:border-primary focus:ring-4 focus:ring-blue-50"
                      } outline-none`}
                      placeholder="Ex: Novo Protocolo de Atendimento..."
                      disabled={submitting}
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs text-red-500 font-medium">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Configurações de Destino e Categoria em Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Visibilidade *
                      </label>
                      <select
                        name="tipoDestino"
                        value={formData.tipoDestino}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-4 focus:ring-blue-50 outline-none bg-white"
                        disabled={submitting}>
                        <option value="geral">Geral (Todos)</option>
                        <option value="equipe">Equipe Específica</option>
                        <option value="convenio">Convênio Específico</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Categoria *
                      </label>
                      <select
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-primary focus:ring-4 focus:ring-blue-50 outline-none bg-white"
                        disabled={submitting}>
                        <option value="GERAL">Geral</option>
                        <option value="AVISO">Aviso Importante</option>
                        <option value="MANUAL">Manual / Tutorial</option>
                        <option value="CONQUISTA">Conquista</option>
                        <option value="ANUNCIO">Anúncio</option>
                      </select>
                    </div>
                  </div>

                  {/* Seleção Condicional de Convênio/Equipe */}
                  {formData.tipoDestino === "convenio" && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <label className="block text-sm font-semibold text-blue-800 mb-2">
                        Selecione o Convênio *
                      </label>
                      <select
                        name="convenioId"
                        value={formData.convenioId}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 border rounded-lg bg-white ${
                          errors.convenioId
                            ? "border-red-300"
                            : "border-blue-200"
                        }`}
                        disabled={submitting}>
                        <option value="">Selecione...</option>
                        {convenios.map((convenio) => (
                          <option key={convenio.id} value={convenio.id}>
                            {convenio.name}
                          </option>
                        ))}
                      </select>
                      {errors.convenioId && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.convenioId}
                        </p>
                      )}
                    </div>
                  )}

                  {formData.tipoDestino === "equipe" && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-100">
                      <label className="block text-sm font-semibold text-green-800 mb-2">
                        Selecione a Equipe *
                      </label>
                      <select
                        name="equipeId"
                        value={formData.equipeId}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 border rounded-lg bg-white ${
                          errors.equipeId
                            ? "border-red-300"
                            : "border-green-200"
                        }`}
                        disabled={submitting}>
                        <option value="">Selecione...</option>
                        {equipes.map((equipe) => (
                          <option key={equipe.id} value={equipe.id}>
                            {equipe.nome}
                          </option>
                        ))}
                      </select>
                      {errors.equipeId && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.equipeId}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Checkbox Destaque */}
                  {canCreatePostagem && (
                    <div className="mb-6">
                      <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.pinned}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              pinned: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          Fixar esta postagem no topo do feed (Destaque)
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Editor */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Conteúdo *
                    </label>
                    <div className="prose-editor-wrapper border rounded-lg overflow-hidden focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-primary transition-all">
                      <SimpleRichEditor
                        value={formData.text}
                        onChange={handleEditorChange}
                        placeholder="Escreva sua postagem aqui... Use a barra de ferramentas para formatar."
                        error={errors.text}
                        disabled={submitting}
                        onImageUpload={async (file: File) => {
                          const imagem =
                            await postagemService.addTempImagem(file);
                          setTempUploads((prev) => ({
                            ...prev,
                            images: [...prev.images, imagem],
                          }));
                          let url = imagem.url;
                          if (!url.startsWith("http") && !url.startsWith("/"))
                            url = "/" + url;
                          return url;
                        }}
                        onFileUpload={async (file: File) => {
                          const anexo =
                            await postagemService.addTempAnexo(file);
                          setTempUploads((prev) => ({
                            ...prev,
                            attachments: [...prev.attachments, anexo],
                          }));
                          return anexo.url;
                        }}
                      />
                    </div>
                    {errors.text && (
                      <p className="mt-1 text-xs text-red-500">{errors.text}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <Eye size={12} /> A primeira imagem inserida será usada
                      automaticamente como capa.
                    </p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <CustomButton
                      type="button"
                      variant="primary"
                      icon={X}
                      onClick={() => router.back()}
                      disabled={submitting}>
                      Cancelar
                    </CustomButton>
                    <CustomButton
                      type="submit"
                      variant="primary"
                      icon={Save}
                      disabled={submitting}
                      className="px-8">
                      {submitting ? "Publicando..." : "Publicar Postagem"}
                    </CustomButton>
                  </div>
                </form>
              </div>
            </div>

            {/* COLUNA DE PREVIEW (1/3 da tela) */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Eye size={16} /> Pré-visualização do Card
                </h3>
                <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-3 text-center">
                    É assim que sua postagem aparecerá no feed de notícias. A
                    orientação da imagem (Horizontal/Vertical) é ajustada
                    automaticamente.
                  </p>
                  {/* Utilizando o PostCard real para preview */}
                  <div className="pointer-events-none select-none">
                    <PostCard
                      postagem={getPreviewPostagem()}
                      onClick={() => {}}
                      showEditButton={false}
                    />
                  </div>
                </div>

                {/* Dicas Rápidas */}
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h4 className="font-semibold text-blue-800 text-sm mb-2">
                    Dicas para uma boa postagem:
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-2 list-disc pl-4">
                    <li>Use títulos claros e objetivos.</li>
                    <li>A primeira imagem define o visual do card.</li>
                    <li>
                      Use <strong>negrito</strong> para destacar informações
                      chave.
                    </li>
                    <li>Anexos são ótimos para documentos oficiais (PDF).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
