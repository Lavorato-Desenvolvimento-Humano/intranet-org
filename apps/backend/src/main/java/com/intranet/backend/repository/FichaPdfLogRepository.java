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
    List<FichaPdfLog> findByJobIdOrderByCreatedAtAsc(UUID jobId);

    /**
     * Lista logs por paciente
     */
    List<FichaPdfLog> findByPacienteIdOrderByCreatedAtDesc(UUID pacienteId);

    /**
     * Verifica se já existe ficha gerada para paciente/especialidade/mês
     */
    boolean existsByPacienteIdAndEspecialidadeAndMesAndAno(
            UUID pacienteId,
            String especialidade,
            Integer mes,
            Integer ano
    );

    /**
     * Lista logs por especialidade e período
     */
    @Query("SELECT l FROM FichaPdfLog l WHERE l.especialidade = :especialidade AND l.mes = :mes AND l.ano = :ano ORDER BY l.createdAt DESC")
    List<FichaPdfLog> findByEspecialidadeAndMesAndAno(
            @Param("especialidade") String especialidade,
            @Param("mes") Integer mes,
            @Param("ano") Integer ano
    );

    /**
     * Conta fichas geradas por convênio no mês
     */
    @Query("SELECT COUNT(l) FROM FichaPdfLog l JOIN l.paciente p WHERE p.convenio.id = :convenioId AND l.mes = :mes AND l.ano = :ano")
    long countByConvenioAndMesAndAno(
            @Param("convenioId") UUID convenioId,
            @Param("mes") Integer mes,
            @Param("ano") Integer ano
    );

    /**
     * Lista últimas fichas geradas por paciente
     */
    @Query("SELECT l FROM FichaPdfLog l WHERE l.paciente.id = :pacienteId ORDER BY l.createdAt DESC")
    List<FichaPdfLog> findUltimasFichasPaciente(@Param("pacienteId") UUID pacienteId);

    /**
     * Remove logs antigos para limpeza
     */
    @Query("DELETE FROM FichaPdfLog l WHERE l.createdAt < :dataLimite")
    void deleteLogsAntigos(@Param("dataLimite") LocalDateTime dataLimite);

    /**
     * Lista fichas com erro
     */
    List<FichaPdfLog> findByProcessadoComSucessoFalse();

    /**
     * Estatísticas de fichas por período
     */
    @Query("SELECT l.especialidade, COUNT(l) FROM FichaPdfLog l WHERE l.mes = :mes AND l.ano = :ano GROUP BY l.especialidade ORDER BY COUNT(l) DESC")
    List<Object[]> getEstatisticasPorEspecialidade(@Param("mes") Integer mes, @Param("ano") Integer ano);
}
