package com.intranet.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class RelatorioCompartilhamentoDto {
    private UUID id;
    private UUID relatorioId;
    private String relatorioTitulo;
    private UUID usuarioOrigemId;
    private String usuarioOrigemNome;
    private UUID usuarioDestinoId;
    private String usuarioDestinoNome;
    private String observacao;
    private LocalDateTime dataCompartilhamento;
    private Boolean visualizado;
    private LocalDateTime dataVisualizacao;
}