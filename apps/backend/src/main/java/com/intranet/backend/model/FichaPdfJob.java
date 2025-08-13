package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ficha_pdf_jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class FichaPdfJob {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "job_id", nullable = false, unique = true, length = 50)
    private String jobId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoGeracao tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusJob status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;

    @Column(name = "total_fichas")
    private Integer totalFichas;

    @Column(name = "fichas_processadas")
    private Integer fichasProcessadas;

    @Column(name = "iniciado", nullable = false)
    private LocalDateTime iniciado;

    @Column(name = "concluido")
    private LocalDateTime concluido;

    @Column(name = "arquivo_path")
    private String arquivoPath;

    @Column(name = "pode_download")
    private Boolean podeDownload = false;

    @Column(name = "erro", columnDefinition = "TEXT")
    private String erro;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum TipoGeracao {
        PACIENTE("Paciente"),
        CONVENIO("Convênio"),
        LOTE("Lote");

        private final String displayName;

        TipoGeracao(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum StatusJob {
        INICIADO("Iniciado"),
        PROCESSANDO("Processando"),
        CONCLUIDO("Concluído"),
        ERRO("Erro");

        private final String displayName;

        StatusJob(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public boolean isPodeDownload() {
        // Verificações básicas
        if (podeDownload == null || !podeDownload) {
            return false;
        }

        if (status != StatusJob.CONCLUIDO) {
            return false;
        }

        if (arquivoPath == null || arquivoPath.trim().isEmpty()) {
            return false;
        }

        try {
            return Files.exists(Paths.get(arquivoPath));
        } catch (Exception e) {
            // Se houver erro ao verificar o arquivo, considerar como não disponível
            return false;
        }
    }

    public boolean isPodeDownloadLogico() {
        return podeDownload != null && podeDownload &&
                status == StatusJob.CONCLUIDO &&
                arquivoPath != null && !arquivoPath.trim().isEmpty();
    }


}