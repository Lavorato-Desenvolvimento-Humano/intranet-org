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

    public Integer getTotalFichas() {
        return totalFichas != null ? totalFichas : 0;
    }

    public Integer getFichasProcessadas() {
        return fichasProcessadas != null ? fichasProcessadas : 0;
    }

    public String getStatus() {
        return status != null ? status : "DESCONHECIDO";
    }

    public String getTipo() {
        return tipo != null ? tipo : "INDEFINIDO";
    }

    public Boolean getPodeDownload() {
        return podeDownload != null ? podeDownload : false;
    }

    public String getJobId() {
        return jobId != null ? jobId : "";
    }

    // Método auxiliar para verificar se o job é válido
    public boolean isValido() {
        return jobId != null &&
                !jobId.trim().isEmpty() &&
                status != null &&
                !status.trim().isEmpty();
    }

    // Método para obter progresso seguro (0-100)
    public int getProgressoSeguro() {
        if (totalFichas == null || totalFichas <= 0) {
            return 0;
        }

        Integer processadas = getFichasProcessadas();
        if (processadas <= 0) {
            return 0;
        }

        if (processadas >= totalFichas) {
            return 100;
        }

        return (int) Math.round((double) processadas / totalFichas * 100);
    }
}
