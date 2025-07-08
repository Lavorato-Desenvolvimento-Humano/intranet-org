package com.intranet.backend.dto;

import com.intranet.backend.model.FichaPdfJob;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FichaPdfStatusDto {
    private String jobId;
    private FichaPdfJob.StatusJob status;
    private String mensagem;
    private Integer progresso; // 0-100
    private Integer totalItens;
    private Integer itensProcessados;
    private Integer fichasReutilizadas;
    private Integer fichasNovas;
    private Integer duplicatasEvitadas;
    private LocalDateTime iniciadoEm;
    private LocalDateTime atualizadoEm;
    private String observacoes;
    private Boolean podeDownload;
}
