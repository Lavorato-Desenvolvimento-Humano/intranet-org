package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuiaDto {
    private UUID id;
    private String numeroGuia;
    private String status;
    private UUID pacienteId;
    private String pacienteNome;
    private List<String> especialidades;
    private Integer quantidadeAutorizada;
    private UUID convenioId;
    private String convenioNome;
    private Integer mes;
    private Integer ano;
    private LocalDate validade;
    private String lote;
    private Integer quantidadeFaturada;
    private BigDecimal valorReais;
    private UUID usuarioResponsavelId;
    private String usuarioResponsavelNome;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long TotalFichas;
    private boolean isVencida;
    private boolean isQuantidadeExcedida;
    private Integer quantidadeRestante;
}
