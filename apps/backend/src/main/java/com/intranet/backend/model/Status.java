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
@Table(name = "status_guias", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"status"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Status {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "status", nullable = false, length = 50, unique = true)
    private String status;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "ordem_exibicao")
    private Integer ordemExibicao;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Construtor para criar status a partir do enum
     */
    public Status(StatusEnum statusEnum) {
        this.status = statusEnum.getValor();
        this.descricao = statusEnum.getDescricao();
        this.ordemExibicao = statusEnum.getOrdem();
        this.ativo = true;
    }

    /**
     * Validação antes de persistir
     */
    @PrePersist
    @PreUpdate
    private void validateStatus() {
        if (!StatusEnum.isValid(this.status)) {
            throw new IllegalArgumentException("Status inválido: " + this.status);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Status status1 = (Status) o;
        return id != null && id.equals(status1.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}