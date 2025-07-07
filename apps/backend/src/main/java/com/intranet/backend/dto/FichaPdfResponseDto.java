package com.intranet.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FichaPdfResponseDto {
    private String jobId;
    private String status;
    private String mensagem;
    private Integer totalFichas;
    private Integer fichasProcessadas;
    private String downloadUrl;
    private LocalDateTime iniciado;
    private LocalDateTime concluido;
    private String erro;
}
