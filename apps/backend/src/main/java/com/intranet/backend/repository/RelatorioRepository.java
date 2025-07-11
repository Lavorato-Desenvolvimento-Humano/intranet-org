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
     * Conta relatórios por usuário
     */
    @Query("SELECT COUNT(r) FROM Relatorio r WHERE r.usuarioGerador.id = :usuarioId")
    long countByUsuarioGeradorId(@Param("usuarioId") UUID usuarioId);

    /**
     * Conta relatórios por status
     */
    @Query("SELECT COUNT(r) FROM Relatorio r WHERE r.statusRelatorio = :status")
    long countByStatusRelatorio(@Param("status") Relatorio.StatusRelatorio status);

}
