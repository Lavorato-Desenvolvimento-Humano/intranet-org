package com.intranet.backend.repository;

import com.intranet.backend.model.Workflow;
import com.intranet.backend.model.WorkflowAssignment;
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
public interface WorkflowRepository extends JpaRepository<Workflow, UUID> {

    List<Workflow> findByCreatedById(UUID createdById);

    @Query("SELECT w FROM Workflow w WHERE w.status = :status")
    Page<Workflow> findByStatus(@Param("status") String status, Pageable pageable);

    @Query("SELECT w FROM Workflow w WHERE w.team.id = :teamId")
    Page<Workflow> findByTeamId(@Param("teamId") UUID teamId, Pageable pageable);

    @Query("SELECT w FROM Workflow w WHERE w.deadline < :date AND w.status = 'in_progress'")
    List<Workflow> findOverdueWorkflows(@Param("date") LocalDateTime date);

    @Query("SELECT w FROM Workflow w WHERE w.deadline BETWEEN :startDate AND :endDate AND w.status = 'in_progress'")
    List<Workflow> findWorkflowsWithDeadlineBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT w FROM Workflow w JOIN WorkflowAssignment wa ON w.id = wa.workflow.id " +
            "WHERE wa.assignedTo.id = :userId AND wa.stepNumber = w.currentStep AND w.status = 'in_progress'")
    List<Workflow> findWorkflowsAssignedToUser(@Param("userId") UUID userId);

    @Query("SELECT w FROM Workflow w WHERE " +
            "(w.visibility = 'public') OR " +
            "(w.visibility = 'team' AND w.team.id IN (SELECT ue.equipe.id FROM UserEquipe ue WHERE ue.user.id = :userId)) OR " +
            "(w.visibility = 'restricted' AND w.id IN (SELECT wa.workflow.id FROM WorkflowAssignment wa WHERE wa.assignedTo.id = :userId)) OR " +
            "w.createdBy.id = :userId")
    Page<Workflow> findVisibleWorkflows(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT COUNT(w) FROM Workflow w WHERE w.status = :status")
    int countByStatus(@Param("status") String status);

    @Query("SELECT COUNT(w) FROM Workflow w WHERE w.createdBy.id = :userId AND w.status = :status")
    int countByCreatedByIdAndStatus(@Param("userId") UUID userId, @Param("status") String status);

    @Query("SELECT w FROM Workflow w WHERE w.customStatus.id = :statusId")
    Page<Workflow> findByCustomStatusId(@Param("statusId") UUID statusId, Pageable pageable);

    @Query("SELECT w FROM Workflow w WHERE w.currentStep = :stepNumber")
    Page<Workflow> findByCurrentStep(@Param("stepNumber") int stepNumber, Pageable pageable);

    @Query("SELECT COUNT(w) FROM Workflow w WHERE w.customStatus.id = :statusId")
    int countByCustomStatusId(@Param("statusId") UUID statusId);

    @Query("SELECT w.customStatus.id as statusId, COUNT(w) as count FROM Workflow w WHERE w.customStatus IS NOT NULL GROUP BY w.customStatus.id")
    List<Object[]> countByCustomStatusGrouped();

    @Query("SELECT s.name as statusName, s.color as statusColor, COUNT(w) as count FROM Workflow w JOIN w.customStatus s WHERE w.statusTemplate.id = :templateId GROUP BY s.id, s.name, s.color")
    List<Object[]> countByCustomStatusInTemplate(@Param("templateId") UUID templateId);


}
