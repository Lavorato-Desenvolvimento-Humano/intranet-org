package com.lavorato.observability.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Representa o status de saúde de um serviço
 */
@Data
@Builder
public class HealthStatus {
    private String service;
    private String status; // UP, DOWN, ERROR
    private Long responseTime; // em milliseconds
    private LocalDateTime timestamp;
    private String error;
    private Map<String, Object> details;
}