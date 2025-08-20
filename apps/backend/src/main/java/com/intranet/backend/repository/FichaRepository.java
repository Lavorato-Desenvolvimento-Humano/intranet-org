package com.intranet.backend.repository;

import com.intranet.backend.model.Ficha;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    Logger logger = LoggerFactory.getLogger(FichaRepository.class);

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
            "OR f.updatedAt BETWEEN :periodoInicio AND :periodoFim) " +
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

    /**
     * Conta fichas por guia e data de atualização
     */
    long countByGuiaIdAndUpdatedAtAfter(UUID guiaId, LocalDateTime dataLimite);

    /**
     * Conta fichas por paciente, especialidade e data
     */
    @Query("SELECT COUNT(f) FROM Ficha f WHERE f.guia.paciente.id = :pacienteId " +
            "AND f.especialidade = :especialidade AND f.createdAt > :dataLimite")
    long countByPacienteIdAndEspecialidadeAndCreatedAtAfter(
            @Param("pacienteId") UUID pacienteId,
            @Param("especialidade") String especialidade,
            @Param("dataLimite") LocalDateTime dataLimite
    );

    /**
     * Lista fichas recentes por especialidade
     */
    @Query("SELECT f FROM Ficha f WHERE f.especialidade = :especialidade " +
            "AND f.createdAt > :dataLimite ORDER BY f.createdAt DESC")
    List<Ficha> findFichasRecentesPorEspecialidade(
            @Param("especialidade") String especialidade,
            @Param("dataLimite") LocalDateTime dataLimite
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
                        if (ficha.getGuia() == null) return false;
                        if (ficha.getGuia().getPaciente() == null) return false;
                        try {
                            String unidadePaciente = ficha.getGuia().getPaciente().getUnidade().name();
                            return unidades.contains(unidadePaciente);
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

    /**
     * Verifica se já existe ficha para paciente/especialidade/mês/ano
     */
    @Query("SELECT COUNT(f) > 0 FROM Ficha f WHERE " +
            "(f.paciente.id = :pacienteId OR f.guia.paciente.id = :pacienteId) " +
            "AND f.especialidade = :especialidade " +
            "AND f.mes = :mes AND f.ano = :ano")
    boolean existsFichaByPacienteEspecialidadeMesAno(
            @Param("pacienteId") UUID pacienteId,
            @Param("especialidade") String especialidade,
            @Param("mes") Integer mes,
            @Param("ano") Integer ano
    );

    /**
     * Busca ficha existente para reutilizar código
     */
    @Query("SELECT f FROM Ficha f WHERE " +
            "(f.paciente.id = :pacienteId OR f.guia.paciente.id = :pacienteId) " +
            "AND f.especialidade = :especialidade " +
            "AND f.mes = :mes AND f.ano = :ano " +
            "ORDER BY f.createdAt DESC")
    Optional<Ficha> findFichaExistente(
            @Param("pacienteId") UUID pacienteId,
            @Param("especialidade") String especialidade,
            @Param("mes") Integer mes,
            @Param("ano") Integer ano
    );

    /**
     * Lista pacientes que já possuem fichas no mês/ano
     */
    @Query("SELECT DISTINCT CASE " +
            "WHEN f.paciente IS NOT NULL THEN f.paciente.id " +
            "ELSE f.guia.paciente.id END " +
            "FROM Ficha f WHERE f.mes = :mes AND f.ano = :ano " +
            "AND f.convenio.id = :convenioId")
    List<UUID> findPacientesComFichasNoMes(
            @Param("convenioId") UUID convenioId,
            @Param("mes") Integer mes,
            @Param("ano") Integer ano
    );

    /**
     * Lista fichas existentes por convênio/mês/ano
     */
    @Query("SELECT f FROM Ficha f " +
            "LEFT JOIN f.paciente p " +
            "LEFT JOIN f.guia g " +
            "LEFT JOIN g.paciente gp " +
            "WHERE f.convenio.id = :convenioId " +
            "AND f.mes = :mes AND f.ano = :ano " +
            "ORDER BY COALESCE(p.nome, gp.nome), f.especialidade")
    List<Ficha> findFichasExistentesPorConvenioMesAno(
            @Param("convenioId") UUID convenioId,
            @Param("mes") Integer mes,
            @Param("ano") Integer ano
    );

    /**
     * Busca fichas existentes de um paciente específico no mês/ano
     */
    @Query("SELECT f FROM Ficha f WHERE " +
            "(f.paciente.id = :pacienteId OR f.guia.paciente.id = :pacienteId) " +
            "AND f.mes = :mes AND f.ano = :ano " +
            "ORDER BY f.especialidade")
    List<Ficha> findFichasExistentesPorPacienteMesAno(
            @Param("pacienteId") UUID pacienteId,
            @Param("mes") Integer mes,
            @Param("ano") Integer ano
    );

    /**
     * Conta total de fichas por convênio/mês/ano
     */
    @Query("SELECT COUNT(f) FROM Ficha f WHERE f.convenio.id = :convenioId " +
            "AND f.mes = :mes AND f.ano = :ano")
    long countFichasByConvenioMesAno(
            @Param("convenioId") UUID convenioId,
            @Param("mes") Integer mes,
            @Param("ano") Integer ano
    );

    /**
     * Lista especialidades com fichas existentes no convênio/mês/ano
     */
    @Query("SELECT DISTINCT f.especialidade FROM Ficha f WHERE f.convenio.id = :convenioId " +
            "AND f.mes = :mes AND f.ano = :ano ORDER BY f.especialidade")
    List<String> findEspecialidadesComFichas(
            @Param("convenioId") UUID convenioId,
            @Param("mes") Integer mes,
            @Param("ano") Integer ano
    );

    /**
     * Busca fichas que podem ser reutilizadas (mesmo código)
     */
    @Query("SELECT f FROM Ficha f WHERE f.codigoFicha = :codigoFicha")
    Optional<Ficha> findByCodigoFichaForReuse(@Param("codigoFicha") String codigoFicha);

    /**
     * Verifica se há conflito de especialidade na mesma guia
     */
    @Query("SELECT COUNT(f) > 0 FROM Ficha f WHERE f.guia.id = :guiaId " +
            "AND f.especialidade = :especialidade AND f.id != :fichaId")
    boolean existsConflitEspecialidadeGuia(
            @Param("guiaId") UUID guiaId,
            @Param("especialidade") String especialidade,
            @Param("fichaId") UUID fichaId
    );
}