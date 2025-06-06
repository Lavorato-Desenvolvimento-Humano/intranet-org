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
@Table(name = "fichas", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"guia_id", "especialidade"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Ficha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @Column(name = "codigo_ficha", nullable = false, unique = true, length = 6)
    private String codigoFicha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guia_id", nullable = true)
    private Guia guia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id")
    private Paciente paciente;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_ficha")
    private TipoFicha tipoFicha;

    public enum TipoFicha {
        COM_GUIA,
        ASSINATURA
    }

    @Column(name = "especialidade", nullable = false, length = 100)
    private String especialidade;

    @Column(name = "quantidade_autorizada", nullable = false)
    private Integer quantidadeAutorizada;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convenio_id", nullable = false)
    private Convenio convenio;
    
    @Column(name = "mes", nullable = false)
    private Integer mes;

    @Column(name = "ano", nullable = false)
    private Integer ano;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_responsavel", nullable = false)
    private User usuarioResponsavel;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Ficha ficha = (Ficha) o;
        return id != null && id.equals(ficha.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    public String getPacienteNome() {
        if (paciente != null) {
            return paciente.getNome();
        }
        return guia != null && guia.getPaciente() != null
                ? guia.getPaciente().getNome()
                : null;
    }

    public String getConvenioNome() {
        return convenio != null ? convenio.getName() : null;
    }
}
