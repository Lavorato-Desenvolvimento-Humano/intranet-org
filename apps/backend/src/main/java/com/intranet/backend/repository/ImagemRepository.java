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

    @Query("SELECT i FROM Imagem i WHERE i.postagem IS NULL AND i.createdAt < :date")
    List<Imagem> findOrphanedImagesCreatedBefore(LocalDateTime date);

    List<Imagem> findByUrlContaining(String partialUrl);
}
