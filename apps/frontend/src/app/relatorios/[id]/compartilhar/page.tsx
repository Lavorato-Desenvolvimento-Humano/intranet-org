"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Send,
  User,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import relatorioService from "@/services/relatorio";
import userService from "@/services/user";
import {
  RelatorioDto,
  RelatorioCompartilhamentoRequest,
} from "@/types/relatorio";
import { UserDto } from "@/services/user";
import toastUtil from "@/utils/toast";

interface FormData {
  usuarioDestinoId: string;
  observacao: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function CompartilharRelatorioPage() {
  const router = useRouter();
  const params = useParams();
  const relatorioId = params.id as string;

  // Estados principais
  const [relatorio, setRelatorio] = useState<RelatorioDto | null>(null);
  const [usuarios, setUsuarios] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState<FormData>({
    usuarioDestinoId: "",
    observacao: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar relatório
        const relatorioData =
          await relatorioService.getRelatorioById(relatorioId);
        setRelatorio(relatorioData);

        // Carregar usuários
        const usuariosData = await userService.getAllUsers();
        setUsuarios(usuariosData);
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        setError(err.response?.data?.message || "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [relatorioId]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.usuarioDestinoId) {
      errors.usuarioDestinoId = "Selecione um usuário para compartilhar";
    }

    if (formData.observacao.length > 500) {
      errors.observacao = "Observação deve ter no máximo 500 caracteres";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo quando usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toastUtil.error("Por favor, corrija os erros no formulário");
      return;
    }

    try {
      setSaving(true);

      const request: RelatorioCompartilhamentoRequest = {
        usuarioDestinoId: formData.usuarioDestinoId,
        observacao: formData.observacao.trim() || undefined,
      };

      await relatorioService.compartilharRelatorio(relatorioId, request);

      toastUtil.success("Relatório compartilhado com sucesso!");
      router.push(`/relatorios/${relatorioId}`);
    } catch (error: any) {
      console.error("Erro ao compartilhar relatório:", error);
      toastUtil.error(
        error.response?.data?.message || "Erro ao compartilhar relatório"
      );
    } finally {
      setSaving(false);
    }
  };

  // Filtrar usuários baseado na busca
  const usuariosFiltrados = usuarios.filter(
    (usuario) =>
      usuario.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando dados..." />
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !relatorio) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {error || "Relatório não encontrado"}
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />

        <main className="flex-grow container mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <CustomButton
                variant="primary"
                onClick={() => router.back()}
                className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </CustomButton>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Share2 className="mr-2 h-6 w-6" />
                  Compartilhar Relatório
                </h1>
                <p className="text-gray-600 mt-1">
                  Compartilhe este relatório com outros usuários
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações do Relatório */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Detalhes do Relatório
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Título</p>
                    <p className="text-gray-900 font-medium">
                      {relatorio.titulo}
                    </p>
                  </div>

                  {relatorio.descricao && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Descrição
                      </p>
                      <p className="text-gray-700 text-sm">
                        {relatorio.descricao}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Criado por
                    </p>
                    <p className="text-gray-900">
                      {relatorio.usuarioGeradorNome}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total de Registros
                    </p>
                    <p className="text-gray-900 font-semibold">
                      {relatorio.totalRegistros.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        relatorio.statusRelatorio === "CONCLUIDO"
                          ? "bg-green-100 text-green-800"
                          : relatorio.statusRelatorio === "PROCESSANDO"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}>
                      {relatorio.statusRelatorio}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário de Compartilhamento */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-6">
                    Selecionar Usuário
                  </h2>

                  {/* Campo de busca */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar usuário
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite o nome ou email do usuário..."
                    />
                  </div>

                  {/* Lista de usuários */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Usuário de destino *
                    </label>

                    <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md">
                      {usuariosFiltrados.length > 0 ? (
                        <div className="space-y-1 p-2">
                          {usuariosFiltrados.map((usuario) => (
                            <label
                              key={usuario.id}
                              className={`flex items-center p-3 rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                                formData.usuarioDestinoId === usuario.id
                                  ? "bg-blue-50 border border-blue-200"
                                  : "border border-transparent"
                              }`}>
                              <input
                                type="radio"
                                name="usuarioDestino"
                                value={usuario.id}
                                checked={
                                  formData.usuarioDestinoId === usuario.id
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    "usuarioDestinoId",
                                    e.target.value
                                  )
                                }
                                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex items-center">
                                <div className="bg-gray-200 rounded-full p-2 mr-3">
                                  <User className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {usuario.fullName}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {usuario.email}
                                  </p>
                                  {usuario.roles &&
                                    usuario.roles.length > 0 && (
                                      <p className="text-xs text-gray-500">
                                        {usuario.roles.join(", ")}
                                      </p>
                                    )}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {searchTerm
                            ? "Nenhum usuário encontrado"
                            : "Carregando usuários..."}
                        </div>
                      )}
                    </div>

                    {formErrors.usuarioDestinoId && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.usuarioDestinoId}
                      </p>
                    )}
                  </div>

                  {/* Campo de observação */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="h-4 w-4 inline mr-1" />
                      Observação (Opcional)
                    </label>
                    <textarea
                      value={formData.observacao}
                      onChange={(e) =>
                        handleInputChange("observacao", e.target.value)
                      }
                      rows={4}
                      maxLength={500}
                      className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.observacao
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Adicione uma mensagem para o destinatário (opcional)..."
                    />
                    <div className="flex justify-between mt-1">
                      {formErrors.observacao ? (
                        <p className="text-red-500 text-sm flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {formErrors.observacao}
                        </p>
                      ) : (
                        <span></span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formData.observacao.length}/500
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end space-x-4">
                  <CustomButton
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
                    disabled={saving}>
                    Cancelar
                  </CustomButton>

                  <CustomButton
                    type="submit"
                    variant="primary"
                    disabled={saving}
                    className="min-w-32">
                    {saving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Compartilhando...
                      </div>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Compartilhar
                      </>
                    )}
                  </CustomButton>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
