package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.*; // Importar lombok completo
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "postagens")
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Postagem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "text", nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "tipo_destino", nullable = false)
    private String tipoDestino = "convenio";

    @Enumerated(EnumType.STRING)
    @Column(name = "categoria", length = 20)
    private PostagemCategoria categoria = PostagemCategoria.GERAL;

    @Column(name = "is_pinned", nullable = false)
    private boolean isPinned = false;

    @Column(name = "views_count", nullable = false)
    private long viewsCount = 0;

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<PostagemComentario> comentarios = new ArrayList<>();

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private Set<PostagemReacao> reacoes = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id")
    @ToString.Exclude
    private Equipe equipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convenio_id")
    @ToString.Exclude
    private Convenio convenio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @ToString.Exclude
    private User createdBy;

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<Imagem> imagens = new ArrayList<>();

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<Anexo> anexos = new ArrayList<>();

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<TabelaPostagem> tabelas = new ArrayList<>();

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
        Postagem postagem = (Postagem) o;
        return id != null && Objects.equals(id, postagem.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}