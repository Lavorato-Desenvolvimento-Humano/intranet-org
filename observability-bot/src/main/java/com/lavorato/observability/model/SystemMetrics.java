package com.lavorato.observability.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Representa métricas do sistema
 */
@Data
@Builder
public class SystemMetrics {
    private LocalDateTime timestamp;
    private double cpuUsage; // percentual 0-100
    private double memoryUsage; // percentual 0-100
    private long memoryTotal; // bytes
    private long memoryUsed; // bytes
    private double diskUsage; // percentual 0-100
    private int availableProcessors;
    private double systemLoadAverage;
    private String error;
}