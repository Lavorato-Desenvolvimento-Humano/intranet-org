package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ficha_pdf_job")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class FichaPdfJob {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "job_id", nullable = false, unique = true, length = 100)
    private String jobId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoGeracao tipo;

    @Column(name = "titulo", length = 500)
    private String titulo;

    @Column(name = "parametros", columnDefinition = "TEXT")
    private String parametros;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusJob status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;

    @Column(name = "total_fichas")
    private Integer totalFichas = 0;

    @Column(name = "fichas_processadas")
    private Integer fichasProcessadas = 0;

    @Column(name = "iniciado")
    private LocalDateTime iniciado;

    @Column(name = "concluido")
    private LocalDateTime concluido;

    @Column(name = "arquivo_path", length = 1000)
    private String arquivoPath;

    @Column(name = "arquivo_nome", length = 500)
    private String arquivoNome;

    @Column(name = "arquivo_tamanho")
    private Long arquivoTamanho;

    @Column(name = "erro", columnDefinition = "TEXT")
    private String erro;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum TipoGeracao {
        PACIENTE("Fichas de Paciente"),
        CONVENIO("Fichas de Convênio"),
        LOTE("Geração em Lote");

        private final String descricao;

        TipoGeracao(String descricao) {
            this.descricao = descricao;
        }

        public String getDescricao() {
            return descricao;
        }
    }

    public enum StatusJob {
        INICIADO("Iniciado"),
        PROCESSANDO("Processando"),
        CONCLUIDO("Concluído"),
        ERRO("Erro"),
        CANCELADO("Cancelado");

        private final String descricao;

        StatusJob(String descricao) {
            this.descricao = descricao;
        }

        public String getDescricao() {
            return descricao;
        }

        public boolean isAtivo() {
            return this == INICIADO || this == PROCESSANDO;
        }

        public boolean isFinalizado() {
            return this == CONCLUIDO || this == ERRO || this == CANCELADO;
        }
    }

    /**
     * Verifica se o job pode ser baixado
     */
    public boolean isPodeDownload() {
        return status == StatusJob.CONCLUIDO &&
                arquivoPath != null &&
                !arquivoPath.trim().isEmpty();
    }

    /**
     * Calcula o progresso percentual
     */
    public double getProgressoPercentual() {
        if (totalFichas == null || totalFichas == 0) {
            return 0.0;
        }
        if (fichasProcessadas == null) {
            return 0.0;
        }
        return Math.min(100.0, (double) fichasProcessadas / totalFichas * 100.0);
    }

    /**
     * Verifica se o job está ativo (em processamento)
     */
    public boolean isAtivo() {
        return status != null && status.isAtivo();
    }

    /**
     * Verifica se o job está finalizado
     */
    public boolean isFinalizado() {
        return status != null && status.isFinalizado();
    }

    /**
     * Obtém duração do processamento em minutos
     */
    public Long getDuracaoMinutos() {
        if (iniciado == null) {
            return null;
        }

        LocalDateTime fim = concluido != null ? concluido : LocalDateTime.now();
        return java.time.Duration.between(iniciado, fim).toMinutes();
    }

    /**
     * Verifica se o job está em timeout
     */
    public boolean isTimeout(int timeoutMinutos) {
        if (!isAtivo() || iniciado == null) {
            return false;
        }

        LocalDateTime limite = iniciado.plusMinutes(timeoutMinutos);
        return LocalDateTime.now().isAfter(limite);
    }

    /**
     * Obtém tamanho do arquivo formatado
     */
    public String getArquivoTamanhoFormatado() {
        if (arquivoTamanho == null || arquivoTamanho == 0) {
            return "0 B";
        }

        final String[] unidades = {"B", "KB", "MB", "GB"};
        double tamanho = arquivoTamanho.doubleValue();
        int unidadeIndex = 0;

        while (tamanho >= 1024 && unidadeIndex < unidades.length - 1) {
            tamanho /= 1024;
            unidadeIndex++;
        }

        return String.format("%.1f %s", tamanho, unidades[unidadeIndex]);
    }

    /**
     * Obtém mensagem de status personalizada
     */
    public String getMensagemStatus() {
        if (status == null) {
            return "Status desconhecido";
        }

        switch (status) {
            case INICIADO:
                return "Preparando geração de fichas...";
            case PROCESSANDO:
                if (totalFichas != null && totalFichas > 0) {
                    return String.format("Processando: %d/%d fichas (%.1f%%)",
                            fichasProcessadas != null ? fichasProcessadas : 0,
                            totalFichas,
                            getProgressoPercentual());
                } else {
                    return "Processando fichas...";
                }
            case CONCLUIDO:
                if (fichasProcessadas != null && fichasProcessadas > 0) {
                    return String.format("Concluído: %d fichas geradas", fichasProcessadas);
                } else {
                    return "Geração concluída";
                }
            case ERRO:
                return "Erro no processamento" + (erro != null ? ": " + erro : "");
            case CANCELADO:
                return "Processamento cancelado";
            default:
                return status.getDescricao();
        }
    }

    /**
     * Verifica se o arquivo ainda existe fisicamente
     */
    public boolean isArquivoExiste() {
        if (arquivoPath == null || arquivoPath.trim().isEmpty()) {
            return false;
        }

        try {
            return java.nio.file.Files.exists(java.nio.file.Paths.get(arquivoPath));
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String toString() {
        return String.format("FichaPdfJob{jobId='%s', tipo=%s, status=%s, fichas=%d/%d}",
                jobId, tipo, status,
                fichasProcessadas != null ? fichasProcessadas : 0,
                totalFichas != null ? totalFichas : 0);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FichaPdfJob)) return false;
        FichaPdfJob that = (FichaPdfJob) o;
        return jobId != null && jobId.equals(that.jobId);
    }

    @Override
    public int hashCode() {
        return jobId != null ? jobId.hashCode() : 0;
    }
}