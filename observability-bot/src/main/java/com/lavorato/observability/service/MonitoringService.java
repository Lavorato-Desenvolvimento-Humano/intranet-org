package com.lavorato.observability.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lavorato.observability.model.HealthStatus;
import com.lavorato.observability.model.SystemMetrics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import com.sun.management.OperatingSystemMXBean;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.FileStore;
import java.nio.file.FileSystems;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Service responsável por coletar métricas e verificar status do sistema
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MonitoringService {

    @Value("${backend.url}")
    private String backendUrl;

    @Value("${backend.health.endpoint}")
    private String healthEndpoint;

    @Value("${frontend.url}")
    private String frontendUrl;

    private final DataSource dataSource;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Verifica o status de saúde do backend
     */
    public HealthStatus checkBackendHealth() {
        try {
            long startTime = System.currentTimeMillis();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(backendUrl + healthEndpoint))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            long responseTime = System.currentTimeMillis() - startTime;

            if (response.statusCode() == 200) {
                JsonNode responseBody = objectMapper.readTree(response.body());

                return HealthStatus.builder()
                        .service("Backend")
                        .status("UP")
                        .responseTime(responseTime)
                        .timestamp(LocalDateTime.now())
                        .details(parseBackendDetails(responseBody))
                        .build();
            } else {
                return HealthStatus.builder()
                        .service("Backend")
                        .status("DOWN")
                        .responseTime(responseTime)
                        .timestamp(LocalDateTime.now())
                        .error("HTTP " + response.statusCode())
                        .build();
            }
        } catch (Exception e) {
            log.error("Erro ao verificar saúde do backend: ", e);
            return HealthStatus.builder()
                    .service("Backend")
                    .status("ERROR")
                    .timestamp(LocalDateTime.now())
                    .error(e.getMessage())
                    .build();
        }
    }

    /**
     * Verifica o status do frontend
     */
    public HealthStatus checkFrontendHealth() {
        try {
            long startTime = System.currentTimeMillis();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(frontendUrl))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            long responseTime = System.currentTimeMillis() - startTime;

            return HealthStatus.builder()
                    .service("Frontend")
                    .status(response.statusCode() == 200 ? "UP" : "DOWN")
                    .responseTime(responseTime)
                    .timestamp(LocalDateTime.now())
                    .build();
        } catch (Exception e) {
            log.error("Erro ao verificar saúde do frontend: ", e);
            return HealthStatus.builder()
                    .service("Frontend")
                    .status("ERROR")
                    .timestamp(LocalDateTime.now())
                    .error(e.getMessage())
                    .build();
        }
    }

    /**
     * Verifica conectividade com o banco de dados
     */
    public HealthStatus checkDatabaseHealth() {
        try {
            long startTime = System.currentTimeMillis();

            // Verificar se DataSource está disponível
            if (dataSource == null) {
                return HealthStatus.builder()
                        .service("Database")
                        .status("ERROR")
                        .timestamp(LocalDateTime.now())
                        .error("DataSource não configurado")
                        .build();
            }

            try (Connection connection = dataSource.getConnection()) {
                PreparedStatement statement = connection.prepareStatement("SELECT 1");
                ResultSet resultSet = statement.executeQuery();

                long responseTime = System.currentTimeMillis() - startTime;

                if (resultSet.next() && resultSet.getInt(1) == 1) {
                    Map<String, Object> details = new HashMap<>();
                    try {
                        details.put("database", connection.getMetaData().getDatabaseProductName());
                        details.put("version", connection.getMetaData().getDatabaseProductVersion());
                        details.put("url", connection.getMetaData().getURL());
                    } catch (Exception e) {
                        log.debug("Erro ao obter metadados do banco: ", e);
                        details.put("metadata_error", e.getMessage());
                    }

                    return HealthStatus.builder()
                            .service("Database")
                            .status("UP")
                            .responseTime(responseTime)
                            .timestamp(LocalDateTime.now())
                            .details(details)
                            .build();
                }
            }
        } catch (Exception e) {
            log.error("Erro ao verificar saúde do banco: ", e);
            return HealthStatus.builder()
                    .service("Database")
                    .status("ERROR")
                    .timestamp(LocalDateTime.now())
                    .error(e.getMessage())
                    .build();
        }

        return HealthStatus.builder()
                .service("Database")
                .status("DOWN")
                .timestamp(LocalDateTime.now())
                .error("Conexão falhou sem exceção específica")
                .build();
    }

    /**
     * Coleta métricas do sistema
     */
    public SystemMetrics collectSystemMetrics() {
        try {
            OperatingSystemMXBean osBean = (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();

            // CPU - usar cast para acessar getProcessCpuLoad
            double cpuUsage = osBean.getProcessCpuLoad() * 100;
            if (cpuUsage < 0) {
                cpuUsage = 0; // Algumas JVMs retornam valor negativo inicialmente
            }

            // Memória
            long totalMemory = memoryBean.getHeapMemoryUsage().getMax();
            long usedMemory = memoryBean.getHeapMemoryUsage().getUsed();
            double memoryUsage = (double) usedMemory / totalMemory * 100;

            // Disco
            double diskUsage = calculateDiskUsage();

            // Processar informações básicas do OS
            java.lang.management.OperatingSystemMXBean basicOsBean = ManagementFactory.getOperatingSystemMXBean();

            return SystemMetrics.builder()
                    .timestamp(LocalDateTime.now())
                    .cpuUsage(cpuUsage)
                    .memoryUsage(memoryUsage)
                    .memoryTotal(totalMemory)
                    .memoryUsed(usedMemory)
                    .diskUsage(diskUsage)
                    .availableProcessors(basicOsBean.getAvailableProcessors())
                    .systemLoadAverage(basicOsBean.getSystemLoadAverage())
                    .build();
        } catch (Exception e) {
            log.error("Erro ao coletar métricas do sistema: ", e);
            return SystemMetrics.builder()
                    .timestamp(LocalDateTime.now())
                    .cpuUsage(0.0)
                    .memoryUsage(0.0)
                    .diskUsage(0.0)
                    .error(e.getMessage())
                    .build();
        }
    }

    /**
     * Calcula uso do disco
     */
    private double calculateDiskUsage() {
        try {
            FileStore store = FileSystems.getDefault()
                    .getFileStores()
                    .iterator()
                    .next();

            long total = store.getTotalSpace();
            long available = store.getUsableSpace();
            long used = total - available;

            return (double) used / total * 100;
        } catch (IOException e) {
            log.warn("Não foi possível calcular uso do disco: ", e);
            return 0.0;
        }
    }

    /**
     * Extrai detalhes da resposta do backend
     */
    private Map<String, Object> parseBackendDetails(JsonNode responseBody) {
        Map<String, Object> details = new HashMap<>();

        try {
            if (responseBody.has("status")) {
                details.put("status", responseBody.get("status").asText());
            }
            if (responseBody.has("authenticated")) {
                details.put("authenticated", responseBody.get("authenticated").asBoolean());
            }
            if (responseBody.has("username")) {
                details.put("username", responseBody.get("username").asText());
            }
            if (responseBody.has("timestamp")) {
                details.put("timestamp", responseBody.get("timestamp").asLong());
            }
        } catch (Exception e) {
            log.warn("Erro ao extrair detalhes do backend: ", e);
        }

        return details;
    }
}