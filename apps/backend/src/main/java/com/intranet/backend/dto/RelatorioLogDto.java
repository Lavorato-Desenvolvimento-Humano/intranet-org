package com.intranet.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
public class RelatorioLogDto {
    private UUID id;
    private String acao;
    private UUID usuarioId;
    private String usuarioNome;
    private Map<String, Object> detalhes;
    private String ipAddress;
    private LocalDateTime createdAt;
}