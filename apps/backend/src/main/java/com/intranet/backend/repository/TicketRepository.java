package com.intranet.backend.repository;

import com.intranet.backend.model.Ticket;
import com.intranet.backend.model.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Page<Ticket> findByRequesterId(UUID requesterId, Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE t.targetTeam.id = :teamId AND t.assignee IS NULL AND t.status = 'OPEN'")
    Page<Ticket> findUnassignedByTeam(@Param("teamId") UUID teamId, Pageable pageable);

    Page<Ticket> findByAssigneeIdAndStatusNot(UUID assigneeId, TicketStatus status, Pageable pageable);

    long countByTargetTeamIdAndAssigneeIsNull(UUID targetTeamId);

    // 1. Meus Pedidos (Created By Me)
    List<Ticket> findByRequesterIdOrderByCreatedAtDesc(UUID requesterId);

    // 2. Meus Atendimentos (Assigned To Me) - Filtrando status
    List<Ticket> findByAssigneeIdAndStatusInOrderByPriorityDesc(UUID assigneeId, List<TicketStatus> statuses);

    // 3. Fila da Equipe (Queue) - Tickets sem dono para as equipes que eu participo
    @Query("SELECT t FROM Ticket t WHERE t.assignee IS NULL AND t.status = 'OPEN' AND t.targetTeam.id IN :teamIds ORDER BY t.priority DESC, t.createdAt ASC")
    List<Ticket> findQueueByTeamIds(@Param("teamIds") List<UUID> teamIds);

    // --- ESTATÍSTICAS GERAIS (GLOBAL) ---

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = 'OPEN'")
    long countOpenTickets();

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.closedAt >= :startOfDay")
    long countClosedToday(@Param("startOfDay") LocalDateTime startOfDay);

    // Média de Avaliação (CSAT)
    @Query("SELECT AVG(t.rating) FROM Ticket t WHERE t.rating IS NOT NULL")
    Double getAverageRating();

    // Contagem por Status
    @Query("SELECT t.status, COUNT(t) FROM Ticket t GROUP BY t.status")
    List<Object[]> countTicketsByStatus();

    // Contagem por Prioridade
    @Query("SELECT t.priority, COUNT(t) FROM Ticket t GROUP BY t.priority")
    List<Object[]> countTicketsByPriority();

    // SLA Compliance (Tickets fechados que NÃO estouraram o prazo)
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status IN ('RESOLVED', 'CLOSED') AND t.closedAt <= t.dueDate")
    long countTicketsWithinSla();

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status IN ('RESOLVED', 'CLOSED')")
    long countTotalClosedTickets();

    @Query("SELECT t FROM Ticket t WHERE t.status NOT IN ('RESOLVED', 'CLOSED') AND t.dueDate <= :limitDate ORDER BY t.dueDate ASC")
    List<Ticket> findTicketsAtRisk(@Param("limitDate") LocalDateTime limitDate, Pageable pageable);

    // Avaliações Baixas Recentes
    @Query("SELECT t FROM Ticket t WHERE t.rating IS NOT NULL AND t.rating <= :maxRating ORDER BY t.closedAt DESC")
    List<Ticket> findLowRatedTickets(@Param("maxRating") Integer maxRating, Pageable pageable);

    // Últimos Tickets (Visão Geral)
    List<Ticket> findTop10ByOrderByUpdatedAtDesc();

    @Query("SELECT t FROM Ticket t WHERE t.status IN ('RESOLVED', 'CLOSED') ORDER BY t.closedAt DESC")
    List<Ticket> findRecentlyClosedTickets(Pageable pageable);


    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = 'OPEN' AND t.targetTeam.id = :teamId")
    long countOpenTicketsByTeam(@Param("teamId") UUID teamId);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.closedAt >= :startOfDay AND t.targetTeam.id = :teamId")
    long countClosedTodayByTeam(@Param("startOfDay") LocalDateTime startOfDay, @Param("teamId") UUID teamId);

    @Query("SELECT AVG(t.rating) FROM Ticket t WHERE t.rating IS NOT NULL AND t.targetTeam.id = :teamId")
    Double getAverageRatingByTeam(@Param("teamId") UUID teamId);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status IN ('RESOLVED', 'CLOSED') AND t.targetTeam.id = :teamId")
    long countTotalClosedTicketsByTeam(@Param("teamId") UUID teamId);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status IN ('RESOLVED', 'CLOSED') AND t.closedAt <= t.dueDate AND t.targetTeam.id = :teamId")
    long countTicketsWithinSlaByTeam(@Param("teamId") UUID teamId);

    @Query("SELECT t.status, COUNT(t) FROM Ticket t WHERE t.targetTeam.id = :teamId GROUP BY t.status")
    List<Object[]> countTicketsByStatusAndTeam(@Param("teamId") UUID teamId);

    @Query("SELECT t.priority, COUNT(t) FROM Ticket t WHERE t.targetTeam.id = :teamId GROUP BY t.priority")
    List<Object[]> countTicketsByPriorityAndTeam(@Param("teamId") UUID teamId);

    @Query("SELECT t FROM Ticket t WHERE t.targetTeam.id = :teamId AND t.status NOT IN ('RESOLVED', 'CLOSED') AND t.dueDate <= :limitDate ORDER BY t.dueDate ASC")
    List<Ticket> findTicketsAtRiskByTeam(@Param("teamId") UUID teamId, @Param("limitDate") LocalDateTime limitDate, Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE t.targetTeam.id = :teamId AND t.rating IS NOT NULL AND t.rating <= :maxRating ORDER BY t.closedAt DESC")
    List<Ticket> findLowRatedTicketsByTeam(@Param("teamId") UUID teamId, @Param("maxRating") Integer maxRating, Pageable pageable);

    List<Ticket> findTop10ByTargetTeamIdOrderByUpdatedAtDesc(UUID targetTeamId);

    @Query("SELECT t FROM Ticket t WHERE t.targetTeam.id = :teamId AND t.status IN ('RESOLVED', 'CLOSED') ORDER BY t.closedAt DESC")
    List<Ticket> findRecentlyClosedTicketsByTeam(@Param("teamId") UUID teamId, Pageable pageable);
}