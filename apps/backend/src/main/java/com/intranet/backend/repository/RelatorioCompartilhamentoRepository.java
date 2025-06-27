package com.intranet.backend.repository;

import com.intranet.backend.model.RelatorioCompartilhamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RelatorioCompartilhamentoRepository extends JpaRepository<RelatorioCompartilhamento, UUID> {

    /**
     * Busca compartilhamentos por relatório
     */
    @Query("SELECT rc FROM RelatorioCompartilhamento rc " +
            "LEFT JOIN FETCH rc.usuarioOrigem " +
            "LEFT JOIN FETCH rc.usuarioDestino " +
            "WHERE rc.relatorio.id = :relatorioId " +
            "ORDER BY rc.dataCompartilhamento DESC")
    List<RelatorioCompartilhamento> findByRelatorioId(@Param("relatorioId") UUID relatorioId);

    /**
     * Busca compartilhamentos recebidos por usuário
     */
    @Query("SELECT rc FROM RelatorioCompartilhamento rc " +
            "LEFT JOIN FETCH rc.relatorio " +
            "LEFT JOIN FETCH rc.usuarioOrigem " +
            "WHERE rc.usuarioDestino.id = :usuarioId " +
            "ORDER BY rc.dataCompartilhamento DESC")
    Page<RelatorioCompartilhamento> findByUsuarioDestinoId(@Param("usuarioId") UUID usuarioId, Pageable pageable);

    /**
     * Busca compartilhamentos enviados por usuário
     */
    @Query("SELECT rc FROM RelatorioCompartilhamento rc " +
            "LEFT JOIN FETCH rc.relatorio " +
            "LEFT JOIN FETCH rc.usuarioDestino " +
            "WHERE rc.usuarioOrigem.id = :usuarioId " +
            "ORDER BY rc.dataCompartilhamento DESC")
    Page<RelatorioCompartilhamento> findByUsuarioOrigemId(@Param("usuarioId") UUID usuarioId, Pageable pageable);

    /**
     * Busca compartilhamentos não visualizados por usuário
     */
    @Query("SELECT rc FROM RelatorioCompartilhamento rc " +
            "LEFT JOIN FETCH rc.relatorio " +
            "LEFT JOIN FETCH rc.usuarioOrigem " +
            "WHERE rc.usuarioDestino.id = :usuarioId " +
            "AND rc.visualizado = false " +
            "ORDER BY rc.dataCompartilhamento DESC")
    List<RelatorioCompartilhamento> findNaoVisualizadosByUsuarioDestino(@Param("usuarioId") UUID usuarioId);

    /**
     * Conta compartilhamentos não visualizados por usuário
     */
    long countByUsuarioDestinoIdAndVisualizadoFalse(UUID usuarioId);

    /**
     * Verifica se um relatório já foi compartilhado entre dois usuários
     */
    boolean existsByRelatorioIdAndUsuarioOrigemIdAndUsuarioDestinoId(UUID relatorioId, UUID origemId, UUID destinoId);
}