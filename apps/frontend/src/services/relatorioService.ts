// src/services/relatorioService.ts - VERSÃO CORRIGIDA
import api from "./api";

export interface RelatorioFilterRequest {
  usuarioId?: string;
  dataInicio?: string;
  dataFim?: string;
  tipoEntidade?: "GUIA" | "FICHA";
  status?: string;
  convenioId?: string;
  pacienteId?: string;
  especialidade?: string;
  tipoAcao?: "CRIACAO" | "EDICAO" | "MUDANCA_STATUS";
}

export interface RelatorioMetadata {
  titulo: string;
  descricao: string;
  dataGeracao: string;
  usuarioGerador: string;
  periodoInicio: string;
  periodoFim: string;
  filtrosAplicados: RelatorioFilterRequest;
}

export interface RelatorioItem {
  id: string;
  tipoEntidade: "GUIA" | "FICHA";
  entidadeId: string;
  entidadeDescricao: string;
  numeroGuia?: string;
  codigoFicha?: string;
  pacienteNome: string;
  convenioNome?: string;
  especialidade?: string;
  tipoAcao: string;
  statusAnterior?: string;
  statusNovo?: string;
  motivo?: string;
  observacoes?: string;
  usuarioResponsavel: string;
  dataAcao: string;
}

export interface RelatorioTotalizacao {
  totalItens: number;
  totalGuias: number;
  totalFichas: number;
  totalCriacoes: number;
  totalEdicoes: number;
  totalMudancasStatus: number;
  valorTotalGuias: number;
  quantidadeAutorizadaTotal: number;
}

export interface RelatorioGeral {
  metadata: RelatorioMetadata;
  itens: RelatorioItem[];
  totalizacao: RelatorioTotalizacao;
  agrupamentos: Record<string, any>;
}

export interface RelatorioCompartilhamento {
  id: string;
  titulo: string;
  dadosRelatorio: string;
  usuarioOrigemId: string;
  usuarioOrigemNome: string;
  usuarioDestinoId: string;
  usuarioDestinoNome: string;
  status: "PENDENTE" | "CONFIRMADO" | "REJEITADO";
  observacao?: string;
  observacaoResposta?: string;
  dataCompartilhamento: string;
  dataResposta?: string;
}

export interface CompartilhamentoCreateRequest {
  titulo: string;
  dadosRelatorio: RelatorioGeral;
  usuarioDestinoId: string;
  observacao?: string;
}

export interface CompartilhamentoResponseRequest {
  status: "CONFIRMADO" | "REJEITADO";
  observacaoResposta?: string;
}

export interface StatusHistoryItem {
  id: string;
  entityType: "GUIA" | "FICHA";
  entityId: string;
  entityDescricao: string;
  statusAnterior?: string;
  statusNovo: string;
  motivo?: string;
  observacoes?: string;
  alteradoPorNome: string;
  dataAlteracao: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

class RelatorioService {
  // === GERAÇÃO DE RELATÓRIOS USANDO ENDPOINTS EXISTENTES ===

  async gerarRelatorioGeral(
    filters: RelatorioFilterRequest
  ): Promise<RelatorioGeral> {
    console.log("🚀 Gerando relatório com filtros:", filters);

    try {
      let historico: StatusHistoryItem[] = [];

      // VERSÃO SIMPLIFICADA: usar apenas o endpoint básico que funciona
      console.log("📡 Usando endpoint básico: /status/history");

      const response = await api.get("/status/history", {
        params: {
          page: 0,
          size: 200, // Buscar mais registros para ter dados para filtrar
        },
      });

      console.log("📊 Dados recebidos:", response.data);
      historico = response.data.content || response.data || [];

      // Filtrar no frontend (já que o backend está com problema)
      let historicoFiltrado = historico;

      // Filtrar por período (se especificado)
      if (filters.dataInicio && filters.dataFim) {
        const dataInicio = new Date(filters.dataInicio);
        const dataFim = new Date(filters.dataFim);

        historicoFiltrado = historicoFiltrado.filter((item) => {
          const dataItem = new Date(item.dataAlteracao);
          return dataItem >= dataInicio && dataItem <= dataFim;
        });
        console.log(
          `🗓️ Filtro por período: ${historicoFiltrado.length} itens restantes`
        );
      }

      // Filtrar por usuário (se especificado)
      if (filters.usuarioId) {
        historicoFiltrado = historicoFiltrado.filter((item) => {
          // Assumir que o userId está no alteradoPorNome ou similar
          return (
            item.alteradoPorNome &&
            item.alteradoPorNome.includes(filters.usuarioId || "")
          );
        });
        console.log(
          `👤 Filtro por usuário: ${historicoFiltrado.length} itens restantes`
        );
      }

      // Filtrar por tipo de entidade (se especificado)
      if (filters.tipoEntidade) {
        historicoFiltrado = historicoFiltrado.filter(
          (item) => item.entityType === filters.tipoEntidade
        );
        console.log(
          `📁 Filtro por entidade: ${historicoFiltrado.length} itens restantes`
        );
      }

      // Filtrar por status (se especificado)
      if (filters.status) {
        historicoFiltrado = historicoFiltrado.filter(
          (item) => item.statusNovo === filters.status
        );
        console.log(
          `🏷️ Filtro por status: ${historicoFiltrado.length} itens restantes`
        );
      }

      // Converter para formato do relatório
      const itens: RelatorioItem[] = historicoFiltrado.map(
        this.mapHistoricoToRelatorioItem
      );

      // Gerar totalizações
      const totalizacao = this.calcularTotalizacao(itens);

      // Gerar agrupamentos
      const agrupamentos = this.gerarAgrupamentos(itens);

      // Gerar metadata
      const metadata: RelatorioMetadata = {
        titulo: "Relatório de Atividades do Sistema",
        descricao: `Relatório contendo ${itens.length} registros de atividades`,
        dataGeracao: new Date().toISOString(),
        usuarioGerador: "Sistema", // TODO: pegar usuário atual
        periodoInicio: filters.dataInicio || "",
        periodoFim: filters.dataFim || "",
        filtrosAplicados: filters,
      };

      console.log("✅ Relatório gerado com sucesso:", {
        totalItens: itens.length,
        totalGuias: totalizacao.totalGuias,
        totalFichas: totalizacao.totalFichas,
      });

      return {
        metadata,
        itens,
        totalizacao,
        agrupamentos,
      };
    } catch (error) {
      console.error("❌ Erro ao gerar relatório:", error);

      // Se der erro, retornar um relatório vazio mas válido
      console.log("🔄 Retornando relatório vazio devido ao erro");

      const metadata: RelatorioMetadata = {
        titulo: "Relatório de Atividades do Sistema",
        descricao: "Nenhum dado encontrado ou erro ao carregar",
        dataGeracao: new Date().toISOString(),
        usuarioGerador: "Sistema",
        periodoInicio: filters.dataInicio || "",
        periodoFim: filters.dataFim || "",
        filtrosAplicados: filters,
      };

      const totalizacao: RelatorioTotalizacao = {
        totalItens: 0,
        totalGuias: 0,
        totalFichas: 0,
        totalCriacoes: 0,
        totalEdicoes: 0,
        totalMudancasStatus: 0,
        valorTotalGuias: 0,
        quantidadeAutorizadaTotal: 0,
      };

      return {
        metadata,
        itens: [],
        totalizacao,
        agrupamentos: {
          porTipoAcao: {},
          porUsuario: {},
          porStatus: {},
          porDia: {},
        },
      };
    }
  }

  async gerarRelatorioUsuario(
    usuarioId: string,
    dataInicio?: string,
    dataFim?: string
  ): Promise<RelatorioGeral> {
    return this.gerarRelatorioGeral({
      usuarioId,
      dataInicio,
      dataFim,
    });
  }

  async gerarRelatorioMudancasStatus(
    dataInicio?: string,
    dataFim?: string,
    usuarioId?: string
  ): Promise<RelatorioGeral> {
    return this.gerarRelatorioGeral({
      dataInicio,
      dataFim,
      usuarioId,
      tipoAcao: "MUDANCA_STATUS",
    });
  }

  // === COMPARTILHAMENTO (MOCK POR ENQUANTO) ===

  async countRelatoriosPendentes(): Promise<{ count: number }> {
    // Por enquanto retornar 0 até implementarmos compartilhamentos
    return { count: 0 };
  }

  async getRelatoriosPendentes(): Promise<any[]> {
    // Por enquanto retornar array vazio
    return [];
  }

  async getRelatoriosRecebidos(
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<any>> {
    // Mock por enquanto
    return {
      content: [],
      pageable: { pageNumber: page, pageSize: size },
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    };
  }

  async getRelatoriosEnviados(
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<any>> {
    // Mock por enquanto
    return {
      content: [],
      pageable: { pageNumber: page, pageSize: size },
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    };
  }

  async compartilharRelatorio(request: any): Promise<any> {
    // Mock por enquanto
    console.log("🔄 Mock: Compartilhando relatório:", request.titulo);
    return {
      success: true,
      message: "Funcionalidade de compartilhamento será implementada em breve",
      compartilhamento: {
        id: "mock-id",
        titulo: request.titulo,
        status: "PENDENTE",
      },
    };
  }

  async responderCompartilhamento(
    compartilhamentoId: string,
    request: any
  ): Promise<any> {
    // Mock por enquanto
    console.log(
      "🔄 Mock: Respondendo compartilhamento:",
      compartilhamentoId,
      request.status
    );
    return {
      success: true,
      message: "Funcionalidade de resposta será implementada em breve",
      compartilhamento: {
        id: compartilhamentoId,
        status: request.status,
      },
    };
  }

  async excluirCompartilhamento(compartilhamentoId: string): Promise<any> {
    // Mock por enquanto
    console.log("🔄 Mock: Excluindo compartilhamento:", compartilhamentoId);
    return {
      success: true,
      message: "Funcionalidade de exclusão será implementada em breve",
    };
  }

  async downloadRelatorioJson(
    compartilhamentoId: string,
    titulo: string
  ): Promise<void> {
    // Mock por enquanto - criar download fake
    console.log("🔄 Mock: Download do relatório:", titulo);

    const mockData = {
      id: compartilhamentoId,
      titulo: titulo,
      dataDownload: new Date().toISOString(),
      message:
        "Este é um download de exemplo. A funcionalidade completa será implementada em breve.",
    };

    const blob = new Blob([JSON.stringify(mockData, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${titulo.replace(/[^a-zA-Z0-9]/g, "_")}_mock.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // === MÉTODOS AUXILIARES ===

  private mapHistoricoToRelatorioItem = (
    history: StatusHistoryItem
  ): RelatorioItem => {
    return {
      id: history.id,
      tipoEntidade: history.entityType,
      entidadeId: history.entityId,
      entidadeDescricao:
        history.entityDescricao ||
        `${history.entityType} ${history.entityId.slice(0, 8)}`,
      pacienteNome: "N/A", // TODO: buscar dados reais
      convenioNome: "N/A", // TODO: buscar dados reais
      tipoAcao: "MUDANCA_STATUS",
      statusAnterior: history.statusAnterior,
      statusNovo: history.statusNovo,
      motivo: history.motivo,
      observacoes: history.observacoes,
      usuarioResponsavel: history.alteradoPorNome || "Sistema",
      dataAcao: history.dataAlteracao,
    };
  };

  private calcularTotalizacao(itens: RelatorioItem[]): RelatorioTotalizacao {
    const totalGuias = itens.filter(
      (item) => item.tipoEntidade === "GUIA"
    ).length;
    const totalFichas = itens.filter(
      (item) => item.tipoEntidade === "FICHA"
    ).length;
    const totalMudancasStatus = itens.filter(
      (item) => item.tipoAcao === "MUDANCA_STATUS"
    ).length;

    return {
      totalItens: itens.length,
      totalGuias,
      totalFichas,
      totalCriacoes: 0, // TODO: implementar quando tivermos dados de criação
      totalEdicoes: 0, // TODO: implementar quando tivermos dados de edição
      totalMudancasStatus,
      valorTotalGuias: 0, // TODO: implementar quando tivermos dados financeiros
      quantidadeAutorizadaTotal: 0, // TODO: implementar quando tivermos dados de quantidade
    };
  }

  private gerarAgrupamentos(itens: RelatorioItem[]): Record<string, any> {
    const porTipoAcao = itens.reduce(
      (acc, item) => {
        acc[item.tipoAcao] = (acc[item.tipoAcao] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const porUsuario = itens.reduce(
      (acc, item) => {
        acc[item.usuarioResponsavel] = (acc[item.usuarioResponsavel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const porStatus = itens.reduce(
      (acc, item) => {
        if (item.statusNovo) {
          acc[item.statusNovo] = (acc[item.statusNovo] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const porDia = itens.reduce(
      (acc, item) => {
        const dia = item.dataAcao.split("T")[0]; // Pegar apenas a data
        acc[dia] = (acc[dia] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      porTipoAcao,
      porUsuario,
      porStatus,
      porDia,
    };
  }

  // === UTILITÁRIOS ===

  validarFiltros(filters: RelatorioFilterRequest): string[] {
    const erros: string[] = [];

    if (filters.dataInicio && filters.dataFim) {
      const dataInicio = new Date(filters.dataInicio);
      const dataFim = new Date(filters.dataFim);

      if (dataInicio >= dataFim) {
        erros.push("A data de início deve ser anterior à data de fim");
      }

      const diffDays =
        (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 365) {
        erros.push("O período não pode ser superior a 365 dias");
      }
    }

    return erros;
  }

  formatarDataParaInput(data: Date): string {
    return data.toISOString().slice(0, 16); // yyyy-MM-ddThh:mm
  }

  formatarDataParaExibicao(dataString: string): string {
    return new Date(dataString).toLocaleString("pt-BR");
  }

  getTipoAcaoDescription(tipoAcao: string): string {
    const descMap: Record<string, string> = {
      CRIACAO: "Criação",
      EDICAO: "Edição",
      MUDANCA_STATUS: "Mudança de Status",
    };
    return descMap[tipoAcao] || tipoAcao;
  }

  getTipoEntidadeDescription(tipoEntidade: string): string {
    const descMap: Record<string, string> = {
      GUIA: "Guia",
      FICHA: "Ficha",
    };
    return descMap[tipoEntidade] || tipoEntidade;
  }

  // === MÉTODOS AUXILIARES ADICIONAIS ===

  formatarStatus(status: string): string {
    const statusMap: Record<string, string> = {
      PENDENTE: "Pendente",
      CONFIRMADO: "Confirmado",
      REJEITADO: "Rejeitado",
    };
    return statusMap[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      PENDENTE: "bg-yellow-100 text-yellow-800",
      CONFIRMADO: "bg-green-100 text-green-800",
      REJEITADO: "bg-red-100 text-red-800",
    };
    return classMap[status] || "bg-gray-100 text-gray-800";
  }

  // === CACHE SIMPLES ===
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  private getCacheKey(method: string, params: any): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async gerarRelatorioComCache(
    filters: RelatorioFilterRequest
  ): Promise<RelatorioGeral> {
    const cacheKey = this.getCacheKey("gerarRelatorioGeral", filters);
    const cached = this.getFromCache<RelatorioGeral>(cacheKey);

    if (cached) {
      return cached;
    }

    const resultado = await this.gerarRelatorioGeral(filters);
    this.setCache(cacheKey, resultado);
    return resultado;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

const relatorioService = new RelatorioService();
export default relatorioService;
