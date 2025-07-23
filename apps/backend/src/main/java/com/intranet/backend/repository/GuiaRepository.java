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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

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

    @Query("SELECT g FROM Guia g WHERE g.status LIKE %:status% ORDER BY g.createdAt DESC")
    Page<Guia> findGuiaByStatus(@Param("status") String status, Pageable pageable);

    @Query("SELECT COUNT(g) > 0 FROM Guia g WHERE g.numeroGuia = :numero AND g.mes = :mes AND g.ano = :ano")
    boolean existsByNumeroGuiaAndMesAndAno(@Param("numero") String numeroGuia, @Param("mes") Integer mes, @Param("ano") Integer ano);

    @Query("SELECT DISTINCT g FROM Guia g " +
            "LEFT JOIN FETCH g.paciente p " +
            "LEFT JOIN FETCH g.convenio c " +
            "LEFT JOIN FETCH g.usuarioResponsavel u " +
            "WHERE (:usuarioResponsavel IS NULL OR g.usuarioResponsavel.id = :usuarioResponsavel) " +
            "AND (g.createdAt BETWEEN :periodoInicio AND :periodoFim " +
            "     OR g.updatedAt BETWEEN :periodoInicio AND :periodoFim) " +
            "AND (:status IS NULL OR g.status IN :status) " +
            "AND (:convenioIds IS NULL OR g.convenio.id IN :convenioIds) " +
            "ORDER BY g.updatedAt DESC")
    List<Guia> findGuiasForRelatorioBase(
            @Param("usuarioResponsavel") UUID usuarioResponsavel,
            @Param("periodoInicio") LocalDateTime periodoInicio,
            @Param("periodoFim") LocalDateTime periodoFim,
            @Param("status") List<String> status,
            @Param("convenioIds") List<UUID> convenioIds
    );

    /**
     * Busca guias ativas para geração de fichas
     */
    @Query("SELECT DISTINCT g FROM Guia g " +
            "JOIN FETCH g.paciente p " +
            "JOIN FETCH g.convenio c " +
            "WHERE g.paciente.id = :pacienteId " +
            "AND g.status IN :statusPermitidos " +
            "AND (:especialidades IS NULL OR :especialidades IS EMPTY OR " +
            "     EXISTS (SELECT 1 FROM g.especialidades e WHERE e IN :especialidades)) " +
            "ORDER BY g.updatedAt DESC")
    List<Guia> findGuiasAtivasParaFichas(
            @Param("pacienteId") UUID pacienteId,
            @Param("statusPermitidos") List<String> statusPermitidos,
            @Param("especialidades") List<String> especialidades
    );

    @Query("SELECT g FROM Guia g " +
            "WHERE g.paciente.id = :pacienteId " +
            "AND g.status IN :statusPermitidos " +
            "ORDER BY g.updatedAt DESC")
    List<Guia> findGuiasAtivasParaFichasSimples(
            @Param("pacienteId") UUID pacienteId,
            @Param("statusPermitidos") List<String> statusPermitidos
    );

    @Query(value = "SELECT g.* FROM guia g " +
            "WHERE g.paciente_id = :pacienteId " +
            "AND g.status IN (:statusPermitidos) " +
            "ORDER BY g.updated_at DESC",
            nativeQuery = true)
    List<Guia> findGuiasAtivasParaFichasNative(
            @Param("pacienteId") UUID pacienteId,
            @Param("statusPermitidos") List<String> statusPermitidos
    );

    @Query("SELECT g FROM Guia g WHERE g.paciente.id = :pacienteId AND g.status IN :status")
    List<Guia> findByPacienteIdAndStatusIn(
            @Param("pacienteId") UUID pacienteId,
            @Param("status") List<String> status
    );

    /**
     * Conta guias ativas por paciente
     */
    @Query("SELECT COUNT(g) FROM Guia g WHERE g.paciente.id = :pacienteId AND g.status IN :statusAtivos")
    long countGuiasAtivasPorPaciente(
            @Param("pacienteId") UUID pacienteId,
            @Param("statusAtivos") List<String> statusAtivos
    );

    /**
     * Busca guias por convênio e status
     */
    @Query("SELECT g FROM Guia g JOIN FETCH g.paciente p WHERE g.convenio.id = :convenioId AND g.status IN :status ORDER BY p.nome ASC")
    List<Guia> findByConvenioIdAndStatusIn(@Param("convenioId") UUID convenioId, @Param("status") List<String> status);

    default List<Guia> findGuiasForRelatorio(UUID usuarioResponsavel,
                                             LocalDateTime periodoInicio,
                                             LocalDateTime periodoFim,
                                             List<String> status,
                                             List<String> especialidades,
                                             List<UUID> convenioIds,
                                             List<String> unidades) {

        List<Guia> guias = findGuiasForRelatorioBase(
                usuarioResponsavel, periodoInicio, periodoFim, status, convenioIds
        );

        // Aplicar filtros de especialidades
        if (especialidades != null && !especialidades.isEmpty()) {
            guias = guias.stream()
                    .filter(guia -> guia.getEspecialidades() != null &&
                            guia.getEspecialidades().stream()
                                    .anyMatch(especialidades::contains))
                    .collect(Collectors.toList());
        }

        // Aplicar filtros de unidades
        if (unidades != null && !unidades.isEmpty()) {
            guias = guias.stream()
                    .filter(guia -> {
                        if (guia.getPaciente() == null) return false;
                        try {
                            String unidadePaciente = guia.getPaciente().getUnidade().name();
                            return unidades.contains(unidadePaciente);
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .collect(Collectors.toList());
        }

        return guias;
    }
}
