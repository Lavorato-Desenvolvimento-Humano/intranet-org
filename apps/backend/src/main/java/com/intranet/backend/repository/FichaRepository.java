package com.intranet.backend.repository;

import com.intranet.backend.model.Ficha;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public interface FichaRepository extends JpaRepository<Ficha, UUID> {

    @Query("SELECT f FROM Ficha f WHERE f.guia.id = :guiaId ORDER BY f.especialidade ASC")
    List<Ficha> findByGuiaId(@Param("guiaId") UUID guiaId);

    @Query("SELECT f FROM Ficha f WHERE f.guia.paciente.id = :pacienteId ORDER BY f.createdAt DESC")
    Page<Ficha> findByPacienteId(@Param("pacienteId") UUID pacienteId, Pageable pageable);

    @Query("SELECT f FROM Ficha f WHERE f.convenio.id = :convenioId ORDER BY f.createdAt DESC")
    Page<Ficha> findByConvenioId(@Param("convenioId") UUID convenioId, Pageable pageable);

    @Query("SELECT f FROM Ficha f WHERE f.especialidade ILIKE %:especialidade%")
    Page<Ficha> findByEspecialidadeContainingIgnoreCase(@Param("especialidade") String especialidade, Pageable pageable);

    @Query("SELECT f FROM Ficha f WHERE f.mes = :mes AND f.ano = :ano ORDER BY f.createdAt DESC")
    Page<Ficha> findByMesAndAno(@Param("mes") Integer mes, @Param("ano") Integer ano, Pageable pageable);

    @Query("SELECT f FROM Ficha f WHERE f.usuarioResponsavel.id = :userId ORDER BY f.createdAt DESC")
    Page<Ficha> findByUsuarioResponsavelId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT f FROM Ficha f LEFT JOIN FETCH f.guia g LEFT JOIN FETCH g.paciente " +
            "LEFT JOIN FETCH f.convenio LEFT JOIN FETCH f.usuarioResponsavel WHERE f.id = :id")
    Optional<Ficha> findByIdWithRelations(@Param("id") UUID id);

    boolean existsByGuiaIdAndEspecialidade(@Param("guiaId") UUID guiaId, @Param("especialidade") String especialidade);

    @Query("SELECT f FROM Ficha f LEFT JOIN FETCH f.guia g LEFT JOIN FETCH g.paciente " +
            "LEFT JOIN FETCH f.convenio LEFT JOIN FETCH f.usuarioResponsavel")
    Page<Ficha> findAllWithRelations(Pageable pageable);

    Optional<Ficha> findByCodigoFicha(String codigoFicha);

    boolean existsByCodigoFicha(String codigoFicha);

    @Query("SELECT f FROM Ficha f WHERE f.codigoFicha LIKE %:termo%")
    Page<Ficha> searchByCodigoFicha(@Param("termo") String termo, Pageable pageable);

    @Query("SELECT f FROM Ficha f WHERE f.status LIKE %:status% ORDER BY f.createdAt DESC")
    Page<Ficha> findByStatus(String status, Pageable pageable);

    @Query("SELECT f.status, COUNT(f) FROM Ficha f GROUP BY f.status")
    List<Object[]> countFichasByStatus();

    @Query("SELECT DISTINCT f FROM Ficha f " +
            "LEFT JOIN FETCH f.paciente p " +
            "LEFT JOIN FETCH f.guia g " +
            "LEFT JOIN FETCH g.paciente gp " +
            "LEFT JOIN FETCH f.convenio c " +
            "LEFT JOIN FETCH f.usuarioResponsavel u " +
            "WHERE (:usuarioResponsavel IS NULL OR f.usuarioResponsavel.id = :usuarioResponsavel) " +
            "AND (f.createdAt BETWEEN :periodoInicio AND :periodoFim " +
            "     OR f.updatedAt BETWEEN :periodoInicio AND :periodoFim) " +
            "AND (:status IS NULL OR f.status IN :status) " +
            "AND (:especialidades IS NULL OR f.especialidade IN :especialidades) " +
            "AND (:convenioIds IS NULL OR f.convenio.id IN :convenioIds) " +
            "ORDER BY f.updatedAt DESC")
    List<Ficha> findFichasForRelatorioBase(
            @Param("usuarioResponsavel") UUID usuarioResponsavel,
            @Param("periodoInicio") LocalDateTime periodoInicio,
            @Param("periodoFim") LocalDateTime periodoFim,
            @Param("status") List<String> status,
            @Param("especialidades") List<String> especialidades,
            @Param("convenioIds") List<UUID> convenioIds
    );

    default List<Ficha> findFichasForRelatorio(UUID usuarioResponsavel,
                                               LocalDateTime periodoInicio,
                                               LocalDateTime periodoFim,
                                               List<String> status,
                                               List<String> especialidades,
                                               List<UUID> convenioIds,
                                               List<String> unidades) {

        List<Ficha> fichas = findFichasForRelatorioBase(
                usuarioResponsavel, periodoInicio, periodoFim, status, especialidades, convenioIds
        );

        // Aplicar filtros de unidades
        if (unidades != null && !unidades.isEmpty()) {
            fichas = fichas.stream()
                    .filter(ficha -> {
                        try {
                            String unidadePaciente = null;

                            // Verificar se tem paciente direto
                            if (ficha.getPaciente() != null) {
                                unidadePaciente = ficha.getPaciente().getUnidade().name();
                            }
                            // Senão, verificar via guia
                            else if (ficha.getGuia() != null && ficha.getGuia().getPaciente() != null) {
                                unidadePaciente = ficha.getGuia().getPaciente().getUnidade().name();
                            }

                            return unidadePaciente != null && unidades.contains(unidadePaciente);

                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .collect(Collectors.toList());
        }

        return fichas;
    }

    @Query("SELECT f FROM Ficha f " +
            "WHERE (f.createdAt BETWEEN :inicio AND :fim " +
            "       OR f.updatedAt BETWEEN :inicio AND :fim)")
    List<Ficha> findByPeriodoCreateOrUpdate(
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim
    );

    @Query("SELECT f.status, COUNT(f) FROM Ficha f " +
            "WHERE (f.createdAt BETWEEN :inicio AND :fim " +
            "       OR f.updatedAt BETWEEN :inicio AND :fim) " +
            "GROUP BY f.status")
    List<Object[]> countFichasByStatusInPeriod(
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim
    );
}