package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "relatorios")
public class Relatorio {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_gerador_id", nullable = false)
    private User usuarioGerador;

    @Column(name = "periodo_inicio", nullable = false)
    private LocalDateTime periodoInicio;

    @Column(name = "periodo_fim", nullable = false)
    private LocalDateTime periodoFim;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "filtros", columnDefinition = "jsonb")
    private String filtros;

    @Column(name = "total_registros", nullable = false)
    private Integer totalRegistros = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dados_relatorio", columnDefinition = "jsonb")
    private String dadosRelatorio;

    @Column(name = "hash_compartilhamento", unique = true)
    private String hashCompartilhamento;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_relatorio")
    private StatusRelatorio statusRelatorio = StatusRelatorio.PROCESSANDO;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum StatusRelatorio {
        PROCESSANDO,
        CONCLUIDO,
        ERRO
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Método para gerar hash de compartilhamento
    public void gerarHashCompartilhamento() {
        this.hashCompartilhamento = UUID.randomUUID().toString().replace("-", "");
    }
}