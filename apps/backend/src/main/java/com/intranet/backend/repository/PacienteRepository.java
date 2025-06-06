package com.intranet.backend.repository;

import com.intranet.backend.model.Paciente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, UUID> {

    @Query("SELECT p FROM Paciente p WHERE p.nome ILIKE %:nome%")
    Page<Paciente> findByNomeContainingIgnoreCase(@Param("nome") String nome, Pageable pageable);

    @Query("SELECT p FROM Paciente p WHERE p.convenio.id = :convenioId")
    Page<Paciente> findByConvenioId(@Param("convenioId") UUID convenioId, Pageable pageable);

    @Query("SELECT p FROM Paciente p WHERE p.unidade = :unidade")
    Page<Paciente> findByUnidade(@Param("unidade") Paciente.UnidadeEnum unidade, Pageable pageable);

    @Query("SELECT p FROM Paciente p WHERE p.dataNascimento BETWEEN :startDate AND :endDate")
    Page<Paciente> findByDataNascimentoBetween(@Param("startDate") LocalDate startDate,
                                               @Param("endDate") LocalDate endDate,
                                               Pageable pageable);

    @Query("SELECT COUNT(g) FROM Guia g WHERE g.paciente.id = :pacienteId")
    long countGuiasByPacienteId(@Param("pacienteId") UUID pacienteId);

    @Query("SELECT CASE WHEN COUNT(g) > 0 THEN true ELSE false END FROM Guia g " +
            "WHERE g.paciente.id = :pacienteId AND g.validade < CURRENT_DATE")
    boolean hasGuiasVencidas(@Param("pacienteId") UUID pacienteId);

    @Query("SELECT p FROM Paciente p LEFT JOIN FETCH p.convenio WHERE p.id = :id")
    Optional<Paciente> findByIdWithConvenio(@Param("id") UUID id);

    @Query("SELECT p FROM Paciente p LEFT JOIN FETCH p.convenio LEFT JOIN FETCH p.createdBy")
    Page<Paciente> findAllWithRelations(Pageable pageable);
}