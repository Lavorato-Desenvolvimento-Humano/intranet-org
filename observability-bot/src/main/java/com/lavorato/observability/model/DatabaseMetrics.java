package com.lavorato.observability.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Representa métricas específicas do banco de dados
 */
@Data
@Builder
public class DatabaseMetrics {
    private LocalDateTime timestamp;
    private int activeConnections;
    private int maxConnections;
    private long totalQueries;
    private double averageQueryTime;
    private long slowQueries;
    private String databaseSize;
    private boolean isHealthy;
    private String error;
}
