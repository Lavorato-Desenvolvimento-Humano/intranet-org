package com.intranet.backend.repository;

import com.intranet.backend.model.Anexo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AnexoRepository extends JpaRepository<Anexo, UUID> {

    @Query("SELECT a FROM Anexo a WHERE a.postagem IS NULL AND a.createdAt < :date")
    List<Anexo> findOrphanedAnexosCreatedBefore(LocalDateTime date);
}
