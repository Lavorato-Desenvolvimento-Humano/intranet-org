package com.intranet.backend.repository;

import com.intranet.backend.model.Anexo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnexoRepository extends JpaRepository<Anexo, UUID> {

    @Query("SELECT a FROM Anexo a WHERE a.postagem.id = :postagemId")
    List<Anexo> findByPostagemId(@Param("postagemId") UUID postagemId);

    void deleteByPostagemId(UUID postagemId);
}
