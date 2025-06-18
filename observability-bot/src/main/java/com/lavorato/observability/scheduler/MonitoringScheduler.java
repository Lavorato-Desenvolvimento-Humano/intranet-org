// observability-bot/src/main/java/com/lavorato/observability/scheduler/MonitoringScheduler.java
package com.lavorato.observability.scheduler;

import com.lavorato.observability.model.HealthStatus;
import com.lavorato.observability.model.SystemMetrics;
import com.lavorato.observability.service.DiscordNotificationService;
import com.lavorato.observability.service.LogAnalysisService;
import com.lavorato.observability.service.MonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Scheduler responsável por executar tarefas de monitoramento periodicamente
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MonitoringScheduler {

    private final MonitoringService monitoringService;
    private final DiscordNotificationService discordNotificationService;
    private final LogAnalysisService logAnalysisService;

    @Value("${monitoring.health.alert.enabled:true}")
    private boolean healthAlertsEnabled;

    @Value("${monitoring.metrics.report.enabled:true}")
    private boolean metricsReportEnabled;

    @Value("${monitoring.logs.analysis.enabled:true}")
    private boolean logAnalysisEnabled;

    // Armazenar último status para detectar mudanças
    private HealthStatus lastBackendStatus;
    private HealthStatus lastFrontendStatus;
    private HealthStatus lastDatabaseStatus;

    /**
     * Verifica status de saúde dos serviços a cada 5 minutos
     */
    @Scheduled(fixedRateString = "${monitoring.health.check.interval:300000}") // 5 minutos
    public void checkServicesHealth() {
        if (!healthAlertsEnabled) {
            return;
        }

        try {
            log.debug("Iniciando verificação de saúde dos serviços...");

            // Verificar backend
            HealthStatus backendStatus = monitoringService.checkBackendHealth();
            handleStatusChange("Backend", lastBackendStatus, backendStatus);
            lastBackendStatus = backendStatus;

            // Verificar frontend
            HealthStatus frontendStatus = monitoringService.checkFrontendHealth();
            handleStatusChange("Frontend", lastFrontendStatus, frontendStatus);
            lastFrontendStatus = frontendStatus;

            // Verificar banco de dados
            HealthStatus databaseStatus = monitoringService.checkDatabaseHealth();
            handleStatusChange("Database", lastDatabaseStatus, databaseStatus);
            lastDatabaseStatus = databaseStatus;

            log.debug("Verificação de saúde concluída - Backend: {}, Frontend: {}, Database: {}",
                    backendStatus.getStatus(), frontendStatus.getStatus(), databaseStatus.getStatus());

        } catch (Exception e) {
            log.error("Erro durante verificação de saúde dos serviços: ", e);
        }
    }

    /**
     * Coleta e envia métricas do sistema a cada 30 minutos
     */
    @Scheduled(fixedRateString = "${monitoring.metrics.report.interval:1800000}") // 30 minutos
    public void collectAndReportMetrics() {
        if (!metricsReportEnabled) {
            return;
        }

        try {
            log.debug("Coletando métricas do sistema...");

            SystemMetrics metrics = monitoringService.collectSystemMetrics();

            // Verificar se há alertas críticos
            boolean hasAlerts = false;
            if (metrics.getCpuUsage() > 80) {
                log.warn("CPU acima de 80%: {}%", metrics.getCpuUsage());
                hasAlerts = true;
            }
            if (metrics.getMemoryUsage() > 85) {
                log.warn("Memória acima de 85%: {}%", metrics.getMemoryUsage());
                hasAlerts = true;
            }
            if (metrics.getDiskUsage() > 90) {
                log.warn("Disco acima de 90%: {}%", metrics.getDiskUsage());
                hasAlerts = true;
            }

            // Enviar relatório
            discordNotificationService.sendMetricsReport(metrics);

            if (hasAlerts) {
                log.info("Métricas críticas detectadas - relatório enviado com alertas");
            } else {
                log.debug("Relatório de métricas enviado - sistema normal");
            }

        } catch (Exception e) {
            log.error("Erro durante coleta de métricas: ", e);
        }
    }

    /**
     * Analisa logs do backend a cada 1 minuto
     */
    @Scheduled(fixedRateString = "${monitoring.logs.scan.interval:60000}") // 1 minuto
    public void analyzeBackendLogs() {
        if (!logAnalysisEnabled) {
            return;
        }

        try {
            log.debug("Analisando logs do backend...");
            logAnalysisService.analyzeBackendLogs();
            log.debug("Análise de logs concluída");
        } catch (Exception e) {
            log.error("Erro durante análise de logs: ", e);
        }
    }

    /**
     * Envia relatório consolidado diário às 08:00
     */
    @Scheduled(cron = "0 0 8 * * *", zone = "America/Sao_Paulo")
    public void sendDailyReport() {
        try {
            log.info("Gerando relatório diário...");

            // Coletar status atual de todos os serviços
            List<HealthStatus> healthStatuses = new ArrayList<>();
            healthStatuses.add(monitoringService.checkBackendHealth());
            healthStatuses.add(monitoringService.checkFrontendHealth());
            healthStatuses.add(monitoringService.checkDatabaseHealth());

            // Coletar métricas atuais
            SystemMetrics metrics = monitoringService.collectSystemMetrics();

            // Enviar relatório consolidado
            discordNotificationService.sendStatusReport(healthStatuses, metrics);

            log.info("Relatório diário enviado com sucesso");

        } catch (Exception e) {
            log.error("Erro ao gerar relatório diário: ", e);
        }
    }

    /**
     * Reset contadores de alerta semanalmente (domingos às 00:00)
     */
    @Scheduled(cron = "0 0 0 * * SUN", zone = "America/Sao_Paulo")
    public void resetAlertCounters() {
        try {
            log.info("Resetando contadores de alerta semanal...");
            logAnalysisService.resetAlertCounters();
            log.info("Contadores de alerta resetados");
        } catch (Exception e) {
            log.error("Erro ao resetar contadores de alerta: ", e);
        }
    }

    /**
     * Verifica mudanças de status e envia alertas se necessário
     */
    private void handleStatusChange(String serviceName, HealthStatus lastStatus, HealthStatus currentStatus) {
        // Se é a primeira verificação ou se houve mudança de status
        if (lastStatus == null || !lastStatus.getStatus().equals(currentStatus.getStatus())) {

            // Enviar alerta apenas se o status for crítico ou se mudou para melhor
            if ("DOWN".equals(currentStatus.getStatus()) ||
                    "ERROR".equals(currentStatus.getStatus()) ||
                    (lastStatus != null &&
                            ("DOWN".equals(lastStatus.getStatus()) || "ERROR".equals(lastStatus.getStatus())) &&
                            "UP".equals(currentStatus.getStatus()))) {

                discordNotificationService.sendHealthAlert(currentStatus);

                String statusChange = lastStatus != null ?
                        String.format("%s -> %s", lastStatus.getStatus(), currentStatus.getStatus()) :
                        currentStatus.getStatus();

                log.info("Alerta de mudança de status enviado para {}: {}", serviceName, statusChange);
            }
        }

        // Log de status crítico mesmo sem mudança (para debug)
        if ("DOWN".equals(currentStatus.getStatus()) || "ERROR".equals(currentStatus.getStatus())) {
            log.warn("Serviço {} com status crítico: {} - Tempo resposta: {}ms",
                    serviceName, currentStatus.getStatus(), currentStatus.getResponseTime());
        }
    }

    /**
     * Método para teste manual (pode ser chamado via endpoint REST se necessário)
     */
    public void executeManualHealthCheck() {
        log.info("Executando verificação manual de saúde...");
        checkServicesHealth();
    }

    /**
     * Método para teste manual de métricas
     */
    public void executeManualMetricsReport() {
        log.info("Executando relatório manual de métricas...");
        collectAndReportMetrics();
    }

    /**
     * Método para teste manual de análise de logs
     */
    public void executeManualLogAnalysis() {
        log.info("Executando análise manual de logs...");
        analyzeBackendLogs();
    }
}