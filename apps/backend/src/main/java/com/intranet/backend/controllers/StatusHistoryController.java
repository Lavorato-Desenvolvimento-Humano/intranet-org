package com.intranet.backend.controllers;

import com.intranet.backend.dto.*;
import com.intranet.backend.model.StatusHistory;
import com.intranet.backend.service.StatusHistoryService;
import com.intranet.backend.util.ResponseUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/status-history")
@RequiredArgsConstructor
public class StatusHistoryController {

    private static final Logger logger = LoggerFactory.getLogger(StatusHistoryController.class);
    private final StatusHistoryService statusHistoryService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('status_history:write') or hasRole('ADMIN')")
    public ResponseEntity<StatusHistoryDto> createStatusHistory(@Valid @RequestBody StatusHistoryCreateRequest request) {
        logger.info("Requisição para criar registro de histórico de status para {} ID: {}",
                request.getEntityType(), request.getEntityId());

        StatusHistoryDto createdHistory = statusHistoryService.createStatusHistory(request);
        return ResponseUtil.created(createdHistory);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('status_history:delete') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStatusHistory(@PathVariable UUID id) {
        logger.info("Requisição para deletar registro de histórico ID: {}", id);

        statusHistoryService.deleteStatusHistory(id);
        return ResponseUtil.noContent();
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    @PreAuthorize("hasAnyAuthority('status_history:read') or hasRole('ADMIN')")
    public ResponseEntity<List<StatusHistoryDto>> getHistoricoEntidade(
            @PathVariable StatusHistory.EntityType entityType,
            @PathVariable UUID entityId) {
        logger.info("Requisição para buscar histórico da entidade {} ID: {}", entityType, entityId);

        List<StatusHistoryDto> historico = statusHistoryService.getHistoricoEntidade(entityType, entityId);
        return ResponseUtil.success(historico);
    }

    @GetMapping("/entity/{entityType}/{entityId}/paginated")
    @PreAuthorize("hasAnyAuthority('status_history:read') or hasRole('ADMIN')")
    public ResponseEntity<Page<StatusHistorySummaryDto>> getHistoricoEntidadePaginado(
            @PathVariable StatusHistory.EntityType entityType,
            @PathVariable UUID entityId,
            @PageableDefault(size = 20, sort = "dataAlteracao") Pageable pageable) {
        logger.info("Requisição para buscar histórico paginado da entidade {} ID: {}", entityType, entityId);

        Page<StatusHistorySummaryDto> historico = statusHistoryService
                .getHistoricoEntidadePaginado(entityType, entityId, pageable);
        return ResponseUtil.success(historico);
    }

    @GetMapping("/latest/{entityType}/{entityId}")
    @PreAuthorize("hasAnyAuthority('status_history:read') or hasRole('ADMIN')")
    public ResponseEntity<StatusHistoryDto> getUltimoStatus(
            @PathVariable StatusHistory.EntityType entityType,
            @PathVariable UUID entityId) {
        logger.info("Requisição para buscar último status da entidade {} ID: {}", entityType, entityId);

        StatusHistoryDto ultimoStatus = statusHistoryService.getUltimoStatus(entityType, entityId);
        return ResponseUtil.success(ultimoStatus);
    }

    @GetMapping("/count/{entityType}/{entityId}")
    @PreAuthorize("hasAnyAuthority('status_history:read') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> contarMudancasStatus(
            @PathVariable StatusHistory.EntityType entityType,
            @PathVariable UUID entityId) {
        logger.info("Requisição para contar mudanças de status da entidade {} ID: {}", entityType, entityId);

        long count = statusHistoryService.contarMudancasStatus(entityType, entityId);
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);

        return ResponseUtil.success(response);
    }

    @GetMapping("/type/{entityType}")
    @PreAuthorize("hasAnyAuthority('status_history:read') or hasRole('ADMIN')")
    public ResponseEntity<Page<StatusHistorySummaryDto>> getHistoricoPorTipo(
            @PathVariable StatusHistory.EntityType entityType,
            @PageableDefault(size = 20, sort = "dataAlteracao") Pageable pageable) {
        logger.info("Requisição para buscar histórico por tipo: {}", entityType);

        Page<StatusHistorySummaryDto> historico = statusHistoryService.getHistoricoPorTipo(entityType, pageable);
        return ResponseUtil.success(historico);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyAuthority('status_history:read') or hasRole('ADMIN')")
    public ResponseEntity<Page<StatusHistorySummaryDto>> getHistoricoPorUsuario(
            @PathVariable UUID userId,
            @PageableDefault(size = 20, sort = "dataAlteracao") Pageable pageable) {
        logger.info("Requisição para buscar histórico por usuário: {}", userId);

        Page<StatusHistorySummaryDto> historico = statusHistoryService.getHistoricoPorUsuario(userId, pageable);
        return ResponseUtil.success(historico);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyAuthority('status_history:read') or hasRole('ADMIN')")
    public ResponseEntity<Page<StatusHistorySummaryDto>> getHistoricoPorStatus(
            @PathVariable String status,
            @PageableDefault(size = 20, sort = "dataAlteracao") Pageable pageable) {
        logger.info("Requisição para buscar histórico por status: {}", status);

        Page<StatusHistorySummaryDto> historico = statusHistoryService.getHistoricoPorStatus(status, pageable);
        return ResponseUtil.success(historico);
    }

    @GetMapping("/period")
    @PreAuthorize("hasAnyAuthority('status_history:read') or hasRole('ADMIN')")
    public ResponseEntity<Page<StatusHistorySummaryDto>> getHistoricoPorPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 20, sort = "dataAlteracao") Pageable pageable) {
        logger.info("Requisição para buscar histórico por período: {} a {}", startDate, endDate);

        Page<StatusHistorySummaryDto> historico = statusHistoryService
                .getHistoricoPorPeriodo(startDate, endDate, pageable);
        return ResponseUtil.success(historico);
    }

    @PostMapping("/search")
    @PreAuthorize("hasAnyAuthority('status_history:read') or hasRole('ADMIN')")
    public ResponseEntity<Page<StatusHistorySummaryDto>> searchComFiltros(
            @Valid @RequestBody StatusHistoryFilterRequest filters,
            @PageableDefault(size = 20, sort = "dataAlteracao") Pageable pageable) {
        logger.info("Requisição para buscar histórico com filtros: {}", filters);

        Page<StatusHistorySummaryDto> historico = statusHistoryService
                .getHistoricoComFiltros(filters, pageable);
        return ResponseUtil.success(historico);
    }

    @GetMapping("/statistics/{entityType}")
    @PreAuthorize("hasAnyAuthority('status_history:read') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getEstatisticasMudancas(
            @PathVariable StatusHistory.EntityType entityType) {
        logger.info("Requisição para estatísticas de mudanças do tipo: {}", entityType);

        Map<String, Long> estatisticas = statusHistoryService.getEstatisticasMudancas(entityType);
        return ResponseUtil.success(estatisticas);
    }

    @GetMapping("/report/{entityType}")
    @PreAuthorize("hasAnyAuthority('status_history:read') or hasRole('ADMIN')")
    public ResponseEntity<List<StatusHistorySummaryDto>> gerarRelatorioMudancas(
            @PathVariable StatusHistory.EntityType entityType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        logger.info("Requisição para relatório de mudanças do tipo {} no período {} a {}",
                entityType, startDate, endDate);

        List<StatusHistorySummaryDto> relatorio = statusHistoryService
                .gerarRelatorioMudancas(entityType, startDate, endDate);
        return ResponseUtil.success(relatorio);
    }

    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasAnyAuthority('status_history:read') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        logger.info("Requisição para estatísticas do dashboard de histórico (período: {} a {})", startDate, endDate);

        Map<String, Object> stats = statusHistoryService.getDashboardStatistics(startDate, endDate);
        return ResponseUtil.success(stats);
    }

    @PatchMapping("/guia/{guiaId}/status")
    @PreAuthorize("hasAnyAuthority('guia:update', 'status_history:write') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> changeGuiaStatus(
            @PathVariable UUID guiaId,
            @Valid @RequestBody StatusChangeRequest request) {
        logger.info("Requisição para alterar status da guia ID: {} para '{}'", guiaId, request.getNovoStatus());

        Map<String, Object> result = statusHistoryService.changeGuiaStatus(guiaId, request);
        return ResponseUtil.success(result);
    }

    @PatchMapping("/ficha/{fichaId}/status")
    @PreAuthorize("hasAnyAuthority('ficha:update', 'status_history:write') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> changeFichaStatus(
            @PathVariable UUID fichaId,
            @Valid @RequestBody StatusChangeRequest request) {
        logger.info("Requisição para alterar status da ficha ID: {} para '{}'", fichaId, request.getNovoStatus());

        Map<String, Object> result = statusHistoryService.changeFichaStatus(fichaId, request);
        return ResponseUtil.success(result);
    }

    @GetMapping("/guia/{guiaId}/history")
    @PreAuthorize("hasAnyAuthority('status_history:read', 'guia:read') or hasRole('ADMIN')")
    public ResponseEntity<List<StatusHistoryDto>> getGuiaStatusHistory(@PathVariable UUID guiaId) {
        logger.info("Requisição para buscar histórico de status da guia: {}", guiaId);

        List<StatusHistoryDto> historico = statusHistoryService
                .getHistoricoEntidade(StatusHistory.EntityType.GUIA, guiaId);
        return ResponseUtil.success(historico);
    }

    @GetMapping("/ficha/{fichaId}/history")
    @PreAuthorize("hasAnyAuthority('status_history:read', 'ficha:read') or hasRole('ADMIN')")
    public ResponseEntity<List<StatusHistoryDto>> getFichaStatusHistory(@PathVariable UUID fichaId) {
        logger.info("Requisição para buscar histórico de status da ficha: {}", fichaId);

        List<StatusHistoryDto> historico = statusHistoryService
                .getHistoricoEntidade(StatusHistory.EntityType.FICHA, fichaId);
        return ResponseUtil.success(historico);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "StatusHistoryController");
        health.put("timestamp", LocalDateTime.now());
        health.put("version", "1.0.0");

        return ResponseUtil.success(health);
    }
}