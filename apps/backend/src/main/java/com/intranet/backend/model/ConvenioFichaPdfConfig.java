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
@Table(name = "convenio_ficha_pdf_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class ConvenioFichaPdfConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convenio_id", nullable = false, unique = true)
    private Convenio convenio;

    @Column(name = "habilitado", nullable = false)
    private Boolean habilitado = false;

    @Column(name = "template_personalizado")
    private String templatePersonalizado; // Nome do template específico (futuro)

    @Column(name = "dias_atividade")
    private Integer diasAtividade = 30; // Padrão 30 dias para considerar atividade

    @Column(name = "prefixo_identificacao")
    private String prefixoIdentificacao = ""; // Prefixo do número de identificação

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
