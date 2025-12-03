package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Entity
@Table(name = "guia_itens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuiaItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guia_id", nullable = false)
    private Guia guia;

    @Column(name = "especialidade", nullable = false)
    private String especialidade;

    @Column(name = "quantidade_autorizada", nullable = false)
    private Integer quantidadeAutorizada;

    // Opcional: Contador de quanto já foi executado desta especialidade específica
    @Column(name = "quantidade_executada")
    private Integer quantidadeExecutada = 0;
}