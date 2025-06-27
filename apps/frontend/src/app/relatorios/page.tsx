"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Filter,
  Download,
  Share2,
  Calendar,
  User,
  BarChart3,
  TrendingUp,
  Users,
  Bell,
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Breadcrumb from "@/components/ui/breadcrumb";
import CustomButton from "@/components/ui/custom-button";
import relatorioService, {
  RelatorioFilterRequest,
  RelatorioGeral,
  RelatorioCompartilhamento,
  PaginatedResponse,
} from "@/services/relatorioService";
import userService from "@/services/user";
import toastUtil from "@/utils/toast";

interface User {
  id: string;
  fullName: string;
  email: string;
}

const RelatoriosPage: React.FC = () => {
  // Estados principais
  const [activeTab, setActiveTab] = useState<"gerar" | "compartilhados">(
    "gerar"
  );
  const [loading, setLoading] = useState(false);
  const [relatorioAtual, setRelatorioAtual] = useState<RelatorioGeral | null>(
    null
  );
  const [usuarios, setUsuarios] = useState<User[]>([]);

  // Estados para compartilhamentos
  const [compartilhamentosRecebidos, setCompartilhamentosRecebidos] =
    useState<PaginatedResponse<RelatorioCompartilhamento> | null>(null);
  const [compartilhamentosEnviados, setCompartilhamentosEnviados] =
    useState<PaginatedResponse<RelatorioCompartilhamento> | null>(null);
  const [pendentesCount, setPendentesCount] = useState(0);

  // Estados para filtros
  const [filtros, setFiltros] = useState<RelatorioFilterRequest>({
    dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    dataFim: new Date().toISOString().slice(0, 16),
  });

  // Estados para modais
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState({
    titulo: "",
    usuarioDestinoId: "",
    observacao: "",
  });

  useEffect(() => {
    loadInitialData();
    loadPendentesCount();
  }, []);

  useEffect(() => {
    if (activeTab === "compartilhados") {
      loadCompartilhamentos();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      const usersData = await userService.getAllUsers();
      setUsuarios(usersData);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
      toastUtil.error("Erro ao carregar dados iniciais");
    }
  };

  const loadPendentesCount = async () => {
    try {
      const { count } = await relatorioService.countRelatoriosPendentes();
      setPendentesCount(count);
    } catch (error) {
      console.error("Erro ao carregar count de pendentes:", error);
    }
  };

  const loadCompartilhamentos = async () => {
    try {
      setLoading(true);
      const [recebidos, enviados] = await Promise.all([
        relatorioService.getRelatoriosRecebidos(),
        relatorioService.getRelatoriosEnviados(),
      ]);
      setCompartilhamentosRecebidos(recebidos);
      setCompartilhamentosEnviados(enviados);
    } catch (error) {
      console.error("Erro ao carregar compartilhamentos:", error);
      toastUtil.error("Erro ao carregar compartilhamentos");
    } finally {
      setLoading(false);
    }
  };

  const handleGerarRelatorio = async () => {
    try {
      setLoading(true);

      // Validar filtros
      const erros = relatorioService.validarFiltros(filtros);
      if (erros.length > 0) {
        toastUtil.error(erros.join(", "));
        return;
      }

      const relatorio = await relatorioService.gerarRelatorioGeral(filtros);
      setRelatorioAtual(relatorio);
      toastUtil.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toastUtil.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const handleCompartilhar = async () => {
    if (!relatorioAtual || !shareData.titulo || !shareData.usuarioDestinoId) {
      toastUtil.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await relatorioService.compartilharRelatorio({
        titulo: shareData.titulo,
        dadosRelatorio: relatorioAtual,
        usuarioDestinoId: shareData.usuarioDestinoId,
        observacao: shareData.observacao,
      });

      toastUtil.success("Relatório compartilhado com sucesso!");
      setShowShareModal(false);
      setShareData({ titulo: "", usuarioDestinoId: "", observacao: "" });
      loadCompartilhamentos();
    } catch (error) {
      console.error("Erro ao compartilhar relatório:", error);
      toastUtil.error("Erro ao compartilhar relatório");
    }
  };

  const handleResponderCompartilhamento = async (
    compartilhamentoId: string,
    status: "CONFIRMADO" | "REJEITADO",
    observacao?: string
  ) => {
    try {
      await relatorioService.responderCompartilhamento(compartilhamentoId, {
        status,
        observacaoResposta: observacao,
      });

      toastUtil.success(
        `Compartilhamento ${status.toLowerCase()} com sucesso!`
      );
      loadCompartilhamentos();
      loadPendentesCount();
    } catch (error) {
      console.error("Erro ao responder compartilhamento:", error);
      toastUtil.error("Erro ao responder compartilhamento");
    }
  };

  const handleExcluirCompartilhamento = async (compartilhamentoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este compartilhamento?")) {
      return;
    }

    try {
      await relatorioService.excluirCompartilhamento(compartilhamentoId);
      toastUtil.success("Compartilhamento excluído com sucesso!");
      loadCompartilhamentos();
    } catch (error) {
      console.error("Erro ao excluir compartilhamento:", error);
      toastUtil.error("Erro ao excluir compartilhamento");
    }
  };

  const handleDownloadRelatorio = async (
    compartilhamento: RelatorioCompartilhamento
  ) => {
    try {
      await relatorioService.downloadRelatorioJson(
        compartilhamento.id,
        compartilhamento.titulo
      );
      toastUtil.success("Download iniciado!");
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      toastUtil.error("Erro ao fazer download do relatório");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "CONFIRMADO":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJEITADO":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const breadcrumbItems = [{ label: "Relatórios", href: "/relatorios" }];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Breadcrumb items={breadcrumbItems} />
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <FileText className="mr-2 h-6 w-6" />
              Relatórios do Sistema
            </h1>
            <p className="text-gray-600 mt-1">
              Gere e compartilhe relatórios de atividades do sistema
            </p>
          </div>

          {pendentesCount > 0 && (
            <div className="flex items-center bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
              <Bell className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">
                {pendentesCount} relatório{pendentesCount > 1 ? "s" : ""}{" "}
                pendente{pendentesCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("gerar")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "gerar"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                <BarChart3 className="inline-block mr-2 h-4 w-4" />
                Gerar Relatórios
              </button>
              <button
                onClick={() => setActiveTab("compartilhados")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "compartilhados"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                <Share2 className="inline-block mr-2 h-4 w-4" />
                Compartilhados
                {pendentesCount > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendentesCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === "gerar" && (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Filtros do Relatório
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline mr-1 h-4 w-4" />
                    Data de Início
                  </label>
                  <input
                    type="datetime-local"
                    value={filtros.dataInicio || ""}
                    onChange={(e) =>
                      setFiltros({ ...filtros, dataInicio: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline mr-1 h-4 w-4" />
                    Data de Fim
                  </label>
                  <input
                    type="datetime-local"
                    value={filtros.dataFim || ""}
                    onChange={(e) =>
                      setFiltros({ ...filtros, dataFim: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline mr-1 h-4 w-4" />
                    Usuário Específico
                  </label>
                  <select
                    value={filtros.usuarioId || ""}
                    onChange={(e) =>
                      setFiltros({
                        ...filtros,
                        usuarioId: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Todos os usuários</option>
                    {usuarios.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Entidade
                  </label>
                  <select
                    value={filtros.tipoEntidade || ""}
                    onChange={(e) =>
                      setFiltros({
                        ...filtros,
                        tipoEntidade: e.target.value as
                          | "GUIA"
                          | "FICHA"
                          | undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Guias e Fichas</option>
                    <option value="GUIA">Apenas Guias</option>
                    <option value="FICHA">Apenas Fichas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Ação
                  </label>
                  <select
                    value={filtros.tipoAcao || ""}
                    onChange={(e) =>
                      setFiltros({
                        ...filtros,
                        tipoAcao: e.target.value as
                          | "CRIACAO"
                          | "EDICAO"
                          | "MUDANCA_STATUS"
                          | undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Todas as ações</option>
                    <option value="CRIACAO">Criações</option>
                    <option value="EDICAO">Edições</option>
                    <option value="MUDANCA_STATUS">Mudanças de Status</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: EMITIDO, ANALISE, etc."
                    value={filtros.status || ""}
                    onChange={(e) =>
                      setFiltros({
                        ...filtros,
                        status: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <CustomButton
                  variant="primary"
                  onClick={handleGerarRelatorio}
                  disabled={loading}
                  className="flex items-center">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Gerar Relatório
                    </>
                  )}
                </CustomButton>
              </div>
            </div>

            {/* Resultado do Relatório */}
            {relatorioAtual && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {relatorioAtual.metadata.titulo}
                  </h2>
                  <div className="flex gap-2">
                    <CustomButton
                      variant="primary"
                      onClick={() => setShowShareModal(true)}
                      className="flex items-center">
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar
                    </CustomButton>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {relatorioAtual.totalizacao.totalItens}
                    </div>
                    <div className="text-sm text-blue-600">Total de Itens</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {relatorioAtual.totalizacao.totalGuias}
                    </div>
                    <div className="text-sm text-green-600">Guias</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {relatorioAtual.totalizacao.totalFichas}
                    </div>
                    <div className="text-sm text-purple-600">Fichas</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {relatorioAtual.totalizacao.totalMudancasStatus}
                    </div>
                    <div className="text-sm text-orange-600">
                      Mudanças Status
                    </div>
                  </div>
                </div>

                {/* Agrupamentos */}
                {relatorioAtual.agrupamentos && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {relatorioAtual.agrupamentos.porTipoAcao && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-3">
                          Por Tipo de Ação
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(
                            relatorioAtual.agrupamentos.porTipoAcao
                          ).map(([tipo, count]) => (
                            <div key={tipo} className="flex justify-between">
                              <span className="text-gray-600">
                                {relatorioService.getTipoAcaoDescription(tipo)}
                              </span>
                              <span className="font-medium">
                                {count as number}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {relatorioAtual.agrupamentos.porStatus && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-3">
                          Por Status
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(
                            relatorioAtual.agrupamentos.porStatus
                          ).map(([status, count]) => (
                            <div key={status} className="flex justify-between">
                              <span className="text-gray-600">{status}</span>
                              <span className="font-medium">
                                {count as number}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tabela de Itens */}
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data/Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paciente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ação
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {relatorioAtual.itens.slice(0, 50).map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(item.dataAcao)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.tipoEntidade === "GUIA"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}>
                              {relatorioService.getTipoEntidadeDescription(
                                item.tipoEntidade
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.entidadeDescricao}
                              </span>
                              {item.numeroGuia && (
                                <span className="text-xs text-gray-500">
                                  Guia: {item.numeroGuia}
                                </span>
                              )}
                              {item.codigoFicha && (
                                <span className="text-xs text-gray-500">
                                  Ficha: {item.codigoFicha}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {item.pacienteNome}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {relatorioService.getTipoAcaoDescription(
                                  item.tipoAcao
                                )}
                              </span>
                              {item.statusAnterior && item.statusNovo && (
                                <span className="text-xs text-gray-500">
                                  {item.statusAnterior} → {item.statusNovo}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {item.usuarioResponsavel}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {relatorioAtual.itens.length > 50 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Mostrando primeiros 50 itens de{" "}
                    {relatorioAtual.itens.length} total
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab Compartilhados */}
        {activeTab === "compartilhados" && (
          <div className="space-y-6">
            {/* Subtabs para Recebidos/Enviados */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button className="px-6 py-3 border-b-2 border-blue-500 text-blue-600 font-medium">
                    <Bell className="inline-block mr-2 h-4 w-4" />
                    Recebidos ({compartilhamentosRecebidos?.totalElements || 0})
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : compartilhamentosRecebidos?.content.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhum relatório recebido</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {compartilhamentosRecebidos?.content.map(
                      (compartilhamento) => (
                        <div
                          key={compartilhamento.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                {getStatusIcon(compartilhamento.status)}
                                <h3 className="ml-2 font-semibold text-gray-800">
                                  {compartilhamento.titulo}
                                </h3>
                                <span
                                  className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${relatorioService.getStatusBadgeClass(
                                    compartilhamento.status
                                  )}`}>
                                  {relatorioService.formatarStatus(
                                    compartilhamento.status
                                  )}
                                </span>
                              </div>

                              <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                  <Users className="inline h-4 w-4 mr-1" />
                                  De: {compartilhamento.usuarioOrigemNome}
                                </p>
                                <p>
                                  <Calendar className="inline h-4 w-4 mr-1" />
                                  Enviado em:{" "}
                                  {formatDate(
                                    compartilhamento.dataCompartilhamento
                                  )}
                                </p>
                                {compartilhamento.observacao && (
                                  <p className="text-gray-700 italic">
                                    "{compartilhamento.observacao}"
                                  </p>
                                )}
                                {compartilhamento.dataResposta && (
                                  <p className="text-sm text-gray-500">
                                    Respondido em:{" "}
                                    {formatDate(compartilhamento.dataResposta)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <CustomButton
                                variant="primary"
                                size="small"
                                onClick={() =>
                                  handleDownloadRelatorio(compartilhamento)
                                }>
                                <Download className="h-4 w-4 mr-1" />
                                Ver
                              </CustomButton>

                              {compartilhamento.status === "PENDENTE" && (
                                <div className="flex gap-1">
                                  <CustomButton
                                    variant="primary"
                                    size="small"
                                    onClick={() =>
                                      handleResponderCompartilhamento(
                                        compartilhamento.id,
                                        "CONFIRMADO"
                                      )
                                    }>
                                    <CheckCircle className="h-4 w-4" />
                                  </CustomButton>
                                  <CustomButton
                                    variant="primary"
                                    size="small"
                                    onClick={() =>
                                      handleResponderCompartilhamento(
                                        compartilhamento.id,
                                        "REJEITADO"
                                      )
                                    }>
                                    <XCircle className="h-4 w-4" />
                                  </CustomButton>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Enviados */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b border-gray-200 px-6 py-3">
                <h3 className="font-medium text-gray-800">
                  <Share2 className="inline-block mr-2 h-4 w-4" />
                  Enviados ({compartilhamentosEnviados?.totalElements || 0})
                </h3>
              </div>

              <div className="p-6">
                {compartilhamentosEnviados?.content.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Share2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Nenhum relatório enviado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {compartilhamentosEnviados?.content.map(
                      (compartilhamento) => (
                        <div
                          key={compartilhamento.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                {getStatusIcon(compartilhamento.status)}
                                <h3 className="ml-2 font-semibold text-gray-800">
                                  {compartilhamento.titulo}
                                </h3>
                                <span
                                  className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${relatorioService.getStatusBadgeClass(
                                    compartilhamento.status
                                  )}`}>
                                  {relatorioService.formatarStatus(
                                    compartilhamento.status
                                  )}
                                </span>
                              </div>

                              <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                  <Users className="inline h-4 w-4 mr-1" />
                                  Para: {compartilhamento.usuarioDestinoNome}
                                </p>
                                <p>
                                  <Calendar className="inline h-4 w-4 mr-1" />
                                  Enviado em:{" "}
                                  {formatDate(
                                    compartilhamento.dataCompartilhamento
                                  )}
                                </p>
                                {compartilhamento.observacaoResposta && (
                                  <p className="text-gray-700 italic">
                                    Resposta: "
                                    {compartilhamento.observacaoResposta}"
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              <CustomButton
                                variant="primary"
                                size="small"
                                onClick={() =>
                                  handleDownloadRelatorio(compartilhamento)
                                }>
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </CustomButton>
                              <CustomButton
                                variant="primary"
                                size="small"
                                onClick={() =>
                                  handleExcluirCompartilhamento(
                                    compartilhamento.id
                                  )
                                }>
                                <Trash2 className="h-4 w-4" />
                              </CustomButton>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Compartilhamento */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Compartilhar Relatório
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={shareData.titulo}
                    onChange={(e) =>
                      setShareData({ ...shareData, titulo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Relatório de Atividades - Janeiro 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compartilhar com *
                  </label>
                  <select
                    value={shareData.usuarioDestinoId}
                    onChange={(e) =>
                      setShareData({
                        ...shareData,
                        usuarioDestinoId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Selecione um usuário</option>
                    {usuarios.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observação
                  </label>
                  <textarea
                    value={shareData.observacao}
                    onChange={(e) =>
                      setShareData({ ...shareData, observacao: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Observação opcional..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <CustomButton
                  variant="primary"
                  onClick={() => {
                    setShowShareModal(false);
                    setShareData({
                      titulo: "",
                      usuarioDestinoId: "",
                      observacao: "",
                    });
                  }}>
                  Cancelar
                </CustomButton>
                <CustomButton
                  variant="primary"
                  onClick={handleCompartilhar}
                  disabled={!shareData.titulo || !shareData.usuarioDestinoId}>
                  Compartilhar
                </CustomButton>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RelatoriosPage;
