package com.intranet.backend.repository;

import com.intranet.backend.model.Relatorio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RelatorioRepository extends JpaRepository<Relatorio, UUID> {

    /**
     * Busca relatórios por usuário gerador
     */
    @Query("SELECT r FROM Relatorio r LEFT JOIN FETCH r.usuarioGerador " +
            "WHERE r.usuarioGerador.id = :usuarioId " +
            "ORDER BY r.createdAt DESC")
    Page<Relatorio> findByUsuarioGeradorId(@Param("usuarioId") UUID usuarioId, Pageable pageable);

    /**
     * Busca relatório por hash de compartilhamento
     */
    @Query("SELECT r FROM Relatorio r LEFT JOIN FETCH r.usuarioGerador " +
            "WHERE r.hashCompartilhamento = :hash")
    Optional<Relatorio> findByHashCompartilhamento(@Param("hash") String hash);

    /**
     * Busca relatórios por período
     */
    @Query("SELECT r FROM Relatorio r LEFT JOIN FETCH r.usuarioGerador " +
            "WHERE r.periodoInicio >= :inicio AND r.periodoFim <= :fim " +
            "ORDER BY r.createdAt DESC")
    Page<Relatorio> findByPeriodo(@Param("inicio") LocalDateTime inicio,
                                  @Param("fim") LocalDateTime fim,
                                  Pageable pageable);

    /**
     * Busca relatórios por status
     */
    @Query("SELECT r FROM Relatorio r LEFT JOIN FETCH r.usuarioGerador " +
            "WHERE r.statusRelatorio = :status " +
            "ORDER BY r.createdAt DESC")
    Page<Relatorio> findByStatusRelatorio(@Param("status") Relatorio.StatusRelatorio status, Pageable pageable);

    /**
     * Busca relatórios com filtros
     */
    @Query("SELECT r FROM Relatorio r LEFT JOIN FETCH r.usuarioGerador " +
            "WHERE (:usuarioId IS NULL OR r.usuarioGerador.id = :usuarioId) " +
            "AND (:status IS NULL OR r.statusRelatorio = :status) " +
            "AND (:startDate IS NULL OR r.createdAt >= :startDate) " +
            "AND (:endDate IS NULL OR r.createdAt <= :endDate) " +
            "AND (:search IS NULL OR LOWER(r.titulo) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY r.createdAt DESC")
    Page<Relatorio> findWithFilters(@Param("usuarioId") UUID usuarioId,
                                    @Param("status") Relatorio.StatusRelatorio status,
                                    @Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate,
                                    @Param("search") String search,
                                    Pageable pageable);

    /**
     * Conta relatórios por usuário
     */
    long countByUsuarioGeradorId(UUID usuarioId);

    /**
     * Conta relatórios por status
     */
    long countByStatusRelatorio(Relatorio.StatusRelatorio status);

    /**
     * Busca relatórios recentes (últimos 30 dias)
     */
    @Query("SELECT r FROM Relatorio r LEFT JOIN FETCH r.usuarioGerador " +
            "WHERE r.createdAt >= :dataLimite " +
            "ORDER BY r.createdAt DESC")
    Page<Relatorio> findRecentes(@Param("dataLimite") LocalDateTime dataLimite, Pageable pageable);
}
