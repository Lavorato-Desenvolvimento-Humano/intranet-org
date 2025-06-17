package com.lavorato.observability.discord;

import com.lavorato.observability.model.HealthStatus;
import com.lavorato.observability.model.SystemMetrics;
import com.lavorato.observability.scheduler.MonitoringScheduler;
import com.lavorato.observability.service.MonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import net.dv8tion.jda.api.interactions.commands.build.Commands;
import net.dv8tion.jda.api.interactions.commands.build.SlashCommandData;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.awt.*;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Handler para comandos Discord do bot de observabilidade
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DiscordCommandHandler extends ListenerAdapter {

    private final MonitoringService monitoringService;
    private final MonitoringScheduler monitoringScheduler;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    /**
     * Lista dos comandos slash disponíveis
     */
    public List<SlashCommandData> getSlashCommands() {
        List<SlashCommandData> commands = new ArrayList<>();

        commands.add(Commands.slash("status", "Verifica o status atual de todos os serviços"));
        commands.add(Commands.slash("metrics", "Mostra as métricas atuais do sistema"));
        commands.add(Commands.slash("health", "Executa verificação manual de saúde"));
        commands.add(Commands.slash("backend", "Verifica especificamente o status do backend"));
        commands.add(Commands.slash("frontend", "Verifica especificamente o status do frontend"));
        commands.add(Commands.slash("database", "Verifica especificamente o status do banco de dados"));
        commands.add(Commands.slash("help", "Mostra a lista de comandos disponíveis"));
        commands.add(Commands.slash("ping", "Verifica se o bot está respondendo"));

        return commands;
    }

    @Override
    public void onSlashCommandInteraction(SlashCommandInteractionEvent event) {
        try {
            String commandName = event.getName();
            log.info("Comando slash recebido: {} por {}", commandName, event.getUser().getEffectiveName());

            // Defer reply para evitar timeout
            event.deferReply().queue();

            switch (commandName) {
                case "status" -> handleStatusCommand(event);
                case "metrics" -> handleMetricsCommand(event);
                case "health" -> handleHealthCommand(event);
                case "backend" -> handleBackendCommand(event);
                case "frontend" -> handleFrontendCommand(event);
                case "database" -> handleDatabaseCommand(event);
                case "help" -> handleHelpCommand(event);
                case "ping" -> handlePingCommand(event);
                default -> event.getHook().editOriginal("Comando não reconhecido. Use `/help` para ver os comandos disponíveis.").queue();
            }
        } catch (Exception e) {
            log.error("Erro ao processar comando slash: ", e);
            event.getHook().editOriginal("❌ Erro interno ao processar comando.").queue();
        }
    }

    @Override
    public void onMessageReceived(MessageReceivedEvent event) {
        // Ignorar mensagens do próprio bot
        if (event.getAuthor().isBot()) return;

        String content = event.getMessage().getContentRaw().toLowerCase();

        // Responder a menções diretas
        if (event.getMessage().getMentions().getUsers().contains(event.getJDA().getSelfUser())) {
            if (content.contains("status")) {
                handleQuickStatus(event);
            } else if (content.contains("help") || content.contains("ajuda")) {
                handleQuickHelp(event);
            } else {
                event.getChannel().sendMessage("👋 Olá! Use `/help` para ver os comandos disponíveis ou me mencione com 'status' para verificação rápida.").queue();
            }
        }
    }

    /**
     * Comando /status - Status completo do sistema
     */
    private void handleStatusCommand(SlashCommandInteractionEvent event) {
        try {
            HealthStatus backendStatus = monitoringService.checkBackendHealth();
            HealthStatus frontendStatus = monitoringService.checkFrontendHealth();
            HealthStatus databaseStatus = monitoringService.checkDatabaseHealth();
            SystemMetrics metrics = monitoringService.collectSystemMetrics();

            EmbedBuilder embed = new EmbedBuilder()
                    .setTitle("📊 Status Completo do Sistema")
                    .setColor(getOverallStatusColor(backendStatus, frontendStatus, databaseStatus))
                    .setTimestamp(java.time.Instant.now());

            // Status dos serviços
            embed.addField("🌐 Backend",
                    String.format("%s %s (%dms)",
                            getStatusEmoji(backendStatus.getStatus()),
                            backendStatus.getStatus(),
                            backendStatus.getResponseTime() != null ? backendStatus.getResponseTime() : 0),
                    true);

            embed.addField("💻 Frontend",
                    String.format("%s %s (%dms)",
                            getStatusEmoji(frontendStatus.getStatus()),
                            frontendStatus.getStatus(),
                            frontendStatus.getResponseTime() != null ? frontendStatus.getResponseTime() : 0),
                    true);

            embed.addField("🗄️ Database",
                    String.format("%s %s (%dms)",
                            getStatusEmoji(databaseStatus.getStatus()),
                            databaseStatus.getStatus(),
                            databaseStatus.getResponseTime() != null ? databaseStatus.getResponseTime() : 0),
                    true);

            // Métricas resumidas
            embed.addField("🖥️ Métricas do Sistema",
                    String.format("CPU: %.1f%% | Memória: %.1f%% | Disco: %.1f%%",
                            metrics.getCpuUsage(), metrics.getMemoryUsage(), metrics.getDiskUsage()),
                    false);

            // Alertas se houver
            StringBuilder alerts = new StringBuilder();
            if (metrics.getCpuUsage() > 80) alerts.append("⚠️ CPU Alta\n");
            if (metrics.getMemoryUsage() > 85) alerts.append("⚠️ Memória Alta\n");
            if (metrics.getDiskUsage() > 90) alerts.append("🚨 Disco Crítico\n");

            if (alerts.length() > 0) {
                embed.addField("🚨 Alertas", alerts.toString(), false);
            }

            embed.setFooter("Sistema de Observabilidade Lavorato", null);

            event.getHook().editOriginalEmbeds(embed.build()).queue();
        } catch (Exception e) {
            log.error("Erro no comando status: ", e);
            event.getHook().editOriginal("❌ Erro ao obter status do sistema.").queue();
        }
    }

    /**
     * Comando /metrics - Métricas detalhadas
     */
    private void handleMetricsCommand(SlashCommandInteractionEvent event) {
        try {
            SystemMetrics metrics = monitoringService.collectSystemMetrics();

            EmbedBuilder embed = new EmbedBuilder()
                    .setTitle("📈 Métricas Detalhadas do Sistema")
                    .setColor(getMetricsColor(metrics))
                    .setTimestamp(java.time.Instant.now())
                    .addField("🖥️ CPU", String.format("%.2f%%", metrics.getCpuUsage()), true)
                    .addField("💾 Memória", String.format("%.2f%% (%s / %s)",
                            metrics.getMemoryUsage(),
                            formatBytes(metrics.getMemoryUsed()),
                            formatBytes(metrics.getMemoryTotal())), true)
                    .addField("💿 Disco", String.format("%.2f%%", metrics.getDiskUsage()), true)
                    .addField("🔢 Processadores", String.valueOf(metrics.getAvailableProcessors()), true)
                    .addField("📊 Load Average", String.format("%.2f", metrics.getSystemLoadAverage()), true)
                    .addField("🕐 Timestamp", metrics.getTimestamp().format(FORMATTER), true)
                    .setFooter("Atualizado automaticamente a cada 30 minutos", null);

            event.getHook().editOriginalEmbeds(embed.build()).queue();
        } catch (Exception e) {
            log.error("Erro no comando metrics: ", e);
            event.getHook().editOriginal("❌ Erro ao obter métricas do sistema.").queue();
        }
    }

    /**
     * Comando /health - Verificação manual de saúde
     */
    private void handleHealthCommand(SlashCommandInteractionEvent event) {
        try {
            event.getHook().editOriginal("🔍 Executando verificação manual de saúde...").queue();

            monitoringScheduler.executeManualHealthCheck();

            event.getHook().editOriginal("✅ Verificação de saúde executada! Verifique os canais de alerta para resultados.").queue();
        } catch (Exception e) {
            log.error("Erro no comando health: ", e);
            event.getHook().editOriginal("❌ Erro ao executar verificação de saúde.").queue();
        }
    }

    /**
     * Comando /backend - Status específico do backend
     */
    private void handleBackendCommand(SlashCommandInteractionEvent event) {
        try {
            HealthStatus status = monitoringService.checkBackendHealth();

            EmbedBuilder embed = new EmbedBuilder()
                    .setTitle("🌐 Status do Backend")
                    .setColor(getStatusColor(status.getStatus()))
                    .setTimestamp(java.time.Instant.now())
                    .addField("Status", getStatusEmoji(status.getStatus()) + " " + status.getStatus(), true)
                    .addField("Tempo de Resposta", (status.getResponseTime() != null ? status.getResponseTime() + "ms" : "N/A"), true)
                    .addField("Timestamp", status.getTimestamp().format(FORMATTER), true);

            if (status.getError() != null) {
                embed.addField("Erro", "```" + status.getError() + "```", false);
            }

            if (status.getDetails() != null && !status.getDetails().isEmpty()) {
                StringBuilder details = new StringBuilder();
                status.getDetails().forEach((key, value) ->
                        details.append("**").append(key).append(":** ").append(value).append("\n"));
                embed.addField("Detalhes", details.toString(), false);
            }

            event.getHook().editOriginalEmbeds(embed.build()).queue();
        } catch (Exception e) {
            log.error("Erro no comando backend: ", e);
            event.getHook().editOriginal("❌ Erro ao verificar status do backend.").queue();
        }
    }

    /**
     * Comando /frontend - Status específico do frontend
     */
    private void handleFrontendCommand(SlashCommandInteractionEvent event) {
        try {
            HealthStatus status = monitoringService.checkFrontendHealth();

            EmbedBuilder embed = new EmbedBuilder()
                    .setTitle("💻 Status do Frontend")
                    .setColor(getStatusColor(status.getStatus()))
                    .setTimestamp(java.time.Instant.now())
                    .addField("Status", getStatusEmoji(status.getStatus()) + " " + status.getStatus(), true)
                    .addField("Tempo de Resposta", (status.getResponseTime() != null ? status.getResponseTime() + "ms" : "N/A"), true)
                    .addField("Timestamp", status.getTimestamp().format(FORMATTER), true);

            if (status.getError() != null) {
                embed.addField("Erro", "```" + status.getError() + "```", false);
            }

            event.getHook().editOriginalEmbeds(embed.build()).queue();
        } catch (Exception e) {
            log.error("Erro no comando frontend: ", e);
            event.getHook().editOriginal("❌ Erro ao verificar status do frontend.").queue();
        }
    }

    /**
     * Comando /database - Status específico do banco
     */
    private void handleDatabaseCommand(SlashCommandInteractionEvent event) {
        try {
            HealthStatus status = monitoringService.checkDatabaseHealth();

            EmbedBuilder embed = new EmbedBuilder()
                    .setTitle("🗄️ Status do Banco de Dados")
                    .setColor(getStatusColor(status.getStatus()))
                    .setTimestamp(java.time.Instant.now())
                    .addField("Status", getStatusEmoji(status.getStatus()) + " " + status.getStatus(), true)
                    .addField("Tempo de Resposta", (status.getResponseTime() != null ? status.getResponseTime() + "ms" : "N/A"), true)
                    .addField("Timestamp", status.getTimestamp().format(FORMATTER), true);

            if (status.getError() != null) {
                embed.addField("Erro", "```" + status.getError() + "```", false);
            }

            if (status.getDetails() != null && !status.getDetails().isEmpty()) {
                StringBuilder details = new StringBuilder();
                status.getDetails().forEach((key, value) ->
                        details.append("**").append(key).append(":** ").append(value).append("\n"));
                embed.addField("Detalhes", details.toString(), false);
            }

            event.getHook().editOriginalEmbeds(embed.build()).queue();
        } catch (Exception e) {
            log.error("Erro no comando database: ", e);
            event.getHook().editOriginal("❌ Erro ao verificar status do banco de dados.").queue();
        }
    }

    /**
     * Comando /help - Lista de comandos
     */
    private void handleHelpCommand(SlashCommandInteractionEvent event) {
        EmbedBuilder embed = new EmbedBuilder()
                .setTitle("🤖 Comandos do Bot de Observabilidade")
                .setColor(Color.BLUE)
                .setDescription("Lista de comandos disponíveis:")
                .addField("/status", "Mostra o status completo de todos os serviços", false)
                .addField("/metrics", "Exibe métricas detalhadas do sistema", false)
                .addField("/health", "Executa verificação manual de saúde", false)
                .addField("/backend", "Verifica apenas o status do backend", false)
                .addField("/frontend", "Verifica apenas o status do frontend", false)
                .addField("/database", "Verifica apenas o status do banco de dados", false)
                .addField("/ping", "Verifica se o bot está respondendo", false)
                .addField("/help", "Mostra esta mensagem de ajuda", false)
                .addField("💡 Dica", "Você também pode me mencionar com 'status' para verificação rápida!", false)
                .setFooter("Bot de Observabilidade Lavorato v1.0", null)
                .setTimestamp(java.time.Instant.now());

        event.getHook().editOriginalEmbeds(embed.build()).queue();
    }

    /**
     * Comando /ping - Teste de conectividade
     */
    private void handlePingCommand(SlashCommandInteractionEvent event) {
        long startTime = System.currentTimeMillis();
        event.getHook().editOriginal("🏓 Pong!").queue(message -> {
            long endTime = System.currentTimeMillis();
            long latency = endTime - startTime;
            event.getHook().editOriginal(String.format("🏓 Pong! Latência: %dms", latency)).queue();
        });
    }

    /**
     * Resposta rápida para menções com "status"
     */
    private void handleQuickStatus(MessageReceivedEvent event) {
        try {
            HealthStatus backendStatus = monitoringService.checkBackendHealth();
            HealthStatus frontendStatus = monitoringService.checkFrontendHealth();
            HealthStatus databaseStatus = monitoringService.checkDatabaseHealth();

            String response = String.format("📊 **Status Rápido:**\n🌐 Backend: %s %s\n💻 Frontend: %s %s\n🗄️ Database: %s %s",
                    getStatusEmoji(backendStatus.getStatus()), backendStatus.getStatus(),
                    getStatusEmoji(frontendStatus.getStatus()), frontendStatus.getStatus(),
                    getStatusEmoji(databaseStatus.getStatus()), databaseStatus.getStatus());

            event.getChannel().sendMessage(response).queue();
        } catch (Exception e) {
            log.error("Erro na resposta rápida de status: ", e);
            event.getChannel().sendMessage("❌ Erro ao obter status do sistema.").queue();
        }
    }

    /**
     * Resposta rápida para ajuda
     */
    private void handleQuickHelp(MessageReceivedEvent event) {
        String helpMessage = "🤖 **Bot de Observabilidade Lavorato**\n" +
                "Use os comandos slash:\n" +
                "`/status` - Status completo\n" +
                "`/metrics` - Métricas do sistema\n" +
                "`/health` - Verificação manual\n" +
                "`/help` - Lista completa de comandos";

        event.getChannel().sendMessage(helpMessage).queue();
    }

    // Métodos utilitários

    private String getStatusEmoji(String status) {
        return switch (status.toLowerCase()) {
            case "up" -> "✅";
            case "down" -> "❌";
            case "error" -> "⚠️";
            default -> "❓";
        };
    }

    private Color getStatusColor(String status) {
        return switch (status.toLowerCase()) {
            case "up" -> Color.GREEN;
            case "down" -> Color.RED;
            case "error" -> Color.ORANGE;
            default -> Color.GRAY;
        };
    }

    private Color getOverallStatusColor(HealthStatus... statuses) {
        for (HealthStatus status : statuses) {
            if ("DOWN".equals(status.getStatus()) || "ERROR".equals(status.getStatus())) {
                return Color.RED;
            }
        }
        return Color.GREEN;
    }

    private Color getMetricsColor(SystemMetrics metrics) {
        if (metrics.getCpuUsage() > 80 || metrics.getMemoryUsage() > 85 || metrics.getDiskUsage() > 90) {
            return Color.RED;
        } else if (metrics.getCpuUsage() > 60 || metrics.getMemoryUsage() > 70 || metrics.getDiskUsage() > 80) {
            return Color.ORANGE;
        } else {
            return Color.GREEN;
        }
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }
}
