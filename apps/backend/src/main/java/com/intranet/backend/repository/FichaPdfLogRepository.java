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
public interface FichaPdfLogRepository extends JpaRepository<FichaPdfLog, UUID> {
    /**
     * Lista logs por job
     */
    @Query("SELECT l FROM FichaPdfLog l WHERE l.job.id = :jobId ORDER BY l.createdAt ASC")
    List<FichaPdfLog> findByJobIdOrderByCreatedAtAsc(@Param("jobId") UUID jobId);

    /**
     * Remove logs antigos para limpeza
     */
    @Query("DELETE FROM FichaPdfLog l WHERE l.createdAt < :dataLimite")
    void deleteLogsAntigos(@Param("dataLimite") LocalDateTime dataLimite);
}
