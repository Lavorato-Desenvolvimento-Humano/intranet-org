package com.intranet.backend.dto;

import com.intranet.backend.model.Relatorio;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class RelatorioSummaryDto {
    private UUID id;
    private String titulo;
    private String usuarioGeradorNome;
    private LocalDateTime periodoInicio;
    private LocalDateTime periodoFim;
    private Integer totalRegistros;
    private Relatorio.StatusRelatorio statusRelatorio;
    private LocalDateTime createdAt;
    private Boolean possuiCompartilhamento;
}