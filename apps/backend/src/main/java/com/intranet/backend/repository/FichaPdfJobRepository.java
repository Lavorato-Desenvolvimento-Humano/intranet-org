package com.intranet.backend.repository;

import com.intranet.backend.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FichaPdfJobRepository extends JpaRepository<FichaPdfJob, UUID> {
    /**
     * Busca job pelo jobId único
     */
    Optional<FichaPdfJob> findByJobId(String jobId);

    /**
     * Lista jobs do usuário ordenados por data de criação
     */
    List<FichaPdfJob> findByUsuarioIdOrderByCreatedAtDesc(UUID usuarioId);

    /**
     * Lista jobs por status
     */
    List<FichaPdfJob> findByStatus(FichaPdfJob.StatusJob status);

    /**
     * Lista jobs em processamento (para monitoramento)
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.status IN ('INICIADO', 'PROCESSANDO') ORDER BY j.createdAt ASC")
    List<FichaPdfJob> findJobsEmProcessamento();

    /**
     * Conta jobs por usuário e status
     */
    long countByUsuarioIdAndStatus(UUID usuarioId, FichaPdfJob.StatusJob status);

    /**
     * Lista jobs concluídos nos últimos X dias
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.status = 'CONCLUIDO' AND j.concluido >= :dataLimite ORDER BY j.concluido DESC")
    List<FichaPdfJob> findJobsConcluidosRecentes(@Param("dataLimite") LocalDateTime dataLimite);

    /**
     * Remove jobs antigos com erro (limpeza)
     */
    @Query("DELETE FROM FichaPdfJob j WHERE j.status = 'ERRO' AND j.createdAt < :dataLimite")
    void deleteJobsErroAntigos(@Param("dataLimite") LocalDateTime dataLimite);

    /**
     * Lista jobs por tipo e período
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.tipo = :tipo AND j.createdAt BETWEEN :inicio AND :fim ORDER BY j.createdAt DESC")
    List<FichaPdfJob> findByTipoAndPeriodo(
            @Param("tipo") FichaPdfJob.TipoGeracao tipo,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim
    );
}
