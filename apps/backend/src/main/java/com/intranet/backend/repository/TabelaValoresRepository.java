package com.intranet.backend.repository;

import com.intranet.backend.model.TabelaValores;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TabelaValoresRepository extends JpaRepository<TabelaValores, UUID> {

    @Query("SELECT t FROM TabelaValores t WHERE t.convenio.id = :convenioId ORDER BY t.nome ASC")
    List<TabelaValores> findByConvenioIdOrderByNomeAsc(@Param("convenioId") UUID convenioId);

    @Query("SELECT t FROM TabelaValores t JOIN FETCH t.convenio JOIN FETCH t.createdBy WHERE t.id = :id")
    TabelaValores findByIdWithConvenioAndCreatedBy(@Param("id") UUID id);

    @Query(value = "SELECT t FROM TabelaValores t JOIN FETCH t.convenio JOIN FETCH t.createdBy",
            countQuery = "SELECT COUNT(t) FROM TabelaValores t")
    Page<TabelaValores> findAllWithConvenioAndCreatedBy(Pageable pageable);

    @Query("SELECT COUNT(t) FROM TabelaValores t WHERE t.convenio.id = :convenioId")
    long countByConvenioId(@Param("convenioId") UUID convenioId);

    @Query("SELECT t FROM TabelaValores t WHERE t.createdBy.id = :userId ORDER BY t.createdAt DESC")
    List<TabelaValores> findByCreatedByIdOrderByCreatedAtDesc(@Param("userId") UUID userId);
}
