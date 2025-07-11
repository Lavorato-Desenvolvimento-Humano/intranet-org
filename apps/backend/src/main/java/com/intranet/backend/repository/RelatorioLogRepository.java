package com.intranet.backend.repository;

import com.intranet.backend.model.RelatorioLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface RelatorioLogRepository extends JpaRepository<RelatorioLog, UUID> {

    /**
     * Busca logs por relatório
     */
    @Query("SELECT rl FROM RelatorioLog rl " +
            "LEFT JOIN FETCH rl.usuario " +
            "WHERE rl.relatorio.id = :relatorioId " +
            "ORDER BY rl.createdAt DESC")
    List<RelatorioLog> findByRelatorioId(@Param("relatorioId") UUID relatorioId);

}