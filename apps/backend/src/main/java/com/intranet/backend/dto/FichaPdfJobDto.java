package com.intranet.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FichaPdfJobDto {
    private String jobId;
    private String tipo;
    private String status;
    private Integer totalFichas;
    private Integer fichasProcessadas;
    private LocalDateTime iniciado;
    private LocalDateTime concluido;
    private Boolean podeDownload;
    private String downloadUrl;
    private String observacoes;
}
