package com.intranet.backend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class GraficoTimelineDto {
    private LocalDate data;
    private Long totalOperacoes;
    private Long criações;
    private Long mudancasStatus;
    private Long atualizacoes;
    private Long quantidade;
}