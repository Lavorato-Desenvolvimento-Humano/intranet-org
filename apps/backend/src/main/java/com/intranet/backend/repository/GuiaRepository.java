package com.intranet.backend.repository;

import com.intranet.backend.model.Guia;
import com.intranet.backend.model.GuiaItem;
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

    @Query("SELECT g FROM Guia g LEFT JOIN FETCH g.paciente p LEFT JOIN FETCH g.convenio c LEFT JOIN FETCH g.usuarioResponsavel u LEFT JOIN FETCH g.itens WHERE g.id = :id")
    Optional<Guia> findByIdWithRelations(@Param("id") UUID id);

    @Query("SELECT g FROM Guia g WHERE g.paciente.id = :pacienteId ORDER BY g.createdAt DESC")
    Page<Guia> findByPacienteId(@Param("pacienteId") UUID pacienteId, Pageable pageable);

    @Query("SELECT g FROM Guia g WHERE g.convenio.id = :convenioId ORDER BY g.createdAt DESC")
    Page<Guia> findByConvenioId(@Param("convenioId") UUID convenioId, Pageable pageable);

    Page<Guia> findByMesAndAno(Integer mes, Integer ano, Pageable pageable);

    @Query("SELECT g FROM Guia g WHERE g.validade < CURRENT_DATE")
    Page<Guia> findGuiasVencidas(Pageable pageable);

    @Query("SELECT g FROM Guia g WHERE g.quantidadeFaturada > (SELECT COALESCE(SUM(i.quantidadeAutorizada), 0) FROM GuiaItem i WHERE i.guia = g)")
    Page<Guia> findGuiasComQuantidadeExcedida(Pageable pageable);

    Page<Guia> findByValidadeBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<Guia> findByUsuarioResponsavelId(UUID userId, Pageable pageable);

    @Query("SELECT DISTINCT g FROM Guia g JOIN g.itens i WHERE LOWER(i.especialidade) LIKE LOWER(CONCAT('%', :especialidade, '%'))")
    Page<Guia> findByEspecialidadesContaining(@Param("especialidade") String especialidade, Pageable pageable);

    @Query("SELECT g FROM Guia g WHERE LOWER(g.numeroGuia) LIKE LOWER(CONCAT('%', :termo, '%')) OR LOWER(g.paciente.nome) LIKE LOWER(CONCAT('%', :termo, '%'))")
    Page<Guia> searchByNumeroOrPacienteNome(@Param("termo") String termo, Pageable pageable);

    boolean existsByNumeroGuiaAndMesAndAno(String numeroGuia, Integer mes, Integer ano);

    @Query("SELECT COUNT(f) FROM Ficha f WHERE f.guia.id = :guiaId")
    long countFichasByGuiaId(@Param("guiaId") UUID guiaId);

    @Query("SELECT g FROM Guia g WHERE g.status = :status ORDER BY g.createdAt DESC")
    Page<Guia> findGuiaByStatus(@Param("status") String status, Pageable pageable);

    Optional<Guia> findByNumeroGuia(String numeroGuia);

    @Query("SELECT g FROM Guia g WHERE g.numeroGuia LIKE %:termo%")
    Page<Guia> searchByNumeroGuia(@Param("termo") String termo, Pageable pageable);

    List<Guia> findByConvenioIdAndStatusIn(UUID convenioId, List<String> status);

    default List<Guia> findGuiasAtivasParaFichas(UUID pacienteId, List<String> status, List<String> especialidadesSolicitadas) {
        List<Guia> guias = findByPacienteIdAndStatusIn(pacienteId, status);

        if (especialidadesSolicitadas == null || especialidadesSolicitadas.isEmpty()) {
            return guias;
        }

        return guias.stream()
                .filter(guia -> {
                    if (guia.getItens() == null || guia.getItens().isEmpty()) return true;

                    return guia.getItens().stream()
                            .anyMatch(item -> especialidadesSolicitadas.stream()
                                    .anyMatch(solicitada -> item.getEspecialidade().toLowerCase().contains(solicitada.toLowerCase()) ||
                                            solicitada.toLowerCase().contains(item.getEspecialidade().toLowerCase())));
                })
                .collect(Collectors.toList());
    }

    @Query("SELECT g FROM Guia g LEFT JOIN FETCH g.itens WHERE g.paciente.id = :pacienteId AND g.status IN :status")
    List<Guia> findByPacienteIdAndStatusIn(@Param("pacienteId") UUID pacienteId, @Param("status") List<String> status);

    @Query("SELECT DISTINCT g FROM Guia g " +
            "LEFT JOIN g.itens i " +
            "LEFT JOIN g.paciente p " +
            "WHERE (:usuarioAlvo IS NULL OR g.usuarioResponsavel.id = :usuarioAlvo) " +
            "AND (cast(:inicio as timestamp) IS NULL OR g.updatedAt >= :inicio) " +
            "AND (cast(:fim as timestamp) IS NULL OR g.updatedAt <= :fim) " +
            "AND ((:status) IS NULL OR g.status IN (:status)) " +
            "AND ((:especialidades) IS NULL OR i.especialidade IN (:especialidades)) " +
            "AND ((:convenioIds) IS NULL OR g.convenio.id IN (:convenioIds)) " +
            "AND ((:unidades) IS NULL OR CAST(p.unidade as string) IN (:unidades))")
    List<Guia> findGuiasForRelatorio(
            @Param("usuarioAlvo") UUID usuarioAlvo,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim,
            @Param("status") List<String> status,
            @Param("especialidades") List<String> especialidades,
            @Param("convenioIds") List<UUID> convenioIds,
            @Param("unidades") List<String> unidades
    );

    @Query("SELECT DISTINCT g FROM Guia g " +
            "LEFT JOIN g.itens i " +
            "LEFT JOIN g.paciente p " +
            "WHERE (:usuarioAlvo IS NULL OR g.usuarioResponsavel.id = :usuarioAlvo) " +
            "AND ((g.ano * 12 + g.mes) >= :startPeriod) " +
            "AND ((g.ano * 12 + g.mes) <= :endPeriod) " +
            "AND ((:status) IS NULL OR g.status IN (:status)) " +
            "AND ((:especialidades) IS NULL OR i.especialidade IN (:especialidades)) " +
            "AND ((:convenioIds) IS NULL OR g.convenio.id IN (:convenioIds)) " +
            "AND ((:unidades) IS NULL OR CAST(p.unidade as string) IN (:unidades))")
    List<Guia> findGuiasForRelatorioByPeriodo(
            @Param("usuarioAlvo") UUID usuarioAlvo,
            @Param("startPeriod") Integer startPeriod,
            @Param("endPeriod") Integer endPeriod,
            @Param("status") List<String> status,
            @Param("especialidades") List<String> especialidades,
            @Param("convenioIds") List<UUID> convenioIds,
            @Param("unidades") List<String> unidades
    );
}