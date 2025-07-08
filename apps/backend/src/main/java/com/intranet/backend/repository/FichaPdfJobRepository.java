package com.intranet.backend.repository;

import com.intranet.backend.model.FichaPdfJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FichaPdfJobRepository extends JpaRepository<FichaPdfJob, UUID> {

    /**
     * Busca job por jobId único
     */
    Optional<FichaPdfJob> findByJobId(String jobId);

    /**
     * Lista jobs do usuário ordenados por data de criação (mais recentes primeiro)
     */
    List<FichaPdfJob> findByUsuarioIdOrderByCreatedAtDesc(UUID usuarioId);

    /**
     * Lista jobs do usuário com paginação
     */
    Page<FichaPdfJob> findByUsuarioIdOrderByCreatedAtDesc(UUID usuarioId, Pageable pageable);

    /**
     * Busca jobs por status
     */
    List<FichaPdfJob> findByStatus(FichaPdfJob.StatusJob status);

    /**
     * Busca jobs por tipo de geração
     */
    List<FichaPdfJob> findByTipo(FichaPdfJob.TipoGeracao tipo);

    /**
     * Busca jobs por status e usuário
     */
    List<FichaPdfJob> findByStatusAndUsuarioId(FichaPdfJob.StatusJob status, UUID usuarioId);

    /**
     * Busca jobs criados em um período
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.createdAt BETWEEN :inicio AND :fim ORDER BY j.createdAt DESC")
    List<FichaPdfJob> findByPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    /**
     * Busca jobs em processamento há mais de X minutos (para limpeza)
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.status = :status AND j.iniciado < :timeout")
    List<FichaPdfJob> findJobsTimeoutProcessamento(
            @Param("status") FichaPdfJob.StatusJob status,
            @Param("timeout") LocalDateTime timeout
    );

    /**
     * Conta jobs por status
     */
    @Query("SELECT COUNT(j) FROM FichaPdfJob j WHERE j.status = :status")
    long countByStatus(@Param("status") FichaPdfJob.StatusJob status);

    /**
     * Conta jobs do usuário por status
     */
    @Query("SELECT COUNT(j) FROM FichaPdfJob j WHERE j.usuario.id = :usuarioId AND j.status = :status")
    long countByUsuarioIdAndStatus(@Param("usuarioId") UUID usuarioId, @Param("status") FichaPdfJob.StatusJob status);

    /**
     * Conta total de fichas processadas por usuário
     */
    @Query("SELECT COALESCE(SUM(j.fichasProcessadas), 0) FROM FichaPdfJob j WHERE j.usuario.id = :usuarioId AND j.status = :status")
    long sumFichasProcessadasByUsuarioAndStatus(@Param("usuarioId") UUID usuarioId, @Param("status") FichaPdfJob.StatusJob status);

    /**
     * Lista jobs que podem ser baixados (concluídos com sucesso)
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.status = :status AND j.arquivoPath IS NOT NULL AND j.usuario.id = :usuarioId ORDER BY j.concluido DESC")
    List<FichaPdfJob> findJobsDownloadByUsuario(
            @Param("usuarioId") UUID usuarioId,
            @Param("status") FichaPdfJob.StatusJob status
    );

    /**
     * Busca jobs antigos para limpeza (mais de X dias)
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.createdAt < :dataLimite")
    List<FichaPdfJob> findJobsAntigos(@Param("dataLimite") LocalDateTime dataLimite);

    /**
     * Remove jobs antigos em lote
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM FichaPdfJob j WHERE j.createdAt < :dataLimite")
    int deleteJobsAntigos(@Param("dataLimite") LocalDateTime dataLimite);

    /**
     * Atualiza status de jobs em lote
     */
    @Modifying
    @Transactional
    @Query("UPDATE FichaPdfJob j SET j.status = :novoStatus WHERE j.status = :statusAtual AND j.iniciado < :timeout")
    int updateJobsTimeout(
            @Param("statusAtual") FichaPdfJob.StatusJob statusAtual,
            @Param("novoStatus") FichaPdfJob.StatusJob novoStatus,
            @Param("timeout") LocalDateTime timeout
    );

    /**
     * Busca jobs recentes por tipo
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.tipo = :tipo AND j.createdAt >= :desde ORDER BY j.createdAt DESC")
    List<FichaPdfJob> findRecentJobsByTipo(
            @Param("tipo") FichaPdfJob.TipoGeracao tipo,
            @Param("desde") LocalDateTime desde
    );

    /**
     * Estatísticas de jobs por período
     */
    @Query("SELECT j.status as status, COUNT(j) as quantidade, COALESCE(SUM(j.fichasProcessadas), 0) as totalFichas " +
            "FROM FichaPdfJob j WHERE j.createdAt BETWEEN :inicio AND :fim GROUP BY j.status")
    List<Object[]> getEstatisticasPorPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    /**
     * Lista jobs com erro para reprocessamento
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.status = :status AND j.concluido >= :desde ORDER BY j.concluido DESC")
    List<FichaPdfJob> findJobsComErro(
            @Param("status") FichaPdfJob.StatusJob status,
            @Param("desde") LocalDateTime desde
    );

    /**
     * Lista últimos jobs do usuário (para dashboard)
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.usuario.id = :usuarioId ORDER BY j.createdAt DESC")
    List<FichaPdfJob> findTop10ByUsuarioIdOrderByCreatedAtDesc(@Param("usuarioId") UUID usuarioId, Pageable pageable);

    /**
     * Lista jobs em processamento (para monitoramento)
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.status IN ('INICIADO', 'PROCESSANDO') ORDER BY j.createdAt ASC")
    List<FichaPdfJob> findJobsEmProcessamento();

    /**
     * Lista jobs concluídos nos últimos X dias
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.status = 'CONCLUIDO' AND j.concluido >= :dataLimite ORDER BY j.concluido DESC")
    List<FichaPdfJob> findJobsConcluidosRecentes(@Param("dataLimite") LocalDateTime dataLimite);
}