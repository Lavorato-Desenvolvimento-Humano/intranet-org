package com.intranet.backend.repository;

import com.intranet.backend.model.Imagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ImagemRepository extends JpaRepository<Imagem, UUID> {

    @Query("SELECT i FROM Imagem i WHERE i.postagem.id = :postagemId")
    List<Imagem> findByPostagemId(@Param("postagemId") UUID postagemId);

    void deleteByPostagemId(UUID postagemId);

    // Adicione este método à interface
    @Query("SELECT i FROM Imagem i WHERE i.postagem IS NULL")
    List<Imagem> findOrphanedImages();

    // Se a entidade tiver um campo createdAt, adicione também:
    @Query("SELECT i FROM Imagem i WHERE i.postagem IS NULL AND i.createdAt < :date")
    List<Imagem> findOrphanedImagesCreatedBefore(LocalDateTime date);
}
