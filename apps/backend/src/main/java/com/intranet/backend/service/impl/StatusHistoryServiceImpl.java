package com.intranet.backend.service.impl;

import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.StatusHistoryService;
import com.intranet.backend.service.GuiaService;
import com.intranet.backend.service.FichaService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatusHistoryServiceImpl implements StatusHistoryService {

    private static final Logger logger = LoggerFactory.getLogger(StatusHistoryServiceImpl.class);

    private final StatusHistoryRepository statusHistoryRepository;
    private final UserRepository userRepository;
    private final GuiaRepository guiaRepository;
    private final FichaRepository fichaRepository;
    private final GuiaService guiaService;
    private final FichaService fichaService;

    @Override
    @Transactional
    public StatusHistoryDto registrarMudancaStatusGuia(UUID guiaId, String statusAnterior, String statusNovo,
                                                       String motivo, String observacoes) {
        logger.info("Registrando mudança de status para guia ID: {} de '{}' para '{}'",
                guiaId, statusAnterior, statusNovo);

        // Verificar se a guia existe
        if (!guiaRepository.existsById(guiaId)) {
            throw new ResourceNotFoundException("Guia não encontrada com ID: " + guiaId);
        }

        User currentUser = getCurrentUser();

        StatusHistory history = StatusHistory.forGuia(guiaId, statusAnterior, statusNovo,
                motivo, observacoes, currentUser);

        StatusHistory savedHistory = statusHistoryRepository.save(history);
        logger.info("Histórico de status registrado com sucesso. ID: {}", savedHistory.getId());

        return mapToDto(savedHistory);
    }

    @Override
    @Transactional
    public StatusHistoryDto registrarMudancaStatusFicha(UUID fichaId, String statusAnterior, String statusNovo,
                                                        String motivo, String observacoes) {
        logger.info("Registrando mudança de status para ficha ID: {} de '{}' para '{}'",
                fichaId, statusAnterior, statusNovo);

        // Verificar se a ficha existe
        if (!fichaRepository.existsById(fichaId)) {
            throw new ResourceNotFoundException("Ficha não encontrada com ID: " + fichaId);
        }

        User currentUser = getCurrentUser();

        StatusHistory history = StatusHistory.forFicha(fichaId, statusAnterior, statusNovo,
                motivo, observacoes, currentUser);

        StatusHistory savedHistory = statusHistoryRepository.save(history);
        logger.info("Histórico de status registrado com sucesso. ID: {}", savedHistory.getId());

        return mapToDto(savedHistory);
    }

    @Override
    @Transactional
    public StatusHistoryDto createStatusHistory(StatusHistoryCreateRequest request) {
        logger.info("Criando registro de histórico manual para {} ID: {}",
                request.getEntityType(), request.getEntityId());

        // Verificar se a entidade existe
        validateEntityExists(request.getEntityType(), request.getEntityId());

        User currentUser = getCurrentUser();

        StatusHistory history = new StatusHistory();
        history.setEntityType(request.getEntityType());
        history.setEntityId(request.getEntityId());
        history.setStatusAnterior(request.getStatusAnterior());
        history.setStatusNovo(request.getStatusNovo());
        history.setMotivo(request.getMotivo());
        history.setObservacoes(request.getObservacoes());
        history.setAlteradoPor(currentUser);
        history.setDataAlteracao(LocalDateTime.now());

        StatusHistory savedHistory = statusHistoryRepository.save(history);
        return mapToDto(savedHistory);
    }

    @Override
    public List<StatusHistoryDto> getHistoricoEntidade(StatusHistory.EntityType entityType, UUID entityId) {
        logger.info("Buscando histórico para {} ID: {}", entityType, entityId);

        List<StatusHistory> historico = statusHistoryRepository
                .findByEntityTypeAndEntityIdWithUser(entityType, entityId);

        return historico.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<StatusHistorySummaryDto> getHistoricoEntidadePaginado(StatusHistory.EntityType entityType,
                                                                      UUID entityId, Pageable pageable) {
        logger.info("Buscando histórico paginado para {} ID: {}", entityType, entityId);

        Page<StatusHistory> historico = statusHistoryRepository
                .findByEntityTypeAndEntityId(entityType, entityId, pageable);

        return historico.map(this::mapToSummaryDto);
    }

    @Override
    public Page<StatusHistorySummaryDto> getHistoricoPorTipo(StatusHistory.EntityType entityType, Pageable pageable) {
        logger.info("Buscando histórico por tipo: {}", entityType);

        Page<StatusHistory> historico = statusHistoryRepository.findByEntityType(entityType, pageable);
        return historico.map(this::mapToSummaryDto);
    }

    @Override
    public Page<StatusHistorySummaryDto> getHistoricoPorUsuario(UUID userId, Pageable pageable) {
        logger.info("Buscando histórico por usuário: {}", userId);

        Page<StatusHistory> historico = statusHistoryRepository.findByAlteradoPorId(userId, pageable);
        return historico.map(this::mapToSummaryDto);
    }

    @Override
    public Page<StatusHistorySummaryDto> getHistoricoPorStatus(String status, Pageable pageable) {
        logger.info("Buscando histórico por status: {}", status);

        Page<StatusHistory> historico = statusHistoryRepository.findByStatusNovo(status, pageable);
        return historico.map(this::mapToSummaryDto);
    }

    @Override
    public Page<StatusHistorySummaryDto> getHistoricoPorPeriodo(LocalDateTime startDate, LocalDateTime endDate,
                                                                Pageable pageable) {
        logger.info("Buscando histórico por período: {} a {}", startDate, endDate);

        Page<StatusHistory> historico = statusHistoryRepository
                .findByDataAlteracaoBetween(startDate, endDate, pageable);
        return historico.map(this::mapToSummaryDto);
    }

    @Override
    public Page<StatusHistorySummaryDto> getHistoricoComFiltros(StatusHistoryFilterRequest filters, Pageable pageable) {
        logger.info("Buscando histórico com filtros: {}", filters);

        Page<StatusHistory> historico = statusHistoryRepository.findWithFilters(
                filters.getEntityType(),
                filters.getEntityId(),
                filters.getStatusNovo(),
                filters.getAlteradoPorId(),
                filters.getStartDate(),
                filters.getEndDate(),
                pageable
        );

        return historico.map(this::mapToSummaryDto);
    }

    @Override
    public StatusHistoryDto getUltimoStatus(StatusHistory.EntityType entityType, UUID entityId) {
        logger.info("Buscando último status para {} ID: {}", entityType, entityId);

        StatusHistory ultimoStatus = statusHistoryRepository
                .findLatestByEntityTypeAndEntityId(entityType, entityId);

        if (ultimoStatus == null) {
            throw new ResourceNotFoundException("Nenhum histórico encontrado para " + entityType + " ID: " + entityId);
        }

        return mapToDto(ultimoStatus);
    }

    @Override
    public long contarMudancasStatus(StatusHistory.EntityType entityType, UUID entityId) {
        return statusHistoryRepository.countByEntityTypeAndEntityId(entityType, entityId);
    }

    @Override
    public Map<String, Long> getEstatisticasMudancas(StatusHistory.EntityType entityType) {
        logger.info("Gerando estatísticas de mudanças para tipo: {}", entityType);

        List<Object[]> results = statusHistoryRepository.getStatusChangeStatistics(entityType);

        return results.stream().collect(Collectors.toMap(
                result -> (String) result[0],  // status
                result -> (Long) result[1]     // count
        ));
    }

    @Override
    @Transactional
    public void deleteStatusHistory(UUID id) {
        logger.info("Excluindo registro de histórico ID: {}", id);

        if (!statusHistoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Registro de histórico não encontrado com ID: " + id);
        }

        statusHistoryRepository.deleteById(id);
        logger.info("Registro de histórico excluído com sucesso. ID: {}", id);
    }

    @Override
    public List<StatusHistorySummaryDto> gerarRelatorioMudancas(StatusHistory.EntityType entityType,
                                                                LocalDateTime startDate, LocalDateTime endDate) {
        logger.info("Gerando relatório de mudanças para {} no período {} a {}", entityType, startDate, endDate);

        Page<StatusHistory> historico = statusHistoryRepository
                .findByDataAlteracaoBetween(startDate, endDate, Pageable.unpaged());

        return historico.getContent().stream()
                .filter(h -> h.getEntityType() == entityType)
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getDashboardStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        logger.info("Gerando estatísticas do dashboard para período: {} a {}", startDate, endDate);

        try {
            // Definir período padrão se não fornecido (últimos 30 dias)
            LocalDateTime finalStartDate = startDate != null ? startDate : LocalDateTime.now().minusDays(30);
            LocalDateTime finalEndDate = endDate != null ? endDate : LocalDateTime.now();

            Map<String, Object> stats = new HashMap<>();

            // Estatísticas gerais por tipo
            Map<String, Long> guiasStatsGeral = getEstatisticasMudancas(StatusHistory.EntityType.GUIA);
            Map<String, Long> fichasStatsGeral = getEstatisticasMudancas(StatusHistory.EntityType.FICHA);

            // Estatísticas do período se filtro aplicado
            Map<String, Long> guiasStatsPeriodo = new HashMap<>();
            Map<String, Long> fichasStatsPeriodo = new HashMap<>();

            if (startDate != null && endDate != null) {
                guiasStatsPeriodo = getEstatisticasPorPeriodo(StatusHistory.EntityType.GUIA, finalStartDate, finalEndDate);
                fichasStatsPeriodo = getEstatisticasPorPeriodo(StatusHistory.EntityType.FICHA, finalStartDate, finalEndDate);
            }

            // Calcular totais
            long totalGuiasChanges = guiasStatsGeral.values().stream().mapToLong(Long::longValue).sum();
            long totalFichasChanges = fichasStatsGeral.values().stream().mapToLong(Long::longValue).sum();
            long totalGuiasChangesPeriodo = guiasStatsPeriodo.values().stream().mapToLong(Long::longValue).sum();
            long totalFichasChangesPeriodo = fichasStatsPeriodo.values().stream().mapToLong(Long::longValue).sum();

            // Estruturar dados das guias
            Map<String, Object> guiasData = new HashMap<>();
            guiasData.put("statusCountsTotal", guiasStatsGeral);
            guiasData.put("statusCountsPeriod", guiasStatsPeriodo);
            guiasData.put("totalChanges", totalGuiasChanges);
            guiasData.put("totalChangesPeriod", totalGuiasChangesPeriodo);
            guiasData.put("distinctStatuses", guiasStatsGeral.size());
            guiasData.put("mostActiveStatus", getMostActiveStatus(guiasStatsGeral));
            guiasData.put("mostActiveStatusPeriod", getMostActiveStatus(guiasStatsPeriodo));

            // Estruturar dados das fichas
            Map<String, Object> fichasData = new HashMap<>();
            fichasData.put("statusCountsTotal", fichasStatsGeral);
            fichasData.put("statusCountsPeriod", fichasStatsPeriodo);
            fichasData.put("totalChanges", totalFichasChanges);
            fichasData.put("totalChangesPeriod", totalFichasChangesPeriodo);
            fichasData.put("distinctStatuses", fichasStatsGeral.size());
            fichasData.put("mostActiveStatus", getMostActiveStatus(fichasStatsGeral));
            fichasData.put("mostActiveStatusPeriod", getMostActiveStatus(fichasStatsPeriodo));

            // Calcular tendências
            Map<String, Object> trends = calculateTrends(finalStartDate, finalEndDate);

            // Buscar usuários mais ativos
            List<Map<String, Object>> topUsers = getTopActiveUsers(finalStartDate, finalEndDate);

            // Totais consolidados
            Map<String, Object> totals = new HashMap<>();
            totals.put("allChanges", totalGuiasChanges + totalFichasChanges);
            totals.put("allChangesPeriod", totalGuiasChangesPeriodo + totalFichasChangesPeriodo);
            totals.put("guiasChanges", totalGuiasChanges);
            totals.put("fichasChanges", totalFichasChanges);
            totals.put("guiasChangesPeriod", totalGuiasChangesPeriodo);
            totals.put("fichasChangesPeriod", totalFichasChangesPeriodo);

            // Montar resposta final
            stats.put("guias", guiasData);
            stats.put("fichas", fichasData);
            stats.put("trends", trends);
            stats.put("topUsers", topUsers);
            stats.put("totals", totals);
            stats.put("metadata", Map.of(
                    "generatedAt", LocalDateTime.now(),
                    "periodFilter", startDate != null && endDate != null,
                    "startDate", finalStartDate,
                    "endDate", finalEndDate,
                    "daysInPeriod", java.time.Duration.between(finalStartDate, finalEndDate).toDays()
            ));

            return stats;

        } catch (Exception e) {
            logger.error("Erro ao gerar estatísticas do dashboard: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao gerar estatísticas do dashboard", e);
        }
    }

    @Override
    @Transactional
    public Map<String, Object> changeGuiaStatus(UUID guiaId, StatusChangeRequest request) {
        logger.info("Alterando status da guia ID: {} para '{}'", guiaId, request.getNovoStatus());

        try {
            // 1. Buscar guia atual
            GuiaDto guiaAtual = guiaService.getGuiaById(guiaId);
            String statusAnterior = guiaAtual.getStatus();

            // 2. Validações
            validateStatusChange(statusAnterior, request.getNovoStatus());

            // 3. Atualizar status via service específico
            GuiaDto guiaAtualizada = guiaService.updateGuiaStatus(
                    guiaId, request.getNovoStatus(), request.getMotivo(), request.getObservacoes());

            // 4. Buscar histórico criado
            StatusHistoryDto historyRecord = getUltimoStatus(StatusHistory.EntityType.GUIA, guiaId);

            // 5. Preparar resposta
            Map<String, Object> response = buildStatusChangeResponse(
                    guiaAtualizada, historyRecord, statusAnterior, request.getNovoStatus());

            // 6. Adicionar dados específicos de guia
            response.put("entityType", "GUIA");

            // 7. Verificar se é mudança crítica
            if (isCriticalStatusChange(statusAnterior, request.getNovoStatus())) {
                response.put("requiresNotification", true);
                response.put("notificationMessage", "Mudança de status crítica detectada.");
            }

            return response;

        } catch (Exception e) {
            logger.error("Erro ao alterar status da guia {}: {}", guiaId, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional
    public Map<String, Object> changeFichaStatus(UUID fichaId, StatusChangeRequest request) {
        logger.info("Alterando status da ficha ID: {} para '{}'", fichaId, request.getNovoStatus());

        try {
            // 1. Buscar ficha atual
            FichaDto fichaAtual = fichaService.getFichaById(fichaId);
            String statusAnterior = fichaAtual.getStatus();

            // 2. Validações
            validateStatusChange(statusAnterior, request.getNovoStatus());
            validateFichaStatusTransition(fichaAtual, request.getNovoStatus());

            // 3. Atualizar status via service específico
            FichaDto fichaAtualizada = fichaService.updateFichaStatus(
                    fichaId, request.getNovoStatus(), request.getMotivo(), request.getObservacoes());

            // 4. Buscar histórico criado
            StatusHistoryDto historyRecord = getUltimoStatus(StatusHistory.EntityType.FICHA, fichaId);

            // 5. Preparar resposta base
            Map<String, Object> response = buildStatusChangeResponse(
                    fichaAtualizada, historyRecord, statusAnterior, request.getNovoStatus());

            // 6. Adicionar dados específicos de ficha
            response.put("entityType", "FICHA");

            // 7. Analisar impacto na guia vinculada
            Map<String, Object> guiaImpact = analyzeGuiaImpact(fichaAtual, request.getNovoStatus());
            response.put("guiaImpact", guiaImpact);

            // 8. Gerar alertas específicos
            List<String> alerts = generateFichaStatusAlerts(fichaAtual, request.getNovoStatus());
            if (!alerts.isEmpty()) {
                response.put("alerts", alerts);
            }

            // 9. Verificar se é mudança crítica
            if (isCriticalStatusChange(statusAnterior, request.getNovoStatus())) {
                response.put("requiresNotification", true);
                response.put("notificationMessage", "Mudança de status crítica detectada.");
            }

            return response;

        } catch (Exception e) {
            logger.error("Erro ao alterar status da ficha {}: {}", fichaId, e.getMessage(), e);
            throw e;
        }
    }

    private Map<String, Long> getEstatisticasPorPeriodo(StatusHistory.EntityType entityType,
                                                        LocalDateTime startDate, LocalDateTime endDate) {
        StatusHistoryFilterRequest filter = new StatusHistoryFilterRequest();
        filter.setEntityType(entityType);
        filter.setStartDate(startDate);
        filter.setEndDate(endDate);

        Page<StatusHistorySummaryDto> resultados = getHistoricoComFiltros(filter, Pageable.unpaged());

        return resultados.getContent().stream()
                .collect(Collectors.groupingBy(
                        StatusHistorySummaryDto::getStatusNovo,
                        Collectors.counting()
                ));
    }

    private String getMostActiveStatus(Map<String, Long> statusCounts) {
        return statusCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
    }

    private Map<String, Object> calculateTrends(LocalDateTime startDate, LocalDateTime endDate) {
        try {
            long daysDiff = java.time.Duration.between(startDate, endDate).toDays();
            LocalDateTime previousPeriodStart = startDate.minusDays(daysDiff);

            // Período atual
            StatusHistoryFilterRequest currentFilter = new StatusHistoryFilterRequest();
            currentFilter.setStartDate(startDate);
            currentFilter.setEndDate(endDate);
            long currentCount = getHistoricoComFiltros(currentFilter, Pageable.unpaged()).getTotalElements();

            // Período anterior
            StatusHistoryFilterRequest previousFilter = new StatusHistoryFilterRequest();
            previousFilter.setStartDate(previousPeriodStart);
            previousFilter.setEndDate(startDate);
            long previousCount = getHistoricoComFiltros(previousFilter, Pageable.unpaged()).getTotalElements();

            Map<String, Object> trends = new HashMap<>();
            trends.put("currentPeriodChanges", currentCount);
            trends.put("previousPeriodChanges", previousCount);

            if (previousCount > 0) {
                double percentageChange = ((double) (currentCount - previousCount) / previousCount) * 100;
                trends.put("percentageChange", Math.round(percentageChange * 100.0) / 100.0);
                trends.put("trend", currentCount > previousCount ? "INCREASING" :
                        currentCount < previousCount ? "DECREASING" : "STABLE");
            } else {
                trends.put("percentageChange", currentCount > 0 ? 100.0 : 0.0);
                trends.put("trend", currentCount > 0 ? "NEW_ACTIVITY" : "NO_ACTIVITY");
            }

            return trends;
        } catch (Exception e) {
            logger.warn("Erro ao calcular tendências: {}", e.getMessage());
            return Map.of("error", "Não foi possível calcular tendências");
        }
    }

    private List<Map<String, Object>> getTopActiveUsers(LocalDateTime startDate, LocalDateTime endDate) {
        try {
            StatusHistoryFilterRequest filter = new StatusHistoryFilterRequest();
            filter.setStartDate(startDate);
            filter.setEndDate(endDate);

            Page<StatusHistorySummaryDto> allChanges = getHistoricoComFiltros(filter, Pageable.unpaged());

            return allChanges.getContent().stream()
                    .collect(Collectors.groupingBy(
                            StatusHistorySummaryDto::getAlteradoPorNome,
                            Collectors.counting()
                    ))
                    .entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(5)
                    .map(entry -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("userName", entry.getKey());
                        map.put("changeCount", entry.getValue());
                        return map;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.warn("Erro ao buscar usuários mais ativos: {}", e.getMessage());
            return List.of();
        }
    }

    private void validateStatusChange(String statusAnterior, String statusNovo) {
        if (statusAnterior.equals(statusNovo)) {
            throw new IllegalArgumentException("O status informado é igual ao status atual");
        }

        if (!StatusEnum.isValid(statusNovo)) {
            throw new IllegalArgumentException("Status inválido: " + statusNovo);
        }
    }

    private void validateFichaStatusTransition(FichaDto ficha, String novoStatus) {
        String statusAtual = ficha.getStatus();

        // Não permitir voltar de FATURADO
        if ("FATURADO".equals(statusAtual) &&
                !List.of("ENVIADO A BM", "DEVOLVIDO BM").contains(novoStatus)) {
            throw new IllegalArgumentException("Não é possível alterar status de uma ficha já faturada para: " + novoStatus);
        }

        // Validar ASSINADO requer quantidade
        if ("ASSINADO".equals(novoStatus) && ficha.getQuantidadeAutorizada() == 0) {
            throw new IllegalArgumentException("Não é possível marcar como assinado uma ficha sem quantidade autorizada");
        }
    }

    private Map<String, Object> buildStatusChangeResponse(Object entidadeAtualizada, StatusHistoryDto historyRecord,
                                                          String statusAnterior, String statusNovo) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", String.format("Status alterado de '%s' para '%s'", statusAnterior, statusNovo));
        response.put("entity", entidadeAtualizada);
        response.put("statusHistory", historyRecord);
        response.put("statusChange", Map.of(
                "anterior", statusAnterior,
                "novo", statusNovo,
                "timestamp", historyRecord.getDataAlteracao(),
                "alteradoPor", historyRecord.getAlteradoPorNome()
        ));
        return response;
    }

    private Map<String, Object> analyzeGuiaImpact(FichaDto ficha, String novoStatus) {
        Map<String, Object> guiaImpact = new HashMap<>();

        if (ficha.getGuiaId() != null) {
            try {
                GuiaDto guiaVinculada = guiaService.getGuiaById(ficha.getGuiaId());
                guiaImpact.put("hasLinkedGuia", true);
                guiaImpact.put("guiaId", guiaVinculada.getId());
                guiaImpact.put("guiaStatus", guiaVinculada.getStatus());
                guiaImpact.put("numeroGuia", guiaVinculada.getNumeroGuia());

                if (shouldUpdateGuiaStatus(novoStatus)) {
                    guiaImpact.put("suggestGuiaUpdate", true);
                    guiaImpact.put("suggestedGuiaStatus", getSuggestedGuiaStatus(novoStatus));
                }
            } catch (Exception e) {
                logger.warn("Erro ao analisar impacto na guia: {}", e.getMessage());
                guiaImpact.put("hasLinkedGuia", false);
            }
        } else {
            guiaImpact.put("hasLinkedGuia", false);
        }

        return guiaImpact;
    }

    private boolean shouldUpdateGuiaStatus(String fichaStatus) {
        return List.of("ASSINADO", "FATURADO", "CANCELADO").contains(fichaStatus);
    }

    private String getSuggestedGuiaStatus(String fichaStatus) {
        switch (fichaStatus) {
            case "ASSINADO": return "SAIU";
            case "FATURADO": return "FATURADO";
            case "CANCELADO": return "CANCELADO";
            default: return "ANALISE";
        }
    }

    private List<String> generateFichaStatusAlerts(FichaDto ficha, String novoStatus) {
        List<String> alerts = new ArrayList<>();

        switch (novoStatus) {
            case "PERDIDA":
                alerts.add("ATENÇÃO: Ficha marcada como perdida. Considere gerar nova ficha se necessário.");
                break;
            case "CANCELADO":
                alerts.add("Ficha cancelada. Verifique se é necessário ajustar a guia vinculada.");
                break;
            case "FATURADO":
                alerts.add("Ficha faturada. Processo financeiro pode ser iniciado.");
                break;
            case "DEVOLVIDO BM":
                alerts.add("Ficha devolvida pela BM. Verifique pendências e tome ações necessárias.");
                break;
        }

        return alerts;
    }

    private boolean isCriticalStatusChange(String statusAnterior, String statusNovo) {
        List<String> criticalStatuses = List.of("CANCELADO", "PERDIDA", "DEVOLVIDO BM");
        List<String> fromCriticalStatuses = List.of("FATURADO", "ENVIADO A BM");

        return criticalStatuses.contains(statusNovo) || fromCriticalStatuses.contains(statusAnterior);
    }

    private User getCurrentUser() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuário atual não encontrado"));
    }

    private void validateEntityExists(StatusHistory.EntityType entityType, UUID entityId) {
        switch (entityType) {
            case GUIA:
                if (!guiaRepository.existsById(entityId)) {
                    throw new ResourceNotFoundException("Guia não encontrada com ID: " + entityId);
                }
                break;
            case FICHA:
                if (!fichaRepository.existsById(entityId)) {
                    throw new ResourceNotFoundException("Ficha não encontrada com ID: " + entityId);
                }
                break;
            default:
                throw new IllegalArgumentException("Tipo de entidade não suportado: " + entityType);
        }
    }

    private StatusHistoryDto mapToDto(StatusHistory history) {
        StatusHistoryDto dto = new StatusHistoryDto();
        dto.setId(history.getId());
        dto.setEntityType(history.getEntityType());
        dto.setEntityId(history.getEntityId());
        dto.setStatusAnterior(history.getStatusAnterior());
        dto.setStatusNovo(history.getStatusNovo());
        dto.setMotivo(history.getMotivo());
        dto.setObservacoes(history.getObservacoes());
        dto.setAlteradoPorId(history.getAlteradoPor().getId());
        dto.setAlteradoPorNome(history.getAlteradoPor().getFullName());
        dto.setAlteradoPorEmail(history.getAlteradoPor().getEmail());
        dto.setDataAlteracao(history.getDataAlteracao());
        dto.setCreatedAt(history.getCreatedAt());
        dto.setUpdatedAt(history.getUpdatedAt());

        // Buscar informações adicionais da entidade
        enrichDtoWithEntityInfo(dto, history);

        return dto;
    }

    private StatusHistorySummaryDto mapToSummaryDto(StatusHistory history) {
        StatusHistorySummaryDto dto = new StatusHistorySummaryDto();
        dto.setId(history.getId());
        dto.setEntityType(history.getEntityType());
        dto.setEntityId(history.getEntityId());
        dto.setStatusAnterior(history.getStatusAnterior());
        dto.setStatusNovo(history.getStatusNovo());
        dto.setMotivo(history.getMotivo());
        dto.setAlteradoPorNome(history.getAlteradoPor().getFullName());
        dto.setDataAlteracao(history.getDataAlteracao());

        // Buscar descrição da entidade
        String entityDescricao = getEntityDescricao(history.getEntityType(), history.getEntityId());
        dto.setEntityDescricao(entityDescricao);

        return dto;
    }

    private void enrichDtoWithEntityInfo(StatusHistoryDto dto, StatusHistory history) {
        try {
            switch (history.getEntityType()) {
                case GUIA:
                    guiaRepository.findById(history.getEntityId()).ifPresent(guia -> {
                        dto.setEntityDescricao(guia.getPaciente().getNome());
                        dto.setNumeroGuia(guia.getNumeroGuia());
                    });
                    break;
                case FICHA:
                    fichaRepository.findById(history.getEntityId()).ifPresent(ficha -> {
                        dto.setEntityDescricao(ficha.getPacienteNome());
                        dto.setCodigoFicha(ficha.getCodigoFicha());
                    });
                    break;
            }
        } catch (Exception e) {
            logger.warn("Erro ao buscar informações da entidade: {}", e.getMessage());
        }
    }

    private String getEntityDescricao(StatusHistory.EntityType entityType, UUID entityId) {
        try {
            switch (entityType) {
                case GUIA:
                    return guiaRepository.findById(entityId)
                            .map(guia -> "Guia " + guia.getNumeroGuia() + " - " + guia.getPaciente().getNome())
                            .orElse("Guia não encontrada");
                case FICHA:
                    return fichaRepository.findById(entityId)
                            .map(ficha -> "Ficha " + ficha.getCodigoFicha() + " - " + ficha.getPacienteNome())
                            .orElse("Ficha não encontrada");
                default:
                    return "Entidade desconhecida";
            }
        } catch (Exception e) {
            logger.warn("Erro ao buscar descrição da entidade: {}", e.getMessage());
            return "Erro ao carregar descrição";
        }
    }
}