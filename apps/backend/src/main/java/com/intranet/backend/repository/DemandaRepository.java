package com.intranet.backend.repository;

import com.intranet.backend.model.Demanda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DemandaRepository extends JpaRepository<Demanda, UUID>, JpaSpecificationExecutor<Demanda> {

    @Query("SELECT d FROM Demanda d WHERE d.atribuidoPara.id = :userId ORDER BY " +
            "CASE d.prioridade " +
            "WHEN 'urgente' THEN 0 " +
            "WHEN 'alta' THEN 1 " +
            "WHEN 'media' THEN 2 " +
            "WHEN 'baixa' THEN 3 " +
            "ELSE 4 END, " +
            "d.dataFim ASC NULLS LAST")
    List<Demanda> findByAtribuidoParaIdOrderByPrioridadeAndDataFim(@Param("userId") UUID userId);

    @Query("SELECT d FROM Demanda d WHERE d.criadoPor.id = :userId ORDER BY d.criadaEm DESC")
    List<Demanda> findByCriadoPorIdOrderByCriadaEm(@Param("userId") UUID userId);

    @Query("SELECT d FROM Demanda d WHERE d.status = :status ORDER BY " +
            "CASE d.prioridade " +
            "WHEN 'urgente' THEN 0 " +
            "WHEN 'alta' THEN 1 " +
            "WHEN 'media' THEN 2 " +
            "WHEN 'baixa' THEN 3 " +
            "ELSE 4 END, " +
            "d.dataFim ASC NULLS LAST")
    List<Demanda> findByStatusOrderByPrioridadeAndDataFim(@Param("status") String status);

    @Query("SELECT d FROM Demanda d " +
            "WHERE (d.dataInicio <= :dataFim) AND (d.dataFim >= :dataInicio OR d.dataFim IS NULL)" +
            "ORDER BY d.dataInicio ASC")
    List<Demanda> findByPeriodo(
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim);

    @Query("SELECT d FROM Demanda d JOIN FETCH d.criadoPor JOIN FETCH d.atribuidoPara WHERE d.id = :id")
    Demanda findByIdWithUsuarios(@Param("id") UUID id);

    @Query("SELECT d FROM Demanda d " +
            "JOIN FETCH d.criadoPor c " +
            "JOIN FETCH d.atribuidoPara a " +
            "JOIN UserEquipe ue ON a.id = ue.user.id " +
            "WHERE ue.equipe.id = :equipeId")
    List<Demanda> findByEquipeId(@Param("equipeId") UUID equipeId);

    @Query("SELECT DISTINCT e.id FROM User u " +
            "JOIN UserEquipe ue ON u.id = ue.user.id " +
            "JOIN Equipe e ON ue.equipe.id = e.id " +
            "WHERE u.id = :userId")
    List<UUID> findEquipeIdsByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(d) FROM Demanda d WHERE d.atribuidoPara.id = :userId AND d.status != 'concluida'")
    long countDemandasPendentes(@Param("userId") UUID userId);

    /**
     * Consulta para obter todas as demandas de uma equipe, verificando os usuários que pertencem a ela
     */
    @Query("SELECT DISTINCT d FROM Demanda d " +
            "JOIN FETCH d.criadoPor cp " +
            "JOIN FETCH d.atribuidoPara ap " +
            "JOIN UserEquipe ue ON ap.id = ue.user.id " +
            "WHERE ue.equipe.id = :equipeId")
    List<Demanda> findByEquipeIdCompleto(@Param("equipeId") UUID equipeId);

    /**
     * Conta o número de demandas criadas em um período
     */
    @Query("SELECT COUNT(d) FROM Demanda d WHERE d.criadaEm BETWEEN :inicio AND :fim")
    long countByCriadaEmBetween(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    /**
     * Conta o número de demandas com status específico atualizadas em um período
     */
    @Query("SELECT COUNT(d) FROM Demanda d WHERE d.status = :status AND d.atualizadaEm BETWEEN :inicio AND :fim")
    long countByStatusAndAtualizadaEmBetween(
            @Param("status") String status,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim);

    /**
     * Encontra os 5 usuários com mais demandas pendentes
     */
    @Query(value = "SELECT u.id, u.full_name, COUNT(d.id) as qtd " +
            "FROM users u " +
            "JOIN demandas d ON u.id = d.atribuido_para " +
            "WHERE d.status != 'concluida' " +
            "GROUP BY u.id, u.full_name " +
            "ORDER BY qtd DESC " +
            "LIMIT 5", nativeQuery = true)
    List<Object[]> findTop5UsuariosComMaisDemandas();

    /**
     * Conta demandas por status e usuário atribuído
     */
    @Query("SELECT COUNT(d) FROM Demanda d WHERE d.status = :status AND d.atribuidoPara.id = :userId")
    long countByStatusAndAtribuidoParaId(@Param("status") String status, @Param("userId") UUID userId);

    /**
     * Conta demandas por prioridade e usuário atribuído
     */
    @Query("SELECT COUNT(d) FROM Demanda d WHERE d.prioridade = :prioridade AND d.atribuidoPara.id = :userId")
    long countByPrioridadeAndAtribuidoParaId(@Param("prioridade") String prioridade, @Param("userId") UUID userId);

    /**
     * Conta demandas próximas do prazo para um usuário
     */
    @Query("SELECT COUNT(d) FROM Demanda d WHERE d.atribuidoPara.id = :userId " +
            "AND d.status != :status AND d.dataFim BETWEEN :inicio AND :fim")
    long countByAtribuidoParaIdAndStatusNotAndDataFimBetween(
            @Param("userId") UUID userId,
            @Param("status") String status,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim);

    /**
     * Calcula o tempo médio de conclusão em dias para um usuário
     */
    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) " +
            "FROM demandas " +
            "WHERE atribuido_para = :userId AND status = 'concluida'", nativeQuery = true)
    Double calcularTempoMedioConclusaoPorUsuario(@Param("userId") UUID userId);

    /**
     * Conta o total de demandas atribuídas a um usuário
     */
    @Query("SELECT COUNT(d) FROM Demanda d WHERE d.atribuidoPara.id = :userId")
    long countByAtribuidoParaId(@Param("userId") UUID userId);

    /**
     * Conta o número de demandas por prioridade
     */
    @Query("SELECT COUNT(d) FROM Demanda d WHERE d.prioridade = :prioridade")
    long countByPrioridade(@Param("prioridade") String prioridade);

    Long countByStatus(String valor);
}