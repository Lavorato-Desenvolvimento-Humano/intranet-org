package com.intranet.backend.dto;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuiaUpdateRequest {

    @Valid
    private List<GuiaItemUpdate> itens;

    private String numeroGuia;
    private String numeroVenda;
    private Integer mes;
    private Integer ano;
    private LocalDate validade;
    private String lote;
    private Integer quantidadeFaturada;
    private BigDecimal valorReais;
    private String status;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GuiaItemUpdate {
        private String especialidade;
        private Integer quantidadeAutorizada;
    }
}