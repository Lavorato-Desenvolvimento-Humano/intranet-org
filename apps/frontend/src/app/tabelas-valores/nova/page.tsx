// apps/frontend/src/app/tabelas-valores/nova/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import tabelaValoresService, {
  TabelaValoresCreateDto,
} from "@/services/tabelaValores";
import convenioService, { ConvenioDto } from "@/services/convenio";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import TabelaValoresEditor from "@/components/ui/tabela-valores-editor";
import SimpleRichEditor from "@/components/ui/simple-rich-editor";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";

export default function NovaTabelaValoresPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tabela, setTabela] = useState<TabelaValoresCreateDto>({
    nome: "",
    descricao: "",
    conteudo: JSON.stringify([
      { especialidade: "", codigoProcedimento: "", valor: "", observacao: "" },
    ]),
    convenioId: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [loadingConvenios, setLoadingConvenios] = useState(true);
  const [redirected, setRedirected] = useState(false);

  // Verificar se o usuário tem permissão para criar tabelas
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const canCreate = isAdmin || isEditor;

  // Carregar convênios e inicializar com o convenioId da URL se existir
  useEffect(() => {
    const fetchConvenios = async () => {
      setLoadingConvenios(true);
      try {
        const data = await convenioService.getAllConvenios();
        setConvenios(data);

        // Obter parâmetro da URL de forma segura
        const urlParams =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();
        const convenioId = urlParams.get("convenioId");

        if (convenioId) {
          setTabela((prev) => ({
            ...prev,
            convenioId,
          }));
        } else if (data.length > 0) {
          // Se não tiver, usar o primeiro da lista
          setTabela((prev) => ({
            ...prev,
            convenioId: data[0].id,
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar convênios:", err);
        toastUtil.error("Erro ao carregar lista de convênios.");
      } finally {
        setLoadingConvenios(false);
      }
    };

    fetchConvenios();
  }, []);

  // Redirecionar se não tem permissão - com controle para evitar redirecionamentos infinitos
  useEffect(() => {
    if (!canCreate && !redirected && !loadingConvenios) {
      setRedirected(true);
      toastUtil.error("Você não tem permissão para criar tabelas de valores.");
      window.location.href = "/tabelas-valores";
    }
  }, [canCreate, redirected, loadingConvenios]);

  // Função para validar o formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!tabela.nome.trim()) {
      newErrors.nome = "O nome da tabela é obrigatório";
    } else if (tabela.nome.length < 3) {
      newErrors.nome = "O nome deve ter pelo menos 3 caracteres";
    } else if (tabela.nome.length > 255) {
      newErrors.nome = "O nome deve ter no máximo 255 caracteres";
    }

    if (tabela.descricao && tabela.descricao.length > 1000) {
      newErrors.descricao = "A descrição deve ter no máximo 1000 caracteres";
    }

    if (!tabela.convenioId) {
      newErrors.convenioId = "O convênio é obrigatório";
    }

    try {
      const conteudoObj = JSON.parse(tabela.conteudo);
      if (!Array.isArray(conteudoObj) || conteudoObj.length === 0) {
        newErrors.conteudo = "A tabela precisa ter pelo menos uma linha";
      }
    } catch (e) {
      newErrors.conteudo = "Conteúdo da tabela inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para lidar com mudanças nos campos
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setTabela((prev) => ({ ...prev, [name]: value }));
  };

  const handleTabelaChange = (value: string) => {
    setTabela((prev) => ({ ...prev, conteudo: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await tabelaValoresService.createTabela(tabela);
      toastUtil.success("Tabela de valores criada com sucesso!");
      window.location.href = "/tabelas-valores";
    } catch (err: any) {
      console.error("Erro ao criar tabela de valores:", err);
      toastUtil.error(
        err.response?.data?.message ||
          "Erro ao criar tabela de valores. Tente novamente mais tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = "/tabelas-valores";
  };

  if (loadingConvenios) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto p-6">
            <Loading message="Carregando..." />
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
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Tabelas de Valores", href: "/tabelas-valores" },
              { label: "Nova Tabela" },
            ]}
          />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Nova Tabela de Valores
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={tabela.nome}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.nome ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                  placeholder="Digite o nome da tabela"
                  disabled={loading}
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-500">{errors.nome}</p>
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
                  value={tabela.convenioId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.convenioId ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                  disabled={loading}>
                  {convenios.length === 0 ? (
                    <option value="">Nenhum convênio disponível</option>
                  ) : (
                    convenios.map((convenio) => (
                      <option key={convenio.id} value={convenio.id}>
                        {convenio.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.convenioId && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.convenioId}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="descricao"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <SimpleRichEditor
                  value={tabela.descricao || ""}
                  onChange={(value) =>
                    setTabela((prev) => ({ ...prev, descricao: value }))
                  }
                  placeholder="Digite uma descrição para a tabela (opcional)"
                  disabled={loading}
                  error={errors.descricao}
                />
                {errors.descricao && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.descricao}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valores *
                </label>

                <TabelaValoresEditor
                  value={tabela.conteudo}
                  onChange={handleTabelaChange}
                  disabled={loading}
                  error={errors.conteudo}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <CustomButton
                  type="button"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 text-white border-none"
                  icon={X}
                  onClick={handleCancel}
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
    </ProtectedRoute>
  );
}
