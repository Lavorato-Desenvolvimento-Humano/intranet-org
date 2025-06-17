package com.lavorato.observability.service;

import com.lavorato.observability.model.HealthStatus;
import com.lavorato.observability.model.LogAlert;
import com.lavorato.observability.model.SystemMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.entities.MessageEmbed;
import net.dv8tion.jda.api.entities.channel.concrete.TextChannel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Service responsável por enviar notificações para o Discord
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DiscordNotificationService {

    private final JDA jda;

    @Value("${discord.channels.alerts}")
    private String alertsChannelId;

    @Value("${discord.channels.metrics}")
    private String metricsChannelId;

    @Value("${discord.channels.logs}")
    private String logsChannelId;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    /**
     * Envia alerta de status de saúde
     */
    public void sendHealthAlert(HealthStatus healthStatus) {
        try {
            TextChannel channel = jda.getTextChannelById(alertsChannelId);
            if (channel == null) {
                log.error("Canal de alertas não encontrado: {}", alertsChannelId);
                return;
            }

            Color embedColor = getStatusColor(healthStatus.getStatus());
            String statusEmoji = getStatusEmoji(healthStatus.getStatus());

            EmbedBuilder embed = new EmbedBuilder()
                    .setTitle(statusEmoji + " Status do Serviço: " + healthStatus.getService())
                    .setColor(embedColor)
                    .setTimestamp(java.time.Instant.now())
                    .addField("Status", healthStatus.getStatus(), true)
                    .addField("Timestamp", healthStatus.getTimestamp().format(FORMATTER), true);

            if (healthStatus.getResponseTime() != null) {
                embed.addField("Tempo de Resposta", healthStatus.getResponseTime() + "ms", true);
            }

            if (healthStatus.getError() != null) {
                embed.addField("Erro", "```" + healthStatus.getError() + "```", false);
            }

            if (healthStatus.getDetails() != null && !healthStatus.getDetails().isEmpty()) {
                StringBuilder details = new StringBuilder();
                for (Map.Entry<String, Object> entry : healthStatus.getDetails().entrySet()) {
                    details.append("**").append(entry.getKey()).append(":** ")
                            .append(entry.getValue()).append("\n");
                }
                embed.addField("Detalhes", details.toString(), false);
            }

            channel.sendMessageEmbeds(embed.build()).queue(
                    success -> log.debug("Alerta de saúde enviado para o Discord"),
                    error -> log.error("Erro ao enviar alerta de saúde: ", error)
            );
        } catch (Exception e) {
            log.error("Erro ao enviar alerta de saúde para o Discord: ", e);
        }
    }

    /**
     * Envia relatório de métricas do sistema
     */
    public void sendMetricsReport(SystemMetrics metrics) {
        try {
            TextChannel channel = jda.getTextChannelById(metricsChannelId);
            if (channel == null) {
                log.error("Canal de métricas não encontrado: {}", metricsChannelId);
                return;
            }

            Color embedColor = getMetricsColor(metrics);
            String metricsEmoji = "📊";

            EmbedBuilder embed = new EmbedBuilder()
                    .setTitle(metricsEmoji + " Relatório de Métricas do Sistema")
                    .setColor(embedColor)
                    .setTimestamp(java.time.Instant.now())
                    .addField("CPU", String.format("%.1f%%", metrics.getCpuUsage()), true)
                    .addField("Memória", String.format("%.1f%%", metrics.getMemoryUsage()), true)
                    .addField("Disco", String.format("%.1f%%", metrics.getDiskUsage()), true)
                    .addField("Processadores", String.valueOf(metrics.getAvailableProcessors()), true)
                    .addField("Load Average", String.format("%.2f", metrics.getSystemLoadAverage()), true)
                    .addField("Timestamp", metrics.getTimestamp().format(FORMATTER), true);

            if (metrics.getMemoryTotal() > 0) {
                String memoryInfo = String.format("Usado: %s / Total: %s",
                        formatBytes(metrics.getMemoryUsed()),
                        formatBytes(metrics.getMemoryTotal()));
                embed.addField("Detalhes da Memória", memoryInfo, false);
            }

            // Adicionar alertas se alguma métrica estiver alta
            StringBuilder warnings = new StringBuilder();
            if (metrics.getCpuUsage() > 80) {
                warnings.append("⚠️ CPU acima de 80%\n");
            }
            if (metrics.getMemoryUsage() > 85) {
                warnings.append("⚠️ Memória acima de 85%\n");
            }
            if (metrics.getDiskUsage() > 90) {
                warnings.append("🚨 Disco acima de 90%\n");
            }

            if (warnings.length() > 0) {
                embed.addField("Alertas", warnings.toString(), false);
            }

            channel.sendMessageEmbeds(embed.build()).queue(
                    success -> log.debug("Relatório de métricas enviado para o Discord"),
                    error -> log.error("Erro ao enviar relatório de métricas: ", error)
            );
        } catch (Exception e) {
            log.error("Erro ao enviar métricas para o Discord: ", e);
        }
    }

    /**
     * Envia alerta de log crítico
     */
    public void sendLogAlert(LogAlert logAlert) {
        try {
            TextChannel channel = jda.getTextChannelById(logsChannelId);
            if (channel == null) {
                log.error("Canal de logs não encontrado: {}", logsChannelId);
                return;
            }

            Color embedColor = getLogLevelColor(logAlert.getLevel());
            String levelEmoji = getLogLevelEmoji(logAlert.getLevel());

            EmbedBuilder embed = new EmbedBuilder()
                    .setTitle(levelEmoji + " Alerta de Log: " + logAlert.getLevel())
                    .setColor(embedColor)
                    .setTimestamp(java.time.Instant.now())
                    .addField("Tipo", logAlert.getType(), true)
                    .addField("Serviço", logAlert.getService(), true)
                    .addField("Timestamp", logAlert.getTimestamp().format(FORMATTER), true)
                    .addField("Mensagem", "```" + limitString(logAlert.getMessage(), 1000) + "```", false);

            if (logAlert.getLogger() != null) {
                embed.addField("Logger", logAlert.getLogger(), true);
            }

            if (logAlert.getException() != null) {
                embed.addField("Exception", "```" + limitString(logAlert.getException(), 500) + "```", false);
            }

            if (logAlert.getCount() > 1) {
                embed.addField("Ocorrências", String.valueOf(logAlert.getCount()), true);
            }

            channel.sendMessageEmbeds(embed.build()).queue(
                    success -> log.debug("Alerta de log enviado para o Discord"),
                    error -> log.error("Erro ao enviar alerta de log: ", error)
            );
        } catch (Exception e) {
            log.error("Erro ao enviar alerta de log para o Discord: ", e);
        }
    }

    /**
     * Envia relatório consolidado de status
     */
    public void sendStatusReport(List<HealthStatus> healthStatuses, SystemMetrics metrics) {
        try {
            TextChannel channel = jda.getTextChannelById(alertsChannelId);
            if (channel == null) {
                log.error("Canal de alertas não encontrado: {}", alertsChannelId);
                return;
            }

            EmbedBuilder embed = new EmbedBuilder()
                    .setTitle("📋 Relatório de Status do Sistema")
                    .setColor(Color.BLUE)
                    .setTimestamp(java.time.Instant.now());

            // Status dos serviços
            StringBuilder servicesStatus = new StringBuilder();
            for (HealthStatus status : healthStatuses) {
                String emoji = getStatusEmoji(status.getStatus());
                String responseTime = status.getResponseTime() != null ?
                        " (" + status.getResponseTime() + "ms)" : "";
                servicesStatus.append(emoji).append(" **").append(status.getService())
                        .append(":** ").append(status.getStatus()).append(responseTime).append("\n");
            }
            embed.addField("Status dos Serviços", servicesStatus.toString(), false);

            // Métricas resumidas
            if (metrics != null) {
                String metricsInfo = String.format(
                        "🖥️ **CPU:** %.1f%%\n💾 **Memória:** %.1f%%\n💿 **Disco:** %.1f%%",
                        metrics.getCpuUsage(), metrics.getMemoryUsage(), metrics.getDiskUsage()
                );
                embed.addField("Métricas do Sistema", metricsInfo, true);
            }

            embed.setFooter("Sistema de Observabilidade Lavorato", null);

            channel.sendMessageEmbeds(embed.build()).queue(
                    success -> log.debug("Relatório de status enviado para o Discord"),
                    error -> log.error("Erro ao enviar relatório de status: ", error)
            );
        } catch (Exception e) {
            log.error("Erro ao enviar relatório de status para o Discord: ", e);
        }
    }

    /**
     * Determina a cor do embed baseado no status
     */
    private Color getStatusColor(String status) {
        return switch (status.toLowerCase()) {
            case "up" -> Color.GREEN;
            case "down" -> Color.RED;
            case "error" -> Color.ORANGE;
            default -> Color.GRAY;
        };
    }

    /**
     * Determina a cor das métricas baseado nos valores
     */
    private Color getMetricsColor(SystemMetrics metrics) {
        if (metrics.getCpuUsage() > 80 || metrics.getMemoryUsage() > 85 || metrics.getDiskUsage() > 90) {
            return Color.RED;
        } else if (metrics.getCpuUsage() > 60 || metrics.getMemoryUsage() > 70 || metrics.getDiskUsage() > 80) {
            return Color.ORANGE;
        } else {
            return Color.GREEN;
        }
    }

    /**
     * Determina a cor do log baseado no nível
     */
    private Color getLogLevelColor(String level) {
        return switch (level.toLowerCase()) {
            case "error" -> Color.RED;
            case "warn" -> Color.ORANGE;
            case "info" -> Color.BLUE;
            case "debug" -> Color.GRAY;
            default -> Color.BLACK;
        };
    }

    /**
     * Retorna emoji baseado no status
     */
    private String getStatusEmoji(String status) {
        return switch (status.toLowerCase()) {
            case "up" -> "✅";
            case "down" -> "❌";
            case "error" -> "⚠️";
            default -> "❓";
        };
    }

    /**
     * Retorna emoji baseado no nível do log
     */
    private String getLogLevelEmoji(String level) {
        return switch (level.toLowerCase()) {
            case "error" -> "🚨";
            case "warn" -> "⚠️";
            case "info" -> "ℹ️";
            case "debug" -> "🔍";
            default -> "📝";
        };
    }

    /**
     * Formata bytes em unidades legíveis
     */
    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }

    /**
     * Limita o tamanho de uma string
     */
    private String limitString(String str, int maxLength) {
        if (str == null) return "";
        if (str.length() <= maxLength) return str;
        return str.substring(0, maxLength - 3) + "...";
    }
}