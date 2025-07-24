package com.intranet.backend.repository;

import com.intranet.backend.model.FichaPdfJob;
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
     * Busca job por jobId único
     */
    Optional<FichaPdfJob> findByJobId(String jobId);

    /**
     * Lista jobs do usuário ordenados por data de criação (mais recentes primeiro)
     */
    List<FichaPdfJob> findByUsuarioIdOrderByCreatedAtDesc(UUID usuarioId);

    /**
     * Lista jobs concluídos nos últimos X dias
     */
    @Query("SELECT j FROM FichaPdfJob j WHERE j.status = 'CONCLUIDO' AND j.concluido >= :dataLimite ORDER BY j.concluido DESC")
    List<FichaPdfJob> findJobsConcluidosRecentes(@Param("dataLimite") LocalDateTime dataLimite);

}