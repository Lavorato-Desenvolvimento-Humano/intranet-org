package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.util.UUID;

@Entity
@Table(name = "tabelas_postagens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TabelaPostagem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Postagem post;

    @Column(name = "conteudo", columnDefinition = "jsonb", nullable = false)
    private String conteudo; // Conteúdo JSON armazenado como string
}