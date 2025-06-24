package com.intranet.backend.service;

import com.intranet.backend.dto.*;
import com.intranet.backend.model.StatusHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface StatusHistoryService {

    StatusHistoryDto registrarMudancaStatusGuia(UUID guiaId, String statusAnterior, String statusNovo,
                                                String motivo, String observacoes);

    StatusHistoryDto registrarMudancaStatusFicha(UUID fichaId, String statusAnterior, String statusNovo,
                                                 String motivo, String observacoes);

    StatusHistoryDto createStatusHistory(StatusHistoryCreateRequest request);

    List<StatusHistoryDto> getHistoricoEntidade(StatusHistory.EntityType entityType, UUID entityId);

    Page<StatusHistorySummaryDto> getHistoricoEntidadePaginado(StatusHistory.EntityType entityType,
                                                               UUID entityId, Pageable pageable);

    Page<StatusHistorySummaryDto> getHistoricoPorTipo(StatusHistory.EntityType entityType, Pageable pageable);

    Page<StatusHistorySummaryDto> getHistoricoPorUsuario(UUID userId, Pageable pageable);

    Page<StatusHistorySummaryDto> getHistoricoPorStatus(String status, Pageable pageable);

    Page<StatusHistorySummaryDto> getHistoricoPorPeriodo(LocalDateTime startDate, LocalDateTime endDate,
                                                         Pageable pageable);

    Page<StatusHistorySummaryDto> getHistoricoComFiltros(StatusHistoryFilterRequest filters, Pageable pageable);

    StatusHistoryDto getUltimoStatus(StatusHistory.EntityType entityType, UUID entityId);

    long contarMudancasStatus(StatusHistory.EntityType entityType, UUID entityId);

    Map<String, Long> getEstatisticasMudancas(StatusHistory.EntityType entityType);

    void deleteStatusHistory(UUID id);

    List<StatusHistorySummaryDto> gerarRelatorioMudancas(StatusHistory.EntityType entityType,
                                                         LocalDateTime startDate, LocalDateTime endDate);

    Map<String, Object> getDashboardStatistics(LocalDateTime startDate, LocalDateTime endDate);

    Map<String, Object> changeGuiaStatus(UUID guiaId, StatusChangeRequest request);

    Map<String, Object> changeFichaStatus(UUID fichaId, StatusChangeRequest request);

    StatusHistoryDto getHistoricoById(UUID id);

    Page<StatusHistorySummaryDto> getAllHistoricoGeral(Pageable pageable);
}