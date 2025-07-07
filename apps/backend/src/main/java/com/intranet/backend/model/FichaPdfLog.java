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
@Table(name = "ficha_pdf_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class FichaPdfLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private FichaPdfJob job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @Column(name = "especialidade", length = 255)
    private String especialidade;

    @Column(name = "numero_identificacao", length = 50)
    private String numeroIdentificacao;

    @Column(name = "mes")
    private Integer mes;

    @Column(name = "ano")
    private Integer ano;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guia_origem_id")
    private Guia guiaOrigem; // Guia que originou esta ficha

    @Column(name = "quantidade_autorizada")
    private Integer quantidadeAutorizada;

    @Column(name = "processado_com_sucesso")
    private Boolean processadoComSucesso = true;

    @Column(name = "erro", columnDefinition = "TEXT")
    private String erro;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
