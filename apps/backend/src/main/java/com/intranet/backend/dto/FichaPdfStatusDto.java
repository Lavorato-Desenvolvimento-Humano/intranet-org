package com.intranet.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    private FichaPdfJob.StatusJob status; // Enum direto para serialização correta
    private FichaPdfJob.TipoGeracao tipo; // Enum direto para serialização correta
    private String mensagem;
    private Integer progresso; // 0-100
    private Integer totalItens; // Nome do campo no DTO original
    private Integer itensProcessados; // Nome do campo no DTO original
    private Integer fichasReutilizadas;
    private Integer fichasNovas;
    private Integer duplicatasEvitadas;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime iniciadoEm; // Nome do campo no DTO original

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime atualizadoEm; // Nome do campo no DTO original

    private String observacoes;
    private Boolean podeDownload;
    private String usuarioNome;
    private String usuarioEmail;
    private DadosJobDto dadosJob;

    // Getters com valores padrão para evitar nulls
    public Integer getTotalItens() {
        return totalItens != null ? totalItens : 0;
    }

    public Integer getItensProcessados() {
        return itensProcessados != null ? itensProcessados : 0;
    }

    public Integer getProgresso() {
        return progresso != null ? progresso : 0;
    }

    public Boolean getPodeDownload() {
        return podeDownload != null ? podeDownload : false;
    }

    @Data
    public static class DadosJobDto {
        private String convenioId;
        private String convenioNome;
        private String pacienteId;
        private String pacienteNome;
        private Integer mes;
        private Integer ano;
        private String mesExtenso;
        private String periodo;
        private String especialidade;
        private Integer quantidadeAutorizada;
        private Integer totalConvenios;

        // Métodos auxiliares
        public String getPeriodoFormatado() {
            if (mes != null && ano != null) {
                return String.format("%02d/%d", mes, ano);
            }
            return periodo != null ? periodo : "-";
        }

        public String getMesExtensoFormatado() {
            if (mesExtenso != null && ano != null) {
                return String.format("%s/%d", mesExtenso, ano);
            }
            return getPeriodoFormatado();
        }
    }
}