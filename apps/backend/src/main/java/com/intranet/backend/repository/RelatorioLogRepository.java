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

    /**
     * Busca logs por usuário
     */
    @Query("SELECT rl FROM RelatorioLog rl " +
            "LEFT JOIN FETCH rl.relatorio " +
            "WHERE rl.usuario.id = :usuarioId " +
            "ORDER BY rl.createdAt DESC")
    Page<RelatorioLog> findByUsuarioId(@Param("usuarioId") UUID usuarioId, Pageable pageable);

    /**
     * Busca logs por ação
     */
    @Query("SELECT rl FROM RelatorioLog rl " +
            "LEFT JOIN FETCH rl.relatorio " +
            "LEFT JOIN FETCH rl.usuario " +
            "WHERE rl.acao = :acao " +
            "ORDER BY rl.createdAt DESC")
    Page<RelatorioLog> findByAcao(@Param("acao") String acao, Pageable pageable);

    /**
     * Busca logs por período
     */
    @Query("SELECT rl FROM RelatorioLog rl " +
            "LEFT JOIN FETCH rl.relatorio " +
            "LEFT JOIN FETCH rl.usuario " +
            "WHERE rl.createdAt BETWEEN :inicio AND :fim " +
            "ORDER BY rl.createdAt DESC")
    Page<RelatorioLog> findByPeriodo(@Param("inicio") LocalDateTime inicio,
                                     @Param("fim") LocalDateTime fim,
                                     Pageable pageable);

    /**
     * Conta downloads por relatório
     */
    long countByRelatorioIdAndAcao(UUID relatorioId, String acao);

    /**
     * Estatísticas de uso por ação
     */
    @Query("SELECT rl.acao, COUNT(rl) FROM RelatorioLog rl " +
            "WHERE rl.createdAt >= :dataInicio " +
            "GROUP BY rl.acao")
    List<Object[]> getEstatisticasUso(@Param("dataInicio") LocalDateTime dataInicio);
}