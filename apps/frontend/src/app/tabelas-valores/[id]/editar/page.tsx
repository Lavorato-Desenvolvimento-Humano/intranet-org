"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, X, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import tabelaValoresService, {
  TabelaValoresDto,
  TabelaValoresCreateDto,
} from "@/services/tabelaValores";
import convenioService, { ConvenioDto } from "@/services/convenio";
import toastUtil from "@/utils/toast";
import { CustomButton } from "@/components/ui/custom-button";
import TabelaValoresEditor from "@/components/ui/tabela-valores-editor";

export default function EditarTabelaValoresPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [tabela, setTabela] = useState<TabelaValoresCreateDto>({
    nome: "",
    descricao: "",
    conteudo: "",
    convenioId: "",
  });
  const [originalTabela, setOriginalTabela] = useState<TabelaValoresDto | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [convenios, setConvenios] = useState<ConvenioDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [redirected, setRedirected] = useState(false);

  const tabelaId = params?.id as string;

  // Verificar se o usuário tem permissão para editar tabelas
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const canEdit = isAdmin || isEditor;

  // Buscar dados da tabela e convênios
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Buscar em paralelo
        const [tabelaData, conveniosData] = await Promise.all([
          tabelaValoresService.getTabelaById(tabelaId),
          convenioService.getAllConvenios(),
        ]);

        setOriginalTabela(tabelaData);
        setTabela({
          nome: tabelaData.nome,
          descricao: tabelaData.descricao || "",
          conteudo: tabelaData.conteudo,
          convenioId: tabelaData.convenioId,
        });
        setConvenios(conveniosData);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError(
          "Não foi possível carregar os dados necessários. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    if (tabelaId) {
      fetchData();
    }
  }, [tabelaId]);

  // Redirecionar se não tem permissão com controle para evitar loops infinitos
  useEffect(() => {
    if (!loading && !canEdit && !redirected) {
      setRedirected(true);
      toastUtil.error("Você não tem permissão para editar tabelas de valores.");
      router.push(`/tabelas-valores/${tabelaId}`);
    }
  }, [loading, canEdit, tabelaId, router, redirected]);

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

  // Função para lidar com mudanças no conteúdo da tabela
  const handleTabelaChange = (value: string) => {
    setTabela((prev) => ({ ...prev, conteudo: value }));
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await tabelaValoresService.updateTabela(tabelaId, tabela);
      toastUtil.success("Tabela de valores atualizada com sucesso!");
      router.push(`/tabelas-valores/${tabelaId}`);
    } catch (err: any) {
      console.error("Erro ao atualizar tabela de valores:", err);
      toastUtil.error(
        err.response?.data?.message ||
          "Erro ao atualizar tabela de valores. Tente novamente mais tarde."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Função melhorada para cancelar e voltar à página anterior
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar comportamento padrão
    router.push(`/tabelas-valores/${tabelaId}`);
  };

  // Renderização condicional para carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <Loading message="Carregando dados da tabela..." />
        </main>
      </div>
    );
  }

  // Renderização condicional para erro
  if (error || !originalTabela) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            {error || "Tabela não encontrada."}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              router.push("/tabelas-valores");
            }}
            className="flex items-center text-primary hover:text-primary-dark">
            <ArrowLeft size={16} className="mr-1" />
            Voltar para a lista de tabelas
          </button>
        </main>
      </div>
    );
  }

  // Renderização principal
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto p-6">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Tabelas de Valores", href: "/tabelas-valores" },
            {
              label: originalTabela.nome,
              href: `/tabelas-valores/${tabelaId}`,
            },
            { label: "Editar" },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Editar Tabela de Valores
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
                disabled={submitting}
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
                disabled={submitting}>
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
            <div className="mb-4">
              <label
                htmlFor="descricao"
                className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={tabela.descricao}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.descricao ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                placeholder="Digite uma descrição para a tabela (opcional)"
                disabled={submitting}></textarea>
              {errors.descricao && (
                <p className="mt-1 text-sm text-red-500">{errors.descricao}</p>
              )}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valores *
              </label>

              <TabelaValoresEditor
                value={tabela.conteudo}
                onChange={handleTabelaChange}
                disabled={submitting}
                error={errors.conteudo}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <CustomButton
                type="button"
                variant="secondary"
                icon={X}
                onClick={handleCancel}
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
        </div>
      </main>
    </div>
  );
}
