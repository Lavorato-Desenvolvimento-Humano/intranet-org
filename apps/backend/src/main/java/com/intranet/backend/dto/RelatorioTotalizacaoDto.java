package com.intranet.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RelatorioTotalizacaoDto {
    private long totalItens;
    private long totalGuias;
    private long totalFichas;
    private long totalCriacoes;
    private long totalEdicoes;
    private long totalMudancasStatus;
    private BigDecimal valorTotalGuias;
    private long quantidadeAutorizadaTotal;
}
