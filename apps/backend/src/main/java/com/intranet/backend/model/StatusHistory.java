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
@Table(name = "status_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class StatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    private EntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "status_anterior", length = 100)
    private String statusAnterior;

    @Column(name = "status_novo", nullable = false, length = 100)
    private String statusNovo;

    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alterado_por", nullable = false)
    private User alteradoPor;

    @Column(name = "data_alteracao", nullable = false)
    private LocalDateTime dataAlteracao;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Enum para definir o tipo de entidade
     */
    public enum EntityType {
        GUIA("Guia"),
        FICHA("Ficha");

        private final String displayName;

        EntityType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * Construtor conveniente para criar histórico de guia
     */
    public static StatusHistory forGuia(UUID guiaId, String statusAnterior, String statusNovo,
                                        String motivo, String observacoes, User alteradoPor) {
        StatusHistory history = new StatusHistory();
        history.setEntityType(EntityType.GUIA);
        history.setEntityId(guiaId);
        history.setStatusAnterior(statusAnterior);
        history.setStatusNovo(statusNovo);
        history.setMotivo(motivo);
        history.setObservacoes(observacoes);
        history.setAlteradoPor(alteradoPor);
        history.setDataAlteracao(LocalDateTime.now());
        return history;
    }

    /**
     * Construtor conveniente para criar histórico de ficha
     */
    public static StatusHistory forFicha(UUID fichaId, String statusAnterior, String statusNovo,
                                         String motivo, String observacoes, User alteradoPor) {
        StatusHistory history = new StatusHistory();
        history.setEntityType(EntityType.FICHA);
        history.setEntityId(fichaId);
        history.setStatusAnterior(statusAnterior);
        history.setStatusNovo(statusNovo);
        history.setMotivo(motivo);
        history.setObservacoes(observacoes);
        history.setAlteradoPor(alteradoPor);
        history.setDataAlteracao(LocalDateTime.now());
        return history;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        StatusHistory that = (StatusHistory) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}