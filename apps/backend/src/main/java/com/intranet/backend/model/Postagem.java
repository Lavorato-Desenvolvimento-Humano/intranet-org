package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "postagens")
@Data
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
    private String tipoDestino = "convenio"; // Valores: geral, equipe, convenio

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id")
    private Equipe equipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convenio_id")
    private Convenio convenio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Imagem> imagens = new ArrayList<>();

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Anexo> anexos = new ArrayList<>();

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TabelaPostagem> tabelas = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Métodos helper para manter a associação bidirecional
    public void addImagem(Imagem imagem) {
        imagens.add(imagem);
        imagem.setPostagem(this);
    }

    public void removeImagem(Imagem imagem) {
        imagens.remove(imagem);
        imagem.setPostagem(null);
    }

    public void addAnexo(Anexo anexo) {
        anexos.add(anexo);
        anexo.setPostagem(this);
    }

    public void removeAnexo(Anexo anexo) {
        anexos.remove(anexo);
        anexo.setPostagem(null);
    }

    public void addTabela(TabelaPostagem tabela) {
        tabelas.add(tabela);
        tabela.setPostagem(this);
    }

    public void removeTabela(TabelaPostagem tabela) {
        tabelas.remove(tabela);
        tabela.setPostagem(null);
    }
}