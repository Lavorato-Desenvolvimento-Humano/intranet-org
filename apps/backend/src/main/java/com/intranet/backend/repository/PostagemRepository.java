package com.intranet.backend.repository;

import com.intranet.backend.model.Postagem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostagemRepository extends JpaRepository<Postagem, UUID> {

    @Query("SELECT p FROM Postagem p WHERE p.convenio.id = :convenioId ORDER BY p.createdAt DESC")
    List<Postagem> findByConvenioId(@Param("convenioId") UUID convenioId);

    @Query("SELECT p FROM Postagem p WHERE p.convenio.id = :convenioId ORDER BY p.createdAt DESC")
    Page<Postagem> findByConvenioId(@Param("convenioId") UUID convenioId, Pageable pageable);

    @Query("SELECT p FROM Postagem p " +
            "LEFT JOIN FETCH p.imagens " +
            "LEFT JOIN FETCH p.anexos " +
            "LEFT JOIN FETCH p.tabelas " +
            "WHERE p.id = :id")
    Optional<Postagem> findByIdWithDetails(@Param("id") UUID id);

    @Query("SELECT p FROM Postagem p " +
            "JOIN FETCH p.createdBy " +
            "JOIN FETCH p.convenio " +
            "ORDER BY p.createdAt DESC")
    List<Postagem> findRecentPostagens(Pageable pageable);
}