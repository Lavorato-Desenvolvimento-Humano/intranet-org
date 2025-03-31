"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import tabelaValoresService, {
  TabelaValoresCreateDto,
} from "@/services/tabelaValores";
import { CustomButton } from "@/components/ui/custom-button";
import convenioService, { ConvenioDto } from "@/services/convenio";

// Componente principal para a estrutura da página
export default function NovaTabelaValoresPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto p-6">
        <Breadcrumb
          items={[
            { label: "Tabelas de Valores", href: "/tabelas-valores" },
            { label: "Nova Tabela" },
          ]}
        />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Nova Tabela de Valores
          </h1>
        </div>

        <Suspense fallback={<Loading message="Carregando..." />}>
          <NovaTabelaContent />
        </Suspense>
      </main>
    </div>
  );
}

// Componente interno que usa useSearchParams
function NovaTabelaContent() {
  const router = useRouter();
  // Importamos o useSearchParams aqui para garantir que esteja dentro do Suspense boundary
  const { useSearchParams } = require("next/navigation");
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [tabela, setTabela] = React.useState<TabelaValoresCreateDto>({
    nome: "",
    descricao: "",
    conteudo: JSON.stringify([
      { especialidade: "", valor: "", observacao: "" },
    ]),
    convenioId: "",
  });
  const [loading, setLoading] = React.useState<boolean>(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [convenios, setConvenios] = React.useState<ConvenioDto[]>([]);
  const [loadingConvenios, setLoadingConvenios] = React.useState<boolean>(true);

  // Verificar se o usuário tem permissão para criar tabelas
  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ADMIN");
  const isEditor =
    user?.roles?.includes("ROLE_EDITOR") || user?.roles?.includes("EDITOR");
  const canCreate = isAdmin || isEditor;

  // Importação dinâmica de serviços e componentes
  const TabelaValoresEditor =
    require("@/components/ui/tabela-valores-editor").default;
  const toastUtil = require("@/utils/toast").default;

  // Carregar convênios e inicializar com o convenioId da URL se existir
  React.useEffect(() => {
    const fetchConvenios = async () => {
      setLoadingConvenios(true);
      try {
        const data = await convenioService.getAllConvenios();
        setConvenios(data);

        // Se tiver convenioId no parâmetro da URL, usar ele
        const convenioId = searchParams.get("convenioId");
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
  }, [searchParams]);

  // Função para validar o formulário
  const validateForm = (): boolean => {
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
  ): void => {
    const { name, value } = e.target;
    setTabela((prev) => ({ ...prev, [name]: value }));
  };

  // Função para lidar com mudanças no conteúdo da tabela
  const handleTabelaChange = (value: string): void => {
    setTabela((prev) => ({ ...prev, conteudo: value }));
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await tabelaValoresService.createTabela(tabela);
      toastUtil.success("Tabela de valores criada com sucesso!");
      router.push("/tabelas-valores");
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

  // Redirecionar se não tem permissão
  React.useEffect(() => {
    if (!canCreate) {
      toastUtil.error("Você não tem permissão para criar tabelas de valores.");
      router.push("/tabelas-valores");
    }
  }, [canCreate, router]);

  if (loadingConvenios) {
    return <Loading message="Carregando..." />;
  }

  return (
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
            disabled={loading}></textarea>
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
            disabled={loading}
            error={errors.conteudo}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <CustomButton
            type="button"
            variant="secondary"
            icon={X}
            onClick={() => router.push("/tabelas-valores")}
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
  );
}
