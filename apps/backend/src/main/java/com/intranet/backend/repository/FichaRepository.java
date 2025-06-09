package com.intranet.backend.repository;

import com.intranet.backend.model.Ficha;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
}