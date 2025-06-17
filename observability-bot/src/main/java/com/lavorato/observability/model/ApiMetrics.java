package com.lavorato.observability.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Representa métricas de performance das APIs
 */
@Data
@Builder
public class ApiMetrics {
    private LocalDateTime timestamp;
    private String endpoint;
    private long responseTime;
    private int statusCode;
    private String method;
    private boolean success;
    private String error;
    private Map<String, Object> additionalData;
}
