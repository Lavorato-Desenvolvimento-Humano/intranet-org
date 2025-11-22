package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "guias")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Guia {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @Column(name = "numero_guia", nullable = false, unique = false, length = 50)
    private String numeroGuia;

    @Column(name = "numero_venda", unique = true)
    private String numeroVenda;

    @Column(name = "status", nullable = false, length = 100)
    private String status;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "especialidades", columnDefinition = "text[]")
    private List<String> especialidades = new ArrayList<>();

    @Column(name = "quantidade_autorizada", nullable = false)
    private Integer quantidadeAutorizada;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convenio_id", nullable = false)
    private Convenio convenio;

    @Column(name = "mes", nullable = false)
    private Integer mes;

    @Column(name = "ano", nullable = false)
    private Integer ano;

    @Column(name = "validade", nullable = false)
    private LocalDate validade;

    @Column(name = "lote", length = 100)
    private String lote;

    @Column(name = "quantidade_faturada", nullable = false)
    private Integer quantidadeFaturada = 0;

    @Column(name = "valor_reais", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorReais = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_responsavel", nullable = false)
    private User usuarioResponsavel;

    @OneToMany(mappedBy = "guia", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Ficha> fichas  = new ArrayList<>();

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
      Guia guia = (Guia) o;
      return id != null && id.equals(guia.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    public boolean isVencida() {
        return validade != null && validade.isBefore(LocalDate.now());
    }

    public boolean isQuantidadeExcedida() {
        return quantidadeFaturada > quantidadeAutorizada;
    }

    public Integer getQuantidadeRestante() {
        return quantidadeAutorizada - quantidadeFaturada;
    }
}
