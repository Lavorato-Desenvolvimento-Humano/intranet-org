package com.intranet.backend.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class FichaPdfResponseDto {
    private Boolean sucesso;
    private String mensagem;
    private String jobId;
    private String status;
    private Integer totalFichas;
    private Integer fichasProcessadas;
    private Boolean podeDownload;
    private String downloadUrl;
    private String arquivo;

    // NOVOS CAMPOS para compatibilidade
    private Integer totalFichasGeradas;
    private Integer totalPacientesProcessados;
    private Integer fichasReutilizadas;
    private Integer fichasNovas;
    private Integer pacientesComFichasExistentes;
    private Integer pacientesSemFichas;

    private Map<String, Object> estatisticas;
    private LocalDateTime iniciadoEm;
    private LocalDateTime concluidoEm;
}
