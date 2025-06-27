package com.intranet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RelatorioMetadataDto {
    private String titulo;
    private String descricao;
    private LocalDateTime dataGeracao;
    private String usuarioGerador;
    private LocalDateTime periodoInicio;
    private LocalDateTime periodoFim;
    private RelatorioFilterRequest filtrosAplicados;
}