package com.intranet.backend.repository;

import com.intranet.backend.model.Postagem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostagemRepository extends JpaRepository<Postagem, UUID> {

    @Query("SELECT p FROM Postagem p WHERE p.convenio.id = :convenioId ORDER BY p.createdAt DESC")
    List<Postagem> findByConvenioIdOrderByCreatedAtDesc(@Param("convenioId") UUID convenioId);

    @Query("SELECT p FROM Postagem p JOIN FETCH p.createdBy WHERE p.id = :id")
    Postagem findByIdWithCreatedBy(@Param("id") UUID id);

    @Query("SELECT p FROM Postagem p WHERE p.createdBy.id = :userId ORDER BY p.createdAt DESC")
    List<Postagem> findByCreatedByIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Query(value = "SELECT p FROM Postagem p JOIN FETCH p.convenio JOIN FETCH p.createdBy ORDER BY p.createdAt DESC",
            countQuery = "SELECT COUNT(p) FROM Postagem p")
    Page<Postagem> findAllWithConvenioAndCreatedBy(Pageable pageable);

    @Query("SELECT COUNT(p) FROM Postagem p WHERE p.convenio.id = :convenioId")
    long countByConvenioId(@Param("convenioId") UUID convenioId);
}
