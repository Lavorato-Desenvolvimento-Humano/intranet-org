package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "relatorios_compartilhamentos")
public class RelatorioCompartilhamento {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "relatorio_id", nullable = false)
    private Relatorio relatorio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_origem_id", nullable = false)
    private User usuarioOrigem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_destino_id", nullable = false)
    private User usuarioDestino;

    @Column(columnDefinition = "TEXT")
    private String observacao;

    @Column(name = "data_compartilhamento", nullable = false)
    private LocalDateTime dataCompartilhamento = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean visualizado = false;

    @Column(name = "data_visualizacao")
    private LocalDateTime dataVisualizacao;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Método para marcar como visualizado
    public void marcarComoVisualizado() {
        this.visualizado = true;
        this.dataVisualizacao = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}