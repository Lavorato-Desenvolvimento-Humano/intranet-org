package com.intranet.backend.repository;

import com.intranet.backend.model.StatusHistory;
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
public interface StatusHistoryRepository extends JpaRepository<StatusHistory, UUID> {

    /**
     * Busca todo o histórico de uma entidade específica
     */
    @Query("SELECT sh FROM StatusHistory sh WHERE sh.entityType = :entityType AND sh.entityId = :entityId " +
            "ORDER BY sh.dataAlteracao DESC")
    List<StatusHistory> findByEntityTypeAndEntityIdOrderByDataAlteracaoDesc(
            @Param("entityType") StatusHistory.EntityType entityType,
            @Param("entityId") UUID entityId);

    /**
     * Busca histórico de uma entidade com paginação
     */
    @Query("SELECT sh FROM StatusHistory sh WHERE sh.entityType = :entityType AND sh.entityId = :entityId " +
            "ORDER BY sh.dataAlteracao DESC")
    Page<StatusHistory> findByEntityTypeAndEntityId(
            @Param("entityType") StatusHistory.EntityType entityType,
            @Param("entityId") UUID entityId,
            Pageable pageable);

    /**
     * Busca histórico por tipo de entidade
     */
    @Query("SELECT sh FROM StatusHistory sh WHERE sh.entityType = :entityType " +
            "ORDER BY sh.dataAlteracao DESC")
    Page<StatusHistory> findByEntityType(
            @Param("entityType") StatusHistory.EntityType entityType,
            Pageable pageable);

    /**
     * Busca histórico por usuário responsável
     */
    @Query("SELECT sh FROM StatusHistory sh WHERE sh.alteradoPor.id = :userId " +
            "ORDER BY sh.dataAlteracao DESC")
    Page<StatusHistory> findByAlteradoPorId(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Busca histórico por status específico
     */
    @Query("SELECT sh FROM StatusHistory sh WHERE sh.statusNovo = :status " +
            "ORDER BY sh.dataAlteracao DESC")
    Page<StatusHistory> findByStatusNovo(@Param("status") String status, Pageable pageable);

    /**
     * Busca histórico por período
     */
    @Query("SELECT sh FROM StatusHistory sh WHERE sh.dataAlteracao BETWEEN :startDate AND :endDate " +
            "ORDER BY sh.dataAlteracao DESC")
    Page<StatusHistory> findByDataAlteracaoBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    /**
     * Busca histórico com join das informações do usuário
     */
    @Query("SELECT sh FROM StatusHistory sh LEFT JOIN FETCH sh.alteradoPor " +
            "WHERE sh.entityType = :entityType AND sh.entityId = :entityId " +
            "ORDER BY sh.dataAlteracao DESC")
    List<StatusHistory> findByEntityTypeAndEntityIdWithUser(
            @Param("entityType") StatusHistory.EntityType entityType,
            @Param("entityId") UUID entityId);

    /**
     * Busca o último status de uma entidade
     */
    @Query("SELECT sh FROM StatusHistory sh WHERE sh.entityType = :entityType AND sh.entityId = :entityId " +
            "ORDER BY sh.dataAlteracao DESC LIMIT 1")
    StatusHistory findLatestByEntityTypeAndEntityId(
            @Param("entityType") StatusHistory.EntityType entityType,
            @Param("entityId") UUID entityId);

    /**
     * Conta quantas mudanças de status uma entidade teve
     */
    @Query("SELECT COUNT(sh) FROM StatusHistory sh WHERE sh.entityType = :entityType AND sh.entityId = :entityId")
    long countByEntityTypeAndEntityId(
            @Param("entityType") StatusHistory.EntityType entityType,
            @Param("entityId") UUID entityId);

    /**
     * Busca histórico com filtros avançados
     */
    @Query("SELECT sh FROM StatusHistory sh LEFT JOIN FETCH sh.alteradoPor " +
            "WHERE (:entityType IS NULL OR sh.entityType = :entityType) " +
            "AND (:entityId IS NULL OR sh.entityId = :entityId) " +
            "AND (:statusNovo IS NULL OR sh.statusNovo = :statusNovo) " +
            "AND (:userId IS NULL OR sh.alteradoPor.id = :userId) " +
            "AND (cast(:startDate as timestamp) IS NULL OR sh.dataAlteracao >= :startDate) " +
            "AND (cast(:endDate as timestamp) IS NULL OR sh.dataAlteracao <= :endDate) " +
            "ORDER BY sh.dataAlteracao DESC")
    Page<StatusHistory> findWithFilters(
            @Param("entityType") StatusHistory.EntityType entityType,
            @Param("entityId") UUID entityId,
            @Param("statusNovo") String statusNovo,
            @Param("userId") UUID userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    /**
     * Busca estatísticas de mudanças por status
     */
    @Query("SELECT sh.statusNovo, COUNT(sh) FROM StatusHistory sh " +
            "WHERE sh.entityType = :entityType " +
            "GROUP BY sh.statusNovo " +
            "ORDER BY COUNT(sh) DESC")
    List<Object[]> getStatusChangeStatistics(@Param("entityType") StatusHistory.EntityType entityType);
}