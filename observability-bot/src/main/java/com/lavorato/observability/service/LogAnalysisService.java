package com.lavorato.observability.service;

import com.lavorato.observability.model.LogAlert;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.FileTime;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Service responsável por analisar logs do backend e detectar problemas
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LogAnalysisService {

    @Value("${backend.log.path}")
    private String backendLogPath;

    private final DiscordNotificationService discordNotificationService;

    // Patterns para detectar logs críticos
    private static final Pattern AUTH_FAILURE_PATTERN = Pattern.compile(
            "(.*)(Login failed|Authentication failed|Bad credentials|Email ou senha incorretos)(.*)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern EMAIL_NOT_VERIFIED_PATTERN = Pattern.compile(
            "(.*)(email não verificado|EmailNotVerifiedException)(.*)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern ACCOUNT_NOT_APPROVED_PATTERN = Pattern.compile(
            "(.*)(conta não aprovada|aguardando aprovação)(.*)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern ERROR_PATTERN = Pattern.compile(
            "(.*)(ERROR|Exception|Error)(.*)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern WARN_PATTERN = Pattern.compile(
            "(.*)(WARN|WARNING)(.*)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern DB_ERROR_PATTERN = Pattern.compile(
            "(.*)(SQLException|Database|Connection)(.*)(failed|error|timeout)(.*)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern TIMESTAMP_PATTERN = Pattern.compile(
            "(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})"
    );

    // Cache para evitar spam de alertas
    private final Map<String, LocalDateTime> lastAlertTime = new ConcurrentHashMap<>();
    private final Map<String, Integer> alertCount = new ConcurrentHashMap<>();

    // Intervalo mínimo entre alertas do mesmo tipo (em minutos)
    private static final int ALERT_COOLDOWN_MINUTES = 15;

    /**
     * Analisa logs do backend em busca de problemas
     */
    public void analyzeBackendLogs() {
        try {
            Path logPath = Paths.get(backendLogPath);

            if (!Files.exists(logPath)) {
                log.warn("Diretório de logs não encontrado: {}", backendLogPath);
                return;
            }

            // Processar todos os arquivos de log (.log)
            try (Stream<Path> logFiles = Files.list(logPath)
                    .filter(path -> path.toString().endsWith(".log"))
                    .sorted((path1, path2) -> {
                        try {
                            FileTime time1 = Files.getLastModifiedTime(path1);
                            FileTime time2 = Files.getLastModifiedTime(path2);
                            return time2.compareTo(time1); // Ordem decrescente (mais recentes primeiro)
                        } catch (IOException e) {
                            return 0;
                        }
                    })) {

                logFiles.limit(5).forEach(this::analyzeLogFile);
            }
        } catch (Exception e) {
            log.error("Erro ao analisar logs do backend: ", e);
        }
    }

    /**
     * Analisa um arquivo de log específico
     */
    private void analyzeLogFile(Path logFile) {
        try {
            List<String> recentLines = getRecentLogLines(logFile, 1000); // Últimas 1000 linhas

            for (String line : recentLines) {
                analyzeLine(line, logFile.getFileName().toString());
            }
        } catch (Exception e) {
            log.error("Erro ao analisar arquivo de log {}: ", logFile, e);
        }
    }

    /**
     * Analisa uma linha de log
     */
    private void analyzeLine(String line, String fileName) {
        try {
            // Extrair timestamp se possível
            LocalDateTime timestamp = extractTimestamp(line);
            if (timestamp == null) {
                timestamp = LocalDateTime.now();
            }

            // Verificar padrões críticos
            checkAuthenticationFailures(line, timestamp, fileName);
            checkEmailVerificationIssues(line, timestamp, fileName);
            checkAccountApprovalIssues(line, timestamp, fileName);
            checkDatabaseErrors(line, timestamp, fileName);
            checkGeneralErrors(line, timestamp, fileName);
            checkWarnings(line, timestamp, fileName);

        } catch (Exception e) {
            log.error("Erro ao analisar linha de log: ", e);
        }
    }

    /**
     * Verifica falhas de autenticação
     */
    private void checkAuthenticationFailures(String line, LocalDateTime timestamp, String fileName) {
        Matcher matcher = AUTH_FAILURE_PATTERN.matcher(line);
        if (matcher.find()) {
            String alertKey = "auth_failure";

            if (shouldSendAlert(alertKey)) {
                LogAlert alert = LogAlert.builder()
                        .type("Falha de Autenticação")
                        .level("WARN")
                        .service("Backend")
                        .timestamp(timestamp)
                        .message(line.trim())
                        .logger("AuthenticationService")
                        .count(incrementAlertCount(alertKey))
                        .build();

                discordNotificationService.sendLogAlert(alert);
                updateLastAlertTime(alertKey);

                log.info("Alerta de falha de autenticação enviado para Discord");
            }
        }
    }

    /**
     * Verifica problemas de verificação de email
     */
    private void checkEmailVerificationIssues(String line, LocalDateTime timestamp, String fileName) {
        Matcher matcher = EMAIL_NOT_VERIFIED_PATTERN.matcher(line);
        if (matcher.find()) {
            String alertKey = "email_not_verified";

            if (shouldSendAlert(alertKey)) {
                LogAlert alert = LogAlert.builder()
                        .type("Email Não Verificado")
                        .level("INFO")
                        .service("Backend")
                        .timestamp(timestamp)
                        .message(line.trim())
                        .logger("AuthenticationService")
                        .count(incrementAlertCount(alertKey))
                        .build();

                discordNotificationService.sendLogAlert(alert);
                updateLastAlertTime(alertKey);
            }
        }
    }

    /**
     * Verifica problemas de aprovação de conta
     */
    private void checkAccountApprovalIssues(String line, LocalDateTime timestamp, String fileName) {
        Matcher matcher = ACCOUNT_NOT_APPROVED_PATTERN.matcher(line);
        if (matcher.find()) {
            String alertKey = "account_not_approved";

            if (shouldSendAlert(alertKey)) {
                LogAlert alert = LogAlert.builder()
                        .type("Conta Não Aprovada")
                        .level("INFO")
                        .service("Backend")
                        .timestamp(timestamp)
                        .message(line.trim())
                        .logger("AuthenticationService")
                        .count(incrementAlertCount(alertKey))
                        .build();

                discordNotificationService.sendLogAlert(alert);
                updateLastAlertTime(alertKey);
            }
        }
    }

    /**
     * Verifica erros de banco de dados
     */
    private void checkDatabaseErrors(String line, LocalDateTime timestamp, String fileName) {
        Matcher matcher = DB_ERROR_PATTERN.matcher(line);
        if (matcher.find()) {
            String alertKey = "database_error";

            if (shouldSendAlert(alertKey)) {
                LogAlert alert = LogAlert.builder()
                        .type("Erro de Banco de Dados")
                        .level("ERROR")
                        .service("Database")
                        .timestamp(timestamp)
                        .message(line.trim())
                        .logger("DatabaseService")
                        .count(incrementAlertCount(alertKey))
                        .build();

                discordNotificationService.sendLogAlert(alert);
                updateLastAlertTime(alertKey);
            }
        }
    }

    /**
     * Verifica erros gerais
     */
    private void checkGeneralErrors(String line, LocalDateTime timestamp, String fileName) {
        Matcher matcher = ERROR_PATTERN.matcher(line);
        if (matcher.find() && !DB_ERROR_PATTERN.matcher(line).find()) {
            String alertKey = "general_error";

            if (shouldSendAlert(alertKey)) {
                String exception = extractException(line);

                LogAlert alert = LogAlert.builder()
                        .type("Erro Geral")
                        .level("ERROR")
                        .service("Backend")
                        .timestamp(timestamp)
                        .message(line.trim())
                        .exception(exception)
                        .count(incrementAlertCount(alertKey))
                        .build();

                discordNotificationService.sendLogAlert(alert);
                updateLastAlertTime(alertKey);
            }
        }
    }

    /**
     * Verifica warnings
     */
    private void checkWarnings(String line, LocalDateTime timestamp, String fileName) {
        Matcher matcher = WARN_PATTERN.matcher(line);
        if (matcher.find()) {
            String alertKey = "warning";

            // Warnings têm cooldown maior para evitar spam
            if (shouldSendAlert(alertKey, 30)) {
                LogAlert alert = LogAlert.builder()
                        .type("Warning")
                        .level("WARN")
                        .service("Backend")
                        .timestamp(timestamp)
                        .message(line.trim())
                        .count(incrementAlertCount(alertKey))
                        .build();

                discordNotificationService.sendLogAlert(alert);
                updateLastAlertTime(alertKey);
            }
        }
    }

    /**
     * Extrai timestamp da linha de log
     */
    private LocalDateTime extractTimestamp(String line) {
        try {
            Matcher matcher = TIMESTAMP_PATTERN.matcher(line);
            if (matcher.find()) {
                String timestampStr = matcher.group(1);
                return LocalDateTime.parse(timestampStr, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            }
        } catch (Exception e) {
            log.debug("Não foi possível extrair timestamp da linha: {}", line);
        }
        return null;
    }

    /**
     * Extrai informações de exceção da linha
     */
    private String extractException(String line) {
        if (line.contains("Exception")) {
            int exceptionIndex = line.indexOf("Exception");
            int endIndex = Math.min(line.length(), exceptionIndex + 100);
            return line.substring(Math.max(0, exceptionIndex - 20), endIndex);
        }
        return null;
    }

    /**
     * Lê as últimas N linhas de um arquivo de log
     */
    private List<String> getRecentLogLines(Path logFile, int maxLines) throws IOException {
        try (Stream<String> lines = Files.lines(logFile)) {
            List<String> allLines = lines.toList();
            int startIndex = Math.max(0, allLines.size() - maxLines);
            return allLines.subList(startIndex, allLines.size());
        }
    }

    /**
     * Verifica se deve enviar alerta (cooldown padrão)
     */
    private boolean shouldSendAlert(String alertKey) {
        return shouldSendAlert(alertKey, ALERT_COOLDOWN_MINUTES);
    }

    /**
     * Verifica se deve enviar alerta com cooldown customizado
     */
    private boolean shouldSendAlert(String alertKey, int cooldownMinutes) {
        LocalDateTime lastAlert = lastAlertTime.get(alertKey);
        if (lastAlert == null) {
            return true;
        }

        return LocalDateTime.now().isAfter(lastAlert.plusMinutes(cooldownMinutes));
    }

    /**
     * Atualiza timestamp do último alerta
     */
    private void updateLastAlertTime(String alertKey) {
        lastAlertTime.put(alertKey, LocalDateTime.now());
    }

    /**
     * Incrementa contador de alertas
     */
    private int incrementAlertCount(String alertKey) {
        return alertCount.merge(alertKey, 1, Integer::sum);
    }

    /**
     * Reset dos contadores (pode ser chamado periodicamente)
     */
    public void resetAlertCounters() {
        alertCount.clear();
        log.info("Contadores de alertas resetados");
    }
}