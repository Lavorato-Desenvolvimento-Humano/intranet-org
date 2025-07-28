package com.intranet.backend.dto;

import com.intranet.backend.model.FichaPdfJob;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FichaPdfStatusDto {
    private String jobId;
    private FichaPdfJob.StatusJob status;
    private FichaPdfJob.TipoGeracao tipo;
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

    private String usuarioNome;
    private String usuarioEmail;

    private DadosJobDto dadosJob;

    @Data
    public static class DadosJobDto {
        private String convenioNome;
        private String convenioId;
        private String pacienteNome;
        private String pacienteId;
        private Integer mes;
        private Integer ano;
        private String mesExtenso;
        private String periodo;
        private Integer totalConvenios;
    }
}
