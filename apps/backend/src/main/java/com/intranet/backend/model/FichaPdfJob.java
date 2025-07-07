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
@Table(name = "ficha_pdf_jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class FichaPdfJob {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "job_id", unique = true, nullable = false)
    private String jobId;

    @Column(name = "tipo", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoGeracao tipo;

    @Column(name = "titulo", length = 500)
    private String titulo;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private StatusJob status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;

    // Parâmetros da geração (JSON)
    @Column(name = "parametros", columnDefinition = "TEXT")
    private String parametros;

    // Resultados
    @Column(name = "total_fichas")
    private Integer totalFichas;

    @Column(name = "fichas_processadas")
    private Integer fichasProcessadas;

    @Column(name = "arquivo_path")
    private String arquivoPath; // Caminho do arquivo PDF gerado

    @Column(name = "arquivo_nome")
    private String arquivoNome;

    @Column(name = "arquivo_tamanho")
    private Long arquivoTamanho; // Tamanho em bytes

    // Controle de tempo
    @Column(name = "iniciado")
    private LocalDateTime iniciado;

    @Column(name = "concluido")
    private LocalDateTime concluido;

    @Column(name = "tempo_processamento")
    private Long tempoProcessamento; // Milissegundos

    // Erro
    @Column(name = "erro", columnDefinition = "TEXT")
    private String erro;

    @Column(name = "stack_trace", columnDefinition = "TEXT")
    private String stackTrace;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Enums
    public enum TipoGeracao {
        PACIENTE("Paciente Individual"),
        CONVENIO("Por Convênio"),
        LOTE("Lote de Convênios");

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
    }

    // Métodos utilitários
    public Double getPercentualConcluido() {
        if (totalFichas == null || totalFichas == 0) {
            return 0.0;
        }
        if (fichasProcessadas == null) {
            return 0.0;
        }
        return (fichasProcessadas.doubleValue() / totalFichas.doubleValue()) * 100.0;
    }

    public boolean isCompleto() {
        return status == StatusJob.CONCLUIDO || status == StatusJob.ERRO;
    }

    public boolean isPodeDownload() {
        return status == StatusJob.CONCLUIDO && arquivoPath != null;
    }
}
