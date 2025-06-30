"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Download,
  Inbox,
  Send,
  User,
  FileBarChart,
  CheckCircle,
  Clock,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/auth/ProtectedRoute";
import { Loading } from "@/components/ui/loading";
import { CustomButton } from "@/components/ui/custom-button";
import { DataTable } from "@/components/clinical/ui/DataTable";
import { Pagination } from "@/components/ui/pagination";
import relatorioService from "@/services/relatorio";
import {
  RelatorioCompartilhamentoDto,
  CompartilhamentoPageResponse,
} from "@/types/relatorio";
import { formatDate, formatDateTime } from "@/utils/dateUtils";
import toastUtil from "@/utils/toast";

export default function CompartilhamentosRecebidosPage() {
  const router = useRouter();

  // Estados principais
  const [compartilhamentos, setCompartilhamentos] =
    useState<CompartilhamentoPageResponse>({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 0,
    });

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  // Carregar dados iniciais
  useEffect(() => {
    loadCompartilhamentos();
  }, [currentPage]);

  const loadCompartilhamentos = async () => {
    try {
      setLoading(true);
      const data = await relatorioService.getCompartilhamentosRecebidos(
        currentPage,
        20
      );
      setCompartilhamentos(data);
    } catch (error: any) {
      console.error("Erro ao carregar compartilhamentos recebidos:", error);
      toastUtil.error("Erro ao carregar compartilhamentos recebidos");
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarComoVisualizado = async (compartilhamentoId: string) => {
    try {
      await relatorioService.marcarCompartilhamentoComoVisualizado(
        compartilhamentoId
      );
      toastUtil.success("Marcado como visualizado!");
      await loadCompartilhamentos();
    } catch (error: any) {
      toastUtil.error("Erro ao marcar como visualizado");
    }
  };

  const handleViewRelatorio = async (
    compartilhamento: RelatorioCompartilhamentoDto
  ) => {
    // Se não visualizado, marcar como visualizado
    if (!compartilhamento.visualizado) {
      await handleMarcarComoVisualizado(compartilhamento.id);
    }

    router.push(`/relatorios/${compartilhamento.relatorioId}`);
  };

  const handleDownloadPDF = async (
    compartilhamento: RelatorioCompartilhamentoDto
  ) => {
    try {
      const blob = await relatorioService.baixarRelatorioPDF(
        compartilhamento.relatorioId
      );
      const filename = `relatorio-${compartilhamento.relatorioTitulo.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
      relatorioService.downloadFile(blob, filename);
      toastUtil.success("Download iniciado!");
    } catch (error: any) {
      toastUtil.error("Erro ao baixar relatório");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1);
  };

  // Componente para badge de status de visualização
  const VisualizacaoBadge = ({ visualizado }: { visualizado: boolean }) => {
    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
          visualizado
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}>
        {visualizado ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Visualizado
          </>
        ) : (
          <>
            <Clock className="h-3 w-3 mr-1" />
            Não visualizado
          </>
        )}
      </span>
    );
  };

  // Colunas para tabela
  const colunas = [
    {
      header: "Relatório",
      accessor: ((compartilhamento: RelatorioCompartilhamentoDto) => (
        <div>
          <p className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
            {compartilhamento.relatorioTitulo}
          </p>
        </div>
      )) as any,
      onClick: (compartilhamento: RelatorioCompartilhamentoDto) =>
        handleViewRelatorio(compartilhamento),
    },
    {
      header: "Compartilhado por",
      accessor: ((compartilhamento: RelatorioCompartilhamentoDto) => (
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-gray-400" />
          {compartilhamento.usuarioOrigemNome}
        </div>
      )) as any,
    },
    {
      header: "Data",
      accessor: ((compartilhamento: RelatorioCompartilhamentoDto) =>
        formatDateTime(compartilhamento.dataCompartilhamento)) as any,
    },
    {
      header: "Status",
      accessor: ((compartilhamento: RelatorioCompartilhamentoDto) => (
        <VisualizacaoBadge visualizado={compartilhamento.visualizado} />
      )) as any,
    },
    {
      header: "Observação",
      accessor: ((compartilhamento: RelatorioCompartilhamentoDto) =>
        compartilhamento.observacao ? (
          <span
            className="text-sm text-gray-600"
            title={compartilhamento.observacao}>
            {compartilhamento.observacao.length > 50
              ? `${compartilhamento.observacao.substring(0, 50)}...`
              : compartilhamento.observacao}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )) as any,
    },
    {
      header: "Ações",
      accessor: ((compartilhamento: RelatorioCompartilhamentoDto) => (
        <div className="flex space-x-2">
          <CustomButton
            variant="primary"
            size="small"
            onClick={() => handleViewRelatorio(compartilhamento)}
            title="Visualizar relatório">
            <Eye className="h-4 w-4" />
          </CustomButton>

          <CustomButton
            variant="primary"
            size="small"
            onClick={() => handleDownloadPDF(compartilhamento)}
            title="Baixar PDF">
            <Download className="h-4 w-4" />
          </CustomButton>

          {!compartilhamento.visualizado && (
            <CustomButton
              variant="secondary"
              size="small"
              onClick={() => handleMarcarComoVisualizado(compartilhamento.id)}
              title="Marcar como visualizado">
              <CheckCircle className="h-4 w-4" />
            </CustomButton>
          )}
        </div>
      )) as any,
      className: "text-center",
    },
  ];

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
                  <Inbox className="mr-2 h-6 w-6" />
                  Compartilhamentos Recebidos
                </h1>
                <p className="text-gray-600 mt-1">
                  Relatórios compartilhados comigo por outros usuários
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <CustomButton
                variant="secondary"
                onClick={() =>
                  router.push("/relatorios/compartilhamentos/enviados")
                }>
                <Send className="h-4 w-4 mr-2" />
                Compartilhamentos Enviados
              </CustomButton>

              <CustomButton
                variant="primary"
                onClick={() => router.push("/relatorios")}>
                <FileBarChart className="h-4 w-4 mr-2" />
                Todos os Relatórios
              </CustomButton>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="bg-white rounded-lg shadow-md">
            {loading ? (
              <div className="p-8">
                <Loading message="Carregando compartilhamentos recebidos..." />
              </div>
            ) : (
              <>
                {/* Estatísticas rápidas */}
                <div className="p-6 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <Inbox className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">
                            Total Recebidos
                          </p>
                          <p className="text-xl font-bold text-blue-900">
                            {compartilhamentos.totalElements}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-yellow-100 p-2 rounded-full mr-3">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-yellow-600 font-medium">
                            Não Visualizados
                          </p>
                          <p className="text-xl font-bold text-yellow-900">
                            {
                              compartilhamentos.content.filter(
                                (c) => !c.visualizado
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-green-600 font-medium">
                            Visualizados
                          </p>
                          <p className="text-xl font-bold text-green-900">
                            {
                              compartilhamentos.content.filter(
                                (c) => c.visualizado
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabela de compartilhamentos */}
                {compartilhamentos.content.length > 0 ? (
                  <>
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Lista de Compartilhamentos
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {compartilhamentos.totalElements} compartilhamentos
                        encontrados
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <DataTable
                        data={compartilhamentos}
                        columns={colunas}
                        loading={false}
                        onPageChange={handlePageChange}
                      />
                    </div>

                    {/* Paginação */}
                    {compartilhamentos.totalPages > 1 && (
                      <div className="p-6 border-t border-gray-200">
                        <Pagination
                          currentPage={currentPage + 1}
                          totalPages={compartilhamentos.totalPages}
                          onPageChange={handlePageChange}
                          totalItems={compartilhamentos.totalElements}
                          pageSize={compartilhamentos.size}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center">
                    <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Inbox className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum compartilhamento recebido
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Você ainda não recebeu nenhum relatório compartilhado.
                    </p>
                    <CustomButton
                      variant="primary"
                      onClick={() => router.push("/relatorios")}>
                      <FileBarChart className="h-4 w-4 mr-2" />
                      Ver Todos os Relatórios
                    </CustomButton>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dicas úteis */}
          {!loading && compartilhamentos.content.length > 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                💡 Dicas úteis:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Clique no título do relatório para visualizá-lo</li>
                <li>
                  • Relatórios não visualizados ficam destacados em amarelo
                </li>
                <li>• Use o botão de download para salvar o PDF localmente</li>
                <li>• Marque como visualizado para organizar sua lista</li>
              </ul>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
