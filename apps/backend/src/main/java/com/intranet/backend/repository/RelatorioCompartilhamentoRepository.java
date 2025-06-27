package com.intranet.backend.repository;

import com.intranet.backend.model.RelatorioCompartilhamento;
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
public interface RelatorioCompartilhamentoRepository extends JpaRepository<RelatorioCompartilhamento, UUID> {

    @Query("SELECT rc FROM RelatorioCompartilhamento rc " +
            "LEFT JOIN FETCH rc.usuarioOrigem " +
            "LEFT JOIN FETCH rc.usuarioDestino " +
            "WHERE rc.usuarioDestino.id = :usuarioId " +
            "ORDER BY rc.dataCompartilhamento DESC")
    Page<RelatorioCompartilhamento> findRecebidosByUsuario(@Param("usuarioId") UUID usuarioId, Pageable pageable);

    @Query("SELECT rc FROM RelatorioCompartilhamento rc " +
            "LEFT JOIN FETCH rc.usuarioOrigem " +
            "LEFT JOIN FETCH rc.usuarioDestino " +
            "WHERE rc.usuarioOrigem.id = :usuarioId " +
            "ORDER BY rc.dataCompartilhamento DESC")
    Page<RelatorioCompartilhamento> findEnviadosByUsuario(@Param("usuarioId") UUID usuarioId, Pageable pageable);

    @Query("SELECT rc FROM RelatorioCompartilhamento rc " +
            "LEFT JOIN FETCH rc.usuarioOrigem " +
            "LEFT JOIN FETCH rc.usuarioDestino " +
            "WHERE rc.status = :status " +
            "ORDER BY rc.dataCompartilhamento DESC")
    Page<RelatorioCompartilhamento> findByStatus(@Param("status") RelatorioCompartilhamento.StatusCompartilhamento status, Pageable pageable);

    @Query("SELECT rc FROM RelatorioCompartilhamento rc " +
            "LEFT JOIN FETCH rc.usuarioOrigem " +
            "WHERE rc.usuarioDestino.id = :usuarioId " +
            "AND rc.status = 'PENDENTE' " +
            "ORDER BY rc.dataCompartilhamento DESC")
    List<RelatorioCompartilhamento> findPendentesByUsuario(@Param("usuarioId") UUID usuarioId);

    @Query("SELECT COUNT(rc) FROM RelatorioCompartilhamento rc " +
            "WHERE rc.usuarioDestino.id = :usuarioId " +
            "AND rc.status = 'PENDENTE'")
    long countPendentesByUsuario(@Param("usuarioId") UUID usuarioId);

    @Query("SELECT rc FROM RelatorioCompartilhamento rc " +
            "LEFT JOIN FETCH rc.usuarioOrigem " +
            "LEFT JOIN FETCH rc.usuarioDestino " +
            "WHERE (:usuarioOrigemId IS NULL OR rc.usuarioOrigem.id = :usuarioOrigemId) " +
            "AND (:usuarioDestinoId IS NULL OR rc.usuarioDestino.id = :usuarioDestinoId) " +
            "AND (:status IS NULL OR rc.status = :status) " +
            "AND (:dataInicio IS NULL OR rc.dataCompartilhamento >= :dataInicio) " +
            "AND (:dataFim IS NULL OR rc.dataCompartilhamento <= :dataFim) " +
            "ORDER BY rc.dataCompartilhamento DESC")
    Page<RelatorioCompartilhamento> findWithFilters(
            @Param("usuarioOrigemId") UUID usuarioOrigemId,
            @Param("usuarioDestinoId") UUID usuarioDestinoId,
            @Param("status") RelatorioCompartilhamento.StatusCompartilhamento status,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim,
            Pageable pageable);

    @Query("SELECT rc FROM RelatorioCompartilhamento rc " +
            "WHERE rc.dataCompartilhamento BETWEEN :dataInicio AND :dataFim " +
            "ORDER BY rc.dataCompartilhamento DESC")
    Page<RelatorioCompartilhamento> findByPeriodo(
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim,
            Pageable pageable);

    @Query("SELECT rc.status, COUNT(rc) FROM RelatorioCompartilhamento rc " +
            "WHERE rc.usuarioDestino.id = :usuarioId " +
            "GROUP BY rc.status")
    List<Object[]> getEstatisticasByUsuario(@Param("usuarioId") UUID usuarioId);

    @Query("SELECT rc FROM RelatorioCompartilhamento rc " +
            "LEFT JOIN FETCH rc.usuarioOrigem " +
            "LEFT JOIN FETCH rc.usuarioDestino " +
            "WHERE rc.usuarioOrigem.id = :usuarioId OR rc.usuarioDestino.id = :usuarioId " +
            "ORDER BY rc.dataCompartilhamento DESC")
    Page<RelatorioCompartilhamento> findAllByUsuario(@Param("usuarioId") UUID usuarioId, Pageable pageable);
}