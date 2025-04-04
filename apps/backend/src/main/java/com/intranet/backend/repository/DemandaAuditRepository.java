package com.intranet.backend.repository;

import com.intranet.backend.model.DemandaAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DemandaAuditRepository extends JpaRepository<DemandaAudit, UUID> {

    /**
     * Busca todas as entradas de auditoria para uma demanda específica, ordenadas por data
     */
    @Query("SELECT a FROM DemandaAudit a WHERE a.demandaId = :demandaId ORDER BY a.dataAlteracao DESC")
    List<DemandaAudit> findByDemandaIdOrderByDataAlteracaoDesc(@Param("demandaId") UUID demandaId);

    /**
     * Busca todas as entradas de auditoria para uma demanda específica, paginadas
     */
    @Query("SELECT a FROM DemandaAudit a WHERE a.demandaId = :demandaId ORDER BY a.dataAlteracao DESC")
    Page<DemandaAudit> findByDemandaIdOrderByDataAlteracaoDesc(@Param("demandaId") UUID demandaId, Pageable pageable);

    /**
     * Busca todas as entradas de auditoria para um usuário específico
     */
    @Query("SELECT a FROM DemandaAudit a WHERE a.alteradoPor.id = :usuarioId ORDER BY a.dataAlteracao DESC")
    List<DemandaAudit> findByAlteradoPorIdOrderByDataAlteracaoDesc(@Param("usuarioId") UUID usuarioId);

    /**
     * Busca todas as entradas de auditoria de um tipo específico para uma demanda
     */
    @Query("SELECT a FROM DemandaAudit a WHERE a.demandaId = :demandaId AND a.operacao = :operacao ORDER BY a.dataAlteracao DESC")
    List<DemandaAudit> findByDemandaIdAndOperacaoOrderByDataAlteracaoDesc(
            @Param("demandaId") UUID demandaId,
            @Param("operacao") String operacao);

    /**
     * Conta o número de alterações de status de uma demanda
     */
    @Query("SELECT COUNT(a) FROM DemandaAudit a WHERE a.demandaId = :demandaId AND a.operacao = 'mudanca_status'")
    long countStatusChangesByDemandaId(@Param("demandaId") UUID demandaId);

    /**
     * Conta o número de vezes que uma demanda foi reatribuída
     */
    @Query("SELECT COUNT(a) FROM DemandaAudit a WHERE a.demandaId = :demandaId AND a.operacao = 'atribuicao'")
    long countReassignmentsByDemandaId(@Param("demandaId") UUID demandaId);
}