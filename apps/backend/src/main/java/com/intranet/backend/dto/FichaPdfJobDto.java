package com.intranet.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FichaPdfJobDto {
    private String jobId;
    private String tipo; // PACIENTE, CONVENIO, LOTE
    private String titulo; // Ex: "Fichas - João Silva - Jan/2025"
    private String status;
    private Integer totalFichas;
    private LocalDateTime iniciado;
    private LocalDateTime concluido;
    private String downloadUrl;
    private Boolean podeDownload;
}
