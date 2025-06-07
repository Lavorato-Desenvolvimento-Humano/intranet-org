package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuiaSummaryDto {
    private UUID id;
    private String pacienteNome;
    private String numeroGuia;
    private List<String> especialidades;
    private Integer quantidadeAutorizada;
    private String convenioNome;
    private Integer mes;
    private Integer ano;
    private LocalDate validade;
    private Integer quatidadeFaturada;
    private BigDecimal valorReais;
    private String usuarioResponsavelNome;
    private long TotalFichas;
    private boolean isVencida;
    private boolean isQuantidadeExcedida;
}
