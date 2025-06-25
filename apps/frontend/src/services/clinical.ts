import api from "./api";
import {
  PacienteDto,
  PacienteSummaryDto,
  PacienteCreateRequest,
  PacienteUpdateRequest,
  GuiaDto,
  GuiaSummaryDto,
  GuiaCreateRequest,
  GuiaUpdateRequest,
  FichaDto,
  FichaSummaryDto,
  FichaCreateRequest,
  FichaAssinaturaCreateRequest,
  FichaUpdateRequest,
  StatusDto,
  StatusCreateRequest,
  StatusUpdateRequest,
  StatusHistoryDto,
  StatusChangeRequest,
  PageResponse,
  ClinicalStats,
  StatusHistorySummaryDto,
} from "@/types/clinical";

export const pacienteService = {
  async getAllPacientes(
    page: number = 0,
    size: number = 20,
    sort: string = "nome"
  ): Promise<PageResponse<PacienteSummaryDto>> {
    const response = await api.get(
      `/api/pacientes?page=${page}&size=${size}&sort=${sort}`
    );
    return response.data;
  },

  async getPacienteById(id: string): Promise<PacienteDto> {
    const response = await api.get(`/api/pacientes/${id}`);
    return response.data;
  },

  async createPaciente(data: PacienteCreateRequest): Promise<PacienteDto> {
    const response = await api.post("/api/pacientes", data);
    return response.data;
  },

  async updatePaciente(
    id: string,
    data: PacienteUpdateRequest
  ): Promise<PacienteDto> {
    const response = await api.put(`/api/pacientes/${id}`, data);
    return response.data;
  },

  async deletePaciente(id: string): Promise<void> {
    await api.delete(`/api/pacientes/${id}`);
  },

  async getPacientesByConvenio(
    convenioId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<PacienteSummaryDto>> {
    const response = await api.get(
      `/api/pacientes/convenio/${convenioId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getPacientesByUnidade(
    unidade: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<PacienteSummaryDto>> {
    const response = await api.get(
      `/api/pacientes/unidade/${unidade}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async searchPacientesByNome(
    nome: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<PacienteSummaryDto>> {
    const response = await api.get(
      `/api/pacientes/search?nome=${nome}&page=${page}&size=${size}`
    );
    return response.data;
  },

  async getGuiasByPaciente(
    pacienteId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<GuiaSummaryDto>> {
    const response = await api.get(
      `/api/pacientes/${pacienteId}/guias?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getPacientesStats(): Promise<any> {
    const response = await api.get("/api/pacientes/stats");
    return response.data;
  },
};

export const guiaService = {
  async getAllGuias(
    page: number = 0,
    size: number = 20,
    sort: string = "createdAt,desc"
  ): Promise<PageResponse<GuiaSummaryDto>> {
    const response = await api.get(
      `/api/guias?page=${page}&size=${size}&sort=${sort}`
    );
    return response.data;
  },

  async getGuiaById(id: string): Promise<GuiaDto> {
    const response = await api.get(`/api/guias/${id}`);
    return response.data;
  },

  async createGuia(data: GuiaCreateRequest): Promise<GuiaDto> {
    const response = await api.post("/api/guias", data);
    return response.data;
  },

  async updateGuia(id: string, data: GuiaUpdateRequest): Promise<GuiaDto> {
    const response = await api.put(`/api/guias/${id}`, data);
    return response.data;
  },

  async deleteGuia(id: string): Promise<void> {
    await api.delete(`/api/guias/${id}`);
  },

  async getFichasByGuiaId(
    guiaId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<FichaSummaryDto>> {
    const response = await api.get(
      `/api/guias/${guiaId}/fichas?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getGuiasByPaciente(
    pacienteId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<GuiaSummaryDto>> {
    const response = await api.get(
      `/api/guias/paciente/${pacienteId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getGuiasByConvenio(
    convenioId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<GuiaSummaryDto>> {
    const response = await api.get(
      `/api/guias/convenios/${convenioId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getGuiasByPeriodo(
    mes: number,
    ano: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<GuiaSummaryDto>> {
    const response = await api.get(
      `/api/guias/periodo/${mes}/${ano}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getGuiasByStatus(
    status: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<GuiaSummaryDto>> {
    const response = await api.get(
      `/api/guias/status/${status}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getGuiasVencidas(
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<GuiaSummaryDto>> {
    const response = await api.get(
      `/api/guias/vencidas?page=${page}&size=${size}`
    );
    return response.data;
  },

  async updateGuiaStatus(
    id: string,
    data: StatusChangeRequest
  ): Promise<GuiaDto> {
    const response = await api.patch(`/api/guias/${id}/status`, data);
    return response.data;
  },

  async getHistoricoStatusGuia(id: string): Promise<StatusHistoryDto[]> {
    const response = await api.get(`/api/guias/${id}/historico-status`);
    return response.data;
  },

  async searchByNumeroGuia(
    numeroGuia: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<GuiaSummaryDto>> {
    const response = await api.get(
      `/api/guias/search/numero?termo=${numeroGuia}&page=${page}&size=${size}`
    );
    return response.data;
  },
};

export const fichaService = {
  async getAllFichas(
    page: number = 0,
    size: number = 20,
    sort: string = "createdAt,desc"
  ): Promise<PageResponse<FichaSummaryDto>> {
    const response = await api.get(
      `/api/fichas?page=${page}&size=${size}&sort=${sort}`
    );
    return response.data;
  },

  async getFichaById(id: string): Promise<FichaDto> {
    const response = await api.get(`/api/fichas/${id}`);
    return response.data;
  },

  async createFicha(data: FichaCreateRequest): Promise<FichaDto> {
    const response = await api.post("/api/fichas", data);
    return response.data;
  },

  async createFichaAssinatura(
    data: FichaAssinaturaCreateRequest
  ): Promise<FichaDto> {
    const response = await api.post("/api/fichas/assinatura", data);
    return response.data;
  },

  async updateFicha(id: string, data: FichaUpdateRequest): Promise<FichaDto> {
    const response = await api.put(`/api/fichas/${id}`, data);
    return response.data;
  },

  async deleteFicha(id: string): Promise<void> {
    await api.delete(`/api/fichas/${id}`);
  },

  async getFichasByGuia(
    guiaId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<FichaSummaryDto>> {
    const response = await api.get(
      `/api/fichas/guia/${guiaId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getFichasByPaciente(
    pacienteId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<FichaSummaryDto>> {
    const response = await api.get(
      `/api/fichas/paciente/${pacienteId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getFichasByConvenio(
    convenioId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<FichaSummaryDto>> {
    const response = await api.get(
      `/api/fichas/convenio/${convenioId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async searchFichasByEspecialidade(
    especialidade: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<FichaSummaryDto>> {
    const response = await api.get(
      `/api/fichas/search?especialidade=${especialidade}&page=${page}&size=${size}`
    );
    return response.data;
  },

  async getFichasByPeriodo(
    mes: number,
    ano: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<FichaSummaryDto>> {
    const response = await api.get(
      `/api/fichas/periodo/${mes}/${ano}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getFichasByStatus(
    status: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<FichaSummaryDto>> {
    const response = await api.get(
      `/api/fichas/status/${status}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getFichasStatsDetalhadas(): Promise<any> {
    const response = await api.get("/api/fichas/stats");
    return response.data;
  },

  async updateFichaStatus(
    id: string,
    data: StatusChangeRequest
  ): Promise<FichaDto> {
    const response = await api.patch(`/api/fichas/${id}/status`, data);
    return response.data;
  },

  async getHistoricoStatusFicha(fichaId: string): Promise<StatusHistoryDto[]> {
    const response = await api.get(`/api/fichas/${fichaId}/historico-status`);
    return response.data;
  },

  async searchByCodigoFicha(
    codigoFicha: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<FichaSummaryDto>> {
    const response = await api.get(
      `/api/fichas/search-codigo?termo=${codigoFicha}&page=${page}&size=${size}`
    );
    return response.data;
  },

  async vincularFichaAGuia(fichaId: string, guiaId: string): Promise<FichaDto> {
    const response = await api.patch(
      `/api/fichas/${fichaId}/vincular-guia/${guiaId}`
    );
    return response.data;
  },
};

export const statusService = {
  async getAllStatuses(): Promise<StatusDto[]> {
    const response = await api.get("/api/status");
    return response.data;
  },

  async getAllStatusesAtivos(): Promise<StatusDto[]> {
    const response = await api.get("/api/status/ativos");
    return response.data;
  },

  async getStatusById(id: string): Promise<StatusDto> {
    const response = await api.get(`/api/status/${id}`);
    return response.data;
  },

  async getStatusByName(status: string): Promise<StatusDto> {
    const response = await api.get(`/api/status/buscar/${status}`);
    return response.data;
  },

  async createStatus(data: StatusCreateRequest): Promise<StatusDto> {
    const response = await api.post("/api/status", data);
    return response.data;
  },

  async updateStatus(
    id: string,
    data: StatusUpdateRequest
  ): Promise<StatusDto> {
    const response = await api.put(`/api/status/${id}`, data);
    return response.data;
  },

  async deleteStatus(id: string): Promise<void> {
    await api.delete(`/api/status/${id}`);
  },

  async toggleStatusAtivo(id: string): Promise<void> {
    await api.patch(`/api/status/${id}/toggle-ativo`);
  },

  async getStatusEnumValues(): Promise<StatusDto[]> {
    const response = await api.get("/api/status/enum-values");
    return response.data;
  },
};

export const statusHistoryService = {
  async getAllHistorico(
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<StatusHistorySummaryDto>> {
    const response = await api.get(
      `/api/status/history?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getHistoricoByEntity(
    entityType: string,
    entityId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<StatusHistorySummaryDto>> {
    const response = await api.get(
      `/api/status/history/entity/${entityType}/${entityId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getHistoricoByUser(
    userId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<StatusHistorySummaryDto>> {
    const response = await api.get(
      `/api/status/history/user/${userId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getHistoricoByPeriodo(
    startDate: string,
    endDate: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<StatusHistorySummaryDto>> {
    const response = await api.get(
      `/api/status/history/periodo?startDate=${startDate}&endDate=${endDate}&page=${page}&size=${size}`
    );
    return response.data;
  },

  async getHistoricoFicha(fichaId: string): Promise<StatusHistoryDto[]> {
    const response = await api.get(`/api/fichas/${fichaId}/historico-status`);
    return response.data;
  },

  async getHistoricoGuia(guiaId: string): Promise<StatusHistoryDto[]> {
    const response = await api.get(`/api/guias/${guiaId}/historico-status`);
    return response.data;
  },

  async getHistoricoById(id: string): Promise<StatusHistoryDto> {
    const response = await api.get(`/api/status/history/${id}`);
    return response.data;
  },
};

export const clinicalStatsService = {
  async getClinicalStats(): Promise<ClinicalStats> {
    const [pacientesStats, guiasStats, fichasStats] = await Promise.all([
      pacienteService.getPacientesStats(),
      api
        .get("/api/guias/stats")
        .then((r) => r.data)
        .catch(() => ({})),
      api
        .get("/api/fichas/stats")
        .then((r) => r.data)
        .catch(() => ({})),
    ]);

    return {
      totalPacientes: pacientesStats.totalPacientes || 0,
      pacientesKids: pacientesStats.pacientesKids || 0,
      pacientesSenior: pacientesStats.pacientesSenior || 0,
      totalGuias: guiasStats.totalGuias || 0,
      guiasVencidas: guiasStats.guiasVencidas || 0,
      guiasComQuantidadeExcedida: guiasStats.guiasComQuantidadeExcedida || 0,
      totalFichas: fichasStats.totalFichas || 0,
      fichasPorStatus: fichasStats.fichasPorStatus || {},
    };
  },
};
