package com.intranet.backend.dto;

import com.intranet.backend.model.Relatorio;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
public class RelatorioDto {
    private UUID id;
    private String titulo;
    private String descricao;
    private UUID usuarioGeradorId;
    private String usuarioGeradorNome;
    private LocalDateTime periodoInicio;
    private LocalDateTime periodoFim;
    private Map<String, Object> filtros;
    private Integer totalRegistros;
    private String hashCompartilhamento;
    private Relatorio.StatusRelatorio statusRelatorio;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}