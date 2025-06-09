package com.intranet.backend.repository;

import com.intranet.backend.model.Guia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
public interface GuiaRepository extends JpaRepository<Guia, UUID> {

    @Query("SELECT g FROM Guia g WHERE g.paciente.id = :pacienteId ORDER BY g.createdAt DESC")
    Page<Guia> findByPacienteId(@Param("pacienteId") UUID pacienteId, Pageable pageable);

    @Query("SELECT g FROM Guia g WHERE g.convenio.id = :convenioId ORDER BY g.createdAt DESC")
    Page<Guia> findByConvenioId(@Param("convenioId") UUID convenioId, Pageable pageable);

    @Query("SELECT g FROM Guia g WHERE g.mes = :mes AND g.ano = :ano ORDER BY g.createdAt DESC")
    Page<Guia> findByMesAndAno(@Param("mes") Integer mes, @Param("ano") Integer ano, Pageable pageable);

    @Query("SELECT g FROM Guia g WHERE g.validade < CURRENT_DATE ORDER BY g.validade ASC")
    Page<Guia> findGuiasVencidas(Pageable pageable);

    @Query("SELECT g FROM Guia g WHERE g.quantidadeFaturada > g.quantidadeAutorizada")
    Page<Guia> findGuiasComQuantidadeExcedida(Pageable pageable);

    @Query("SELECT g FROM Guia g WHERE g.validade BETWEEN :startDate AND :endDate")
    Page<Guia> findByValidadeBetween(@Param("startDate") LocalDate startDate,
                                     @Param("endDate") LocalDate endDate,
                                     Pageable pageable);

    @Query("SELECT g FROM Guia g WHERE g.usuarioResponsavel.id = :userId ORDER BY g.createdAt DESC")
    Page<Guia> findByUsuarioResponsavelId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT COUNT(f) FROM Ficha f WHERE f.guia.id = :guiaId")
    long countFichasByGuiaId(@Param("guiaId") UUID guiaId);

    @Query("SELECT g FROM Guia g LEFT JOIN FETCH g.paciente LEFT JOIN FETCH g.convenio " +
            "LEFT JOIN FETCH g.usuarioResponsavel WHERE g.id = :id")
    Optional<Guia> findByIdWithRelations(@Param("id") UUID id);

    @Query(value = "SELECT * FROM guias g WHERE :especialidade = ANY(g.especialidades) ORDER BY g.created_at DESC",
            countQuery = "SELECT COUNT(*) FROM guias g WHERE :especialidade = ANY(g.especialidades)",
            nativeQuery = true)
    Page<Guia> findByEspecialidadesContaining(@Param("especialidade") String especialidade, Pageable pageable);

    Optional<Guia> findByNumeroGuia(String numeroGuia);

    boolean existsByNumeroGuia(String numeroGuia);

    @Query("SELECT g FROM Guia g WHERE g.numeroGuia LIKE %:termo%")
    Page<Guia> searchByNumeroGuia(@Param("termo") String termo, Pageable pageable);

    @Query("SELECT g FROM Guia g WHERE g.status = :status ORDER BY g.createdAt DESC")
    Page<Guia> findGuiaByStatus(String status, Pageable pageable);
}
