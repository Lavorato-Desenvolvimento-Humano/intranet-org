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
  // === GERAÇÃO DE RELATÓRIOS ===

  async gerarRelatorioGeral(
    filters: RelatorioFilterRequest
  ): Promise<RelatorioGeral> {
    const response = await api.post("/relatorios/gerar", filters);
    return response.data;
  }

  async gerarRelatorioUsuario(
    usuarioId: string,
    dataInicio?: string,
    dataFim?: string
  ): Promise<RelatorioGeral> {
    const params = new URLSearchParams();
    if (dataInicio) params.append("dataInicio", dataInicio);
    if (dataFim) params.append("dataFim", dataFim);

    const response = await api.get(
      `/relatorios/usuario/${usuarioId}?${params.toString()}`
    );
    return response.data;
  }

  async gerarRelatorioMudancasStatus(
    dataInicio?: string,
    dataFim?: string,
    usuarioId?: string
  ): Promise<RelatorioGeral> {
    const params = new URLSearchParams();
    if (dataInicio) params.append("dataInicio", dataInicio);
    if (dataFim) params.append("dataFim", dataFim);
    if (usuarioId) params.append("usuarioId", usuarioId);

    const response = await api.get(
      `/relatorios/mudancas-status?${params.toString()}`
    );
    return response.data;
  }

  async gerarRelatorioCriacoes(
    usuarioId: string,
    dataInicio?: string,
    dataFim?: string
  ): Promise<RelatorioGeral> {
    const params = new URLSearchParams();
    params.append("usuarioId", usuarioId);
    if (dataInicio) params.append("dataInicio", dataInicio);
    if (dataFim) params.append("dataFim", dataFim);

    const response = await api.get(`/relatorios/criacoes?${params.toString()}`);
    return response.data;
  }

  async gerarRelatorioEdicoes(
    usuarioId: string,
    dataInicio?: string,
    dataFim?: string
  ): Promise<RelatorioGeral> {
    const params = new URLSearchParams();
    params.append("usuarioId", usuarioId);
    if (dataInicio) params.append("dataInicio", dataInicio);
    if (dataFim) params.append("dataFim", dataFim);

    const response = await api.get(`/relatorios/edicoes?${params.toString()}`);
    return response.data;
  }

  async gerarRelatorioComparativo(
    usuarioIds: string[],
    dataInicio?: string,
    dataFim?: string
  ): Promise<RelatorioGeral> {
    const params = new URLSearchParams();
    if (dataInicio) params.append("dataInicio", dataInicio);
    if (dataFim) params.append("dataFim", dataFim);

    const response = await api.post(
      `/relatorios/comparativo?${params.toString()}`,
      usuarioIds
    );
    return response.data;
  }

  // === COMPARTILHAMENTO DE RELATÓRIOS ===

  async compartilharRelatorio(
    request: CompartilhamentoCreateRequest
  ): Promise<any> {
    const response = await api.post("/relatorios/compartilhar", request);
    return response.data;
  }

  async responderCompartilhamento(
    compartilhamentoId: string,
    request: CompartilhamentoResponseRequest
  ): Promise<any> {
    const response = await api.put(
      `/relatorios/compartilhamentos/${compartilhamentoId}/responder`,
      request
    );
    return response.data;
  }

  async getRelatoriosRecebidos(
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<RelatorioCompartilhamento>> {
    const response = await api.get(
      `/relatorios/compartilhamentos/recebidos?page=${page}&size=${size}`
    );
    return response.data;
  }

  async getRelatoriosEnviados(
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<RelatorioCompartilhamento>> {
    const response = await api.get(
      `/relatorios/compartilhamentos/enviados?page=${page}&size=${size}`
    );
    return response.data;
  }

  async getRelatoriosPendentes(): Promise<RelatorioCompartilhamento[]> {
    const response = await api.get("/relatorios/compartilhamentos/pendentes");
    return response.data;
  }

  async countRelatoriosPendentes(): Promise<{ count: number }> {
    const response = await api.get(
      "/relatorios/compartilhamentos/pendentes/count"
    );
    return response.data;
  }

  async getCompartilhamento(
    compartilhamentoId: string
  ): Promise<RelatorioCompartilhamento> {
    const response = await api.get(
      `/relatorios/compartilhamentos/${compartilhamentoId}`
    );
    return response.data;
  }

  async excluirCompartilhamento(compartilhamentoId: string): Promise<any> {
    const response = await api.delete(
      `/relatorios/compartilhamentos/${compartilhamentoId}`
    );
    return response.data;
  }

  async exportarRelatorioJson(compartilhamentoId: string): Promise<string> {
    const response = await api.get(
      `/relatorios/compartilhamentos/${compartilhamentoId}/exportar`
    );
    return response.data;
  }

  // === ESTATÍSTICAS ===

  async getEstatisticasRelatorios(
    dataInicio?: string,
    dataFim?: string
  ): Promise<Record<string, any>> {
    const params = new URLSearchParams();
    if (dataInicio) params.append("dataInicio", dataInicio);
    if (dataFim) params.append("dataFim", dataFim);

    const response = await api.get(
      `/relatorios/estatisticas?${params.toString()}`
    );
    return response.data;
  }

  // === UTILITÁRIOS ===

  async validarPermissaoVisualizacao(
    compartilhamentoId: string
  ): Promise<{ temPermissao: boolean; message: string }> {
    const response = await api.get(
      `/relatorios/compartilhamentos/${compartilhamentoId}/validar-permissao`
    );
    return response.data;
  }

  // === MÉTODOS AUXILIARES ===

  formatarDataParaInput(data: Date): string {
    return data.toISOString().slice(0, 16); // yyyy-MM-ddThh:mm
  }

  formatarDataParaExibicao(dataString: string): string {
    return new Date(dataString).toLocaleString("pt-BR");
  }

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

  // === DOWNLOAD DE ARQUIVOS ===

  async downloadRelatorioJson(
    compartilhamentoId: string,
    titulo: string
  ): Promise<void> {
    try {
      const response = await api.get(
        `/relatorios/compartilhamentos/${compartilhamentoId}/exportar`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${titulo.replace(/[^a-zA-Z0-9]/g, "_")}_${compartilhamentoId.slice(0, 8)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao fazer download do relatório:", error);
      throw new Error("Erro ao fazer download do relatório");
    }
  }

  // === VALIDAÇÕES ===

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
