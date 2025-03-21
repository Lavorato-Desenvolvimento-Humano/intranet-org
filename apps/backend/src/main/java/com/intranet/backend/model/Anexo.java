package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "anexos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Anexo {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Postagem post;

    @Column(name = "name_file", nullable = false, length = 255)
    private String nameFile;

    @Column(name = "type_file", length = 50)
    private String typeFile;

    @Column(name = "url", nullable = false, columnDefinition = "TEXT")
    private String url;
}