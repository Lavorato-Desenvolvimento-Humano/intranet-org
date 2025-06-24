package com.intranet.backend.controllers;

import com.intranet.backend.dto.StatusCreateRequest;
import com.intranet.backend.dto.StatusDto;
import com.intranet.backend.dto.StatusHistorySummaryDto;
import com.intranet.backend.dto.StatusUpdateRequest;
import com.intranet.backend.model.StatusHistory;
import com.intranet.backend.service.StatusHistoryService;
import com.intranet.backend.service.StatusService;
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
@RequestMapping("/api/status")
@RequiredArgsConstructor
public class StatusController {

    private static final Logger logger = LoggerFactory.getLogger(StatusController.class);
    private final StatusHistoryService statusHistoryService;
    private final StatusService statusService;

    @GetMapping
    public ResponseEntity<List<StatusDto>> getAllStatuses() {
        logger.info("Requisição para listar todos os status");

        List<StatusDto> statuses = statusService.getAllStatuses();
        if (statuses.isEmpty()) {
            logger.warn("Nenhum status encontrado");
            return ResponseEntity.noContent().build();
        }

        logger.info("Total de status encontrados: {}", statuses.size());
        return ResponseEntity.ok(statuses);
    }

    @GetMapping("/ativos")
    public ResponseEntity<List<StatusDto>> getAllStatusesAtivos() {
        logger.info("Requisição para listar status ativos");

        List<StatusDto> statuses = statusService.getAllStatusesAtivos();
        logger.info("Total de status ativos encontrados: {}", statuses.size());
        return ResponseEntity.ok(statuses);
    }

    @GetMapping("/enum-values")
    public ResponseEntity<List<StatusDto>> getStatusEnumValues() {
        logger.info("Requisição para listar valores do enum de status");

        List<StatusDto> enumValues = statusService.getStatusEnumValues();
        return ResponseEntity.ok(enumValues);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StatusDto> getStatusById(@PathVariable UUID id) {
        logger.info("Requisição para buscar status com ID: {}", id);

        StatusDto status = statusService.getStatusById(id);
        return ResponseUtil.success(status);
    }

    @GetMapping("/buscar/{status}")
    public ResponseEntity<StatusDto> getStatusByName(@PathVariable String status) {
        logger.info("Requisição para buscar status por nome: {}", status);

        StatusDto statusDto = statusService.findByStatus(status);
        return ResponseUtil.success(statusDto);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<StatusDto> createStatus(@Valid @RequestBody StatusCreateRequest request) {
        logger.info("Requisição para criar novo status: {}", request.getStatus());

        StatusDto createdStatus = statusService.createStatus(request);
        logger.info("Status criado com sucesso: {}", createdStatus.getId());
        return ResponseUtil.created(createdStatus);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<StatusDto> updateStatus(@PathVariable UUID id,
                                                  @Valid @RequestBody StatusUpdateRequest request) {
        logger.info("Requisição para atualizar status com ID: {}", id);

        StatusDto updatedStatus = statusService.updateStatus(id, request);
        logger.info("Status atualizado com sucesso: {}", updatedStatus.getId());
        return ResponseEntity.ok(updatedStatus);
    }

    @PatchMapping("/{id}/toggle-ativo")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Void> toggleStatusAtivo(@PathVariable UUID id) {
        logger.info("Requisição para alternar status ativo/inativo com ID: {}", id);

        statusService.toggleStatusAtivo(id);
        logger.info("Status ativo/inativo alterado com sucesso: {}", id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStatus(@PathVariable UUID id) {
        logger.info("Requisição para deletar status com ID: {}", id);

        statusService.deleteStatus(id);
        logger.info("Status deletado com sucesso: {}", id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/initialize")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> initializeDefaultStatuses() {
        logger.info("Requisição para inicializar status padrão");

        statusService.initializeDefaultStatuses();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Status padrão inicializados com sucesso");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStatusStats() {
        logger.info("Requisição para estatísticas de status");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStatuses", statusService.getAllStatuses().size());
        stats.put("statusesAtivos", statusService.countStatusesAtivos());

        return ResponseUtil.success(stats);
    }

    @GetMapping("/history")
    public ResponseEntity<Page<StatusHistorySummaryDto>> getAllHistorico(
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para listar todo o histórico de status");

        Page<StatusHistorySummaryDto> historico = statusHistoryService.getHistoricoPorTipo(null, pageable);
        return ResponseEntity.ok(historico);
    }

    @GetMapping("/history/entity/{entityType}/{entityId}")
    public ResponseEntity<Page<StatusHistorySummaryDto>> getHistoricoByEntity(
            @PathVariable String entityType,
            @PathVariable UUID entityId,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para histórico de {} ID: {}", entityType, entityId);

        StatusHistory.EntityType type = StatusHistory.EntityType.valueOf(entityType.toUpperCase());
        Page<StatusHistorySummaryDto> historico = statusHistoryService.getHistoricoEntidadePaginado(
                type, entityId, pageable);
        return ResponseEntity.ok(historico);
    }

    @GetMapping("/history/user/{userId}")
    public ResponseEntity<Page<StatusHistorySummaryDto>> getHistoricoByUser(
            @PathVariable UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para histórico do usuário: {}", userId);

        Page<StatusHistorySummaryDto> historico = statusHistoryService.getHistoricoPorUsuario(userId, pageable);
        return ResponseEntity.ok(historico);
    }

    @GetMapping("/history/periodo")
    public ResponseEntity<Page<StatusHistorySummaryDto>> getHistoricoByPeriodo(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 20) Pageable pageable) {
        logger.info("Requisição para histórico do período: {} a {}", startDate, endDate);

        Page<StatusHistorySummaryDto> historico = statusHistoryService.getHistoricoPorPeriodo(
                startDate, endDate, pageable);
        return ResponseEntity.ok(historico);
    }
}