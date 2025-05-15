"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Save,
  X,
  ArrowLeft,
  Plus,
  Trash,
  Image as ImageIcon,
  Paperclip,
  Table as TableIcon,
  Edit,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import postagemService, {
  PostagemDto,
  ImagemDto,
  AnexoDto,
  PostagemCreateDto,
} from "@/services/postagem";
import convenioService, { ConvenioDto } from "@/services/convenio";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import dynamic from "next/dynamic";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import RichTextPreview from "@/components/ui/rich-text-preview";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import equipeService, { EquipeDto } from "@/services/equipe";

// Importar o editor de texto rico dinamicamente para evitar problemas de SSR
const SimpleRichEditor = dynamic(
  () => import("@/components/ui/simple-rich-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse bg-gray-100 rounded-md"></div>
    ),
  }
);

export default function EditarPostagemPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [postagem, setPostagem] = useState<PostagemDto | null>(null);
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    text: "",
    tipoDestino: "convenio" as "geral" | "equipe" | "convenio",
    convenioId: "",
    equipeId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"conteudo" | "imagens" | "anexos">(
    "conteudo"
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const [equipes, setEquipes] = useState<EquipeDto[]>([]); // Adicionei o estado para equipes
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{
    show: boolean;
    type: "imagem" | "anexo";
    id: string;
    name: string;
    isDeleting: boolean;
  } | null>(null);

  const postagemId = params?.id as string;

  // Verificar permissões
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");

  // Carregar convênios e dados da postagem
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Carregar dados em paralelo
        const [postagemData, conveniosData, equipesData] = await Promise.all([
          postagemService.getPostagemById(postagemId),
          convenioService.getAllConvenios(),
          equipeService.getAllEquipes(),
        ]);

        setPostagem(postagemData);
        setConvenios(conveniosData);
        setEquipes(equipesData);

        // Detectar automaticamente o tipo de destino com base nos dados carregados
        let tipoDestino: "geral" | "equipe" | "convenio" = "geral";

        if (postagemData.equipeId) {
          tipoDestino = "equipe";
        } else if (postagemData.convenioId) {
          tipoDestino = "convenio";
        }

        // Preencher formulário com dados da postagem
        setFormData({
          title: postagemData.title || "",
          text: postagemData.text || "",
          tipoDestino: tipoDestino,
          convenioId: postagemData.convenioId || "",
          equipeId: postagemData.equipeId || "",
        });
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Não foi possível carregar os dados da postagem.");
      } finally {
        setLoading(false);
      }
    };

    if (postagemId) {
      fetchData();
    }
  }, [postagemId]);

  // Verificar se o usuário atual é o autor da postagem
  const isAuthor = () => {
    return user && postagem && user.id === postagem.createdById;
  };

  // Verificar se o usuário pode editar a postagem
  const canEdit = () => {
    return isAdmin || isEditor || isAuthor();
  };

  // Função para validar o formulário
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

    // Validar campos específicos com base no tipo de destino
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
      // Tipo "geral" não precisa de validação adicional
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

    // Lógica especial para quando o tipo de destino muda
    if (name === "tipoDestino") {
      const newTipoDestino = value as "geral" | "equipe" | "convenio";

      // Limpar valores de campos não relacionados ao tipo selecionado
      setFormData((prev) => ({
        ...prev,
        tipoDestino: newTipoDestino,
        // Limpar convenioId se não for "convenio"
        convenioId: newTipoDestino === "convenio" ? prev.convenioId : "",
        // Limpar equipeId se não for "equipe"
        equipeId: newTipoDestino === "equipe" ? prev.equipeId : "",
      }));
    } else {
      // Para outros campos, atualize normalmente
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Dados para atualizar a postagem, usando undefined em vez de null
      const updateData: PostagemCreateDto = {
        title: formData.title,
        text: formData.text,
        tipoDestino: formData.tipoDestino,
        convenioId:
          formData.tipoDestino === "convenio" ? formData.convenioId : undefined,
        equipeId:
          formData.tipoDestino === "equipe" ? formData.equipeId : undefined,
      };

      const updatedPostagem = await postagemService.updatePostagem(
        postagemId,
        updateData
      );

      toastUtil.success("Postagem atualizada com sucesso!");
      router.push(`/postagens/${updatedPostagem.id}`);
    } catch (err: any) {
      console.error("Erro ao atualizar postagem:", err);

      if (err.response?.data?.message) {
        toastUtil.error(err.response.data.message);
      } else {
        toastUtil.error(
          "Erro ao atualizar postagem. Tente novamente mais tarde."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Função para adicionar uma nova imagem
  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const description = window.prompt("Descrição da imagem (opcional):");

    setUploadingImage(true);
    try {
      const novaImagem = await postagemService.addImagem(
        postagemId,
        file,
        description || undefined
      );

      // Atualizar a lista de imagens localmente
      if (postagem) {
        setPostagem({
          ...postagem,
          imagens: [...postagem.imagens, novaImagem],
        });
      }

      toastUtil.success("Imagem adicionada com sucesso!");

      // Limpar input para permitir selecionar o mesmo arquivo novamente
      e.target.value = "";
    } catch (err) {
      console.error("Erro ao adicionar imagem:", err);
      toastUtil.error("Erro ao adicionar imagem. Tente novamente.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Função para adicionar um novo anexo
  const handleAddAnexo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    setUploadingAnexo(true);
    try {
      const novoAnexo = await postagemService.addAnexo(postagemId, file);

      // Atualizar a lista de anexos localmente
      if (postagem) {
        setPostagem({
          ...postagem,
          anexos: [...postagem.anexos, novoAnexo],
        });
      }

      toastUtil.success("Anexo adicionado com sucesso!");

      // Limpar input para permitir selecionar o mesmo arquivo novamente
      e.target.value = "";
    } catch (err) {
      console.error("Erro ao adicionar anexo:", err);
      toastUtil.error("Erro ao adicionar anexo. Tente novamente.");
    } finally {
      setUploadingAnexo(false);
    }
  };

  // Função para confirmar exclusão de um item
  const confirmDeleteItemAction = (
    type: "imagem" | "anexo",
    id: string,
    name: string
  ) => {
    setConfirmDeleteItem({
      show: true,
      type,
      id,
      name,
      isDeleting: false,
    });
  };

  // Função para processar a exclusão do item confirmada
  const handleDeleteItem = async () => {
    if (!confirmDeleteItem) return;

    const { type, id } = confirmDeleteItem;

    setConfirmDeleteItem({ ...confirmDeleteItem, isDeleting: true });

    try {
      if (type === "imagem") {
        await postagemService.deleteImagem(id);
        // Atualizar a lista localmente
        if (postagem) {
          setPostagem({
            ...postagem,
            imagens: postagem.imagens.filter((img) => img.id !== id),
          });
        }
      } else if (type === "anexo") {
        await postagemService.deleteAnexo(id);
        // Atualizar a lista localmente
        if (postagem) {
          setPostagem({
            ...postagem,
            anexos: postagem.anexos.filter((anexo) => anexo.id !== id),
          });
        }
      }

      toastUtil.success(
        `${type === "imagem" ? "Imagem" : "Anexo"} excluído(a) com sucesso!`
      );
    } catch (err) {
      console.error(`Erro ao excluir ${type}:`, err);
      toastUtil.error(`Erro ao excluir ${type}. Tente novamente.`);
    } finally {
      setConfirmDeleteItem(null);
    }
  };

  // Verificar se o usuário tem permissão para editar antes de renderizar
  useEffect(() => {
    if (!loading && !canEdit()) {
      toastUtil.error("Você não tem permissão para editar esta postagem.");
      router.push(`/postagens/${postagemId}`);
    }
  }, [loading, postagemId, router]);

  // Renderizar tela de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando dados da postagem..." />
        </main>
      </div>
    );
  }

  if (error || !postagem) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            {error || "Postagem não encontrada."}
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

  const hasImagens = postagem.imagens && postagem.imagens.length > 0;
  const hasAnexos = postagem.anexos && postagem.anexos.length > 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          <Breadcrumb
            items={[
              { label: "Convênios", href: "/convenios" },
              {
                label: postagem.convenioName ?? "Convênio",
                href: `/convenios/${postagem.convenioId}`,
              },
              {
                label: postagem.title,
                href: `/postagens/${postagemId}`,
              },
              { label: "Editar" },
            ]}
          />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Editar Postagem
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Navegação entre abas de edição */}
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap -mb-px">
                <button
                  onClick={() => setActiveTab("conteudo")}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "conteudo"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}>
                  Conteúdo
                </button>
                <button
                  onClick={() => setActiveTab("imagens")}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "imagens"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}>
                  <div className="flex items-center">
                    <ImageIcon size={16} className="mr-2" />
                    Imagens {hasImagens && `(${postagem.imagens.length})`}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("anexos")}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === "anexos"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}>
                  <div className="flex items-center">
                    <Paperclip size={16} className="mr-2" />
                    Anexos {hasAnexos && `(${postagem.anexos.length})`}
                  </div>
                </button>
              </nav>
            </div>

            {/* Conteúdo da aba selecionada */}
            <div className="p-6">
              {activeTab === "conteudo" && (
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
                      <p className="mt-1 text-sm text-red-500">
                        {errors.title}
                      </p>
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

                  {/* Renderização condicional para Convênio */}
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
                          errors.convenioId
                            ? "border-red-500"
                            : "border-gray-300"
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

                  {/* Renderização condicional para Equipe */}
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
                      onChange={handleChange}
                      placeholder="Digite o conteúdo da postagem..."
                      height="400px"
                      error={errors.text}
                      disabled={submitting}
                      onImageUpload={async (file: File) => {
                        try {
                          // Chamar a API para adicionar imagem
                          const imagem = await postagemService.addImagem(
                            postagemId,
                            file
                          );

                          // Atualizar a lista de imagens localmente
                          if (postagem) {
                            setPostagem({
                              ...postagem,
                              imagens: [...postagem.imagens, imagem],
                            });
                          }

                          return imagem.url;
                        } catch (error) {
                          console.error(
                            "Erro ao fazer upload da imagem:",
                            error
                          );
                          toastUtil.error(
                            "Erro ao fazer upload da imagem. Tente novamente."
                          );
                          throw error;
                        }
                      }}
                      onFileUpload={async (file: File) => {
                        try {
                          // Chamar a API para adicionar anexo
                          const anexo = await postagemService.addAnexo(
                            postagemId,
                            file
                          );

                          // Atualizar a lista de anexos localmente
                          if (postagem) {
                            setPostagem({
                              ...postagem,
                              anexos: [...postagem.anexos, anexo],
                            });
                          }

                          return anexo.url;
                        } catch (error) {
                          console.error(
                            "Erro ao fazer upload do anexo:",
                            error
                          );
                          toastUtil.error(
                            "Erro ao fazer upload do anexo. Tente novamente."
                          );
                          throw error;
                        }
                      }}
                    />
                    {errors.text && (
                      <p className="mt-1 text-sm text-red-500">{errors.text}</p>
                    )}

                    {/* Componente de pré-visualização */}
                    <RichTextPreview content={formData.text} />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <CustomButton
                      type="button"
                      variant="primary"
                      className="bg-red-600 hover:bg-red-700 text-white border-none"
                      icon={X}
                      onClick={() => router.push(`/postagens/${postagemId}`)}
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
              )}

              {activeTab === "imagens" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Imagens
                    </h2>
                    <div>
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleAddImage}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      <label htmlFor="image-upload">
                        <CustomButton
                          type="button"
                          variant="primary"
                          icon={Plus}
                          className="cursor-pointer"
                          disabled={uploadingImage}
                          onClick={() =>
                            document.getElementById("image-upload")?.click()
                          }>
                          {uploadingImage ? "Enviando..." : "Adicionar Imagem"}
                        </CustomButton>
                      </label>
                    </div>
                  </div>

                  {!hasImagens ? (
                    <div className="bg-gray-50 p-8 text-center rounded-md">
                      <ImageIcon
                        size={48}
                        className="mx-auto text-gray-400 mb-2"
                      />
                      <p className="text-gray-600 mb-4">
                        Esta postagem ainda não possui imagens.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {postagem.imagens.map((imagem) => (
                        <div
                          key={imagem.id}
                          className="bg-gray-50 p-4 rounded-lg relative group">
                          <button
                            onClick={() =>
                              confirmDeleteItemAction(
                                "imagem",
                                imagem.id,
                                `Imagem ${imagem.description || ""}`
                              )
                            }
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Excluir imagem">
                            <Trash size={16} />
                          </button>
                          <img
                            src={imagem.url}
                            alt={imagem.description || "Imagem"}
                            className="w-full h-48 object-cover rounded-lg mb-2"
                          />
                          {imagem.description && (
                            <p className="text-sm text-gray-600 text-center">
                              {imagem.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "anexos" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Anexos
                    </h2>
                    <div>
                      <input
                        type="file"
                        id="anexo-upload"
                        onChange={handleAddAnexo}
                        className="hidden"
                        disabled={uploadingAnexo}
                      />
                      <label htmlFor="anexo-upload">
                        <CustomButton
                          type="button"
                          variant="primary"
                          icon={Plus}
                          className="cursor-pointer"
                          disabled={uploadingAnexo}
                          onClick={() =>
                            document.getElementById("anexo-upload")?.click()
                          }>
                          {uploadingAnexo ? "Enviando..." : "Adicionar Anexo"}
                        </CustomButton>
                      </label>
                    </div>
                  </div>

                  {!hasAnexos ? (
                    <div className="bg-gray-50 p-8 text-center rounded-md">
                      <Paperclip
                        size={48}
                        className="mx-auto text-gray-400 mb-2"
                      />
                      <p className="text-gray-600 mb-4">
                        Esta postagem ainda não possui anexos.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {postagem.anexos.map((anexo) => (
                        <div
                          key={anexo.id}
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group">
                          <div className="mr-3 text-gray-400">
                            <Paperclip size={20} />
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-medium text-gray-700">
                              {anexo.nameFile}
                            </p>
                            <p className="text-xs text-gray-500">
                              {anexo.typeFile}
                            </p>
                          </div>
                          <div className="flex">
                            <a
                              href={anexo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-primary hover:text-primary-dark"
                              title="Baixar anexo">
                              <Save size={18} />
                            </a>
                            <button
                              onClick={() =>
                                confirmDeleteItemAction(
                                  "anexo",
                                  anexo.id,
                                  anexo.nameFile
                                )
                              }
                              className="p-2 text-red-500 hover:text-red-700"
                              title="Excluir anexo">
                              <Trash size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Diálogo de confirmação de exclusão de item */}
        {confirmDeleteItem && (
          <ConfirmDialog
            isOpen={true}
            title={`Excluir ${
              confirmDeleteItem.type === "imagem" ? "Imagem" : "Anexo"
            }`}
            message={`Tem certeza que deseja excluir ${
              confirmDeleteItem.type === "imagem"
                ? "esta imagem"
                : confirmDeleteItem.type === "anexo"
                  ? `o anexo "${confirmDeleteItem.name}"`
                  : `a ${confirmDeleteItem.name}`
            }? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            onConfirm={handleDeleteItem}
            onCancel={() => setConfirmDeleteItem(null)}
            isLoading={confirmDeleteItem.isDeleting}
            variant="danger"
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
