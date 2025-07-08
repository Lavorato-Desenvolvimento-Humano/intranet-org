package com.intranet.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FichaPdfStatusDto {
    private String jobId;
    private String status;
    private Integer totalFichas;
    private Integer fichasProcessadas;
    private Double percentualConcluido;
    private String mensagemAtual;
    private LocalDateTime iniciado;
    private LocalDateTime ultimaAtualizacao;
    private String downloadUrl;
    private String erro;
    private LocalDateTime concluido;
    private Boolean podeDownload;
}
