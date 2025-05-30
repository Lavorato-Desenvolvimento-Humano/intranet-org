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

    @Query("SELECT s.name as statusName, s.color as statusColor, COUNT(w) as count FROM Workflow w JOIN w.customStatus s WHERE w.statusTemplate.id = :templateId GROUP BY s.id, s.name, s.color")
    List<Object[]> countByCustomStatusInTemplate(@Param("templateId") UUID templateId);

    @Query("SELECT COUNT(w) FROM Workflow w WHERE w.template.id = :templateId AND w.status = :status")
    int countByTemplateIdAndStatus(@Param("templateId") UUID templateId, @Param("status") String status);

    @Query("SELECT COUNT(w) FROM Workflow w WHERE w.statusTemplate.id = :statusTemplateId AND w.status = :status")
    int countByStatusTemplateIdAndStatus(@Param("statusTemplateId") UUID statusTemplateId, @Param("status") String status);

    @Query("SELECT COUNT(w) FROM Workflow w WHERE w.template.id = :templateId AND w.deadline < :date AND w.status = 'in_progress'")
    int countOverdueWorkflowsByTemplateId(@Param("templateId") UUID templateId, @Param("date") LocalDateTime date);

    @Query("SELECT COUNT(w) FROM Workflow w WHERE w.statusTemplate.id = :statusTemplateId AND w.deadline < :date AND w.status = 'in_progress'")
    int countOverdueWorkflowsByStatusTemplateId(@Param("statusTemplateId") UUID statusTemplateId, @Param("date") LocalDateTime date);

    @Query("SELECT w FROM Workflow w WHERE w.template.id = :templateId")
    Page<Workflow> findByTemplateId(@Param("templateId") UUID templateId, Pageable pageable);

    @Query("SELECT w FROM Workflow w WHERE w.template.id = :templateId AND w.status = :status")
    Page<Workflow> findByTemplateIdAndStatus(
            @Param("templateId") UUID templateId,
            @Param("status") String status,
            Pageable pageable);

    @Query("SELECT w FROM Workflow w WHERE " +
            "LOWER(w.title) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Workflow> findByTitleContaining(@Param("searchTerm") String searchTerm, Pageable pageable);

    @Query("SELECT w FROM Workflow w WHERE " +
            "LOWER(w.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) AND w.status = :status")
    Page<Workflow> findByTitleContainingAndStatus(
            @Param("searchTerm") String searchTerm,
            @Param("status") String status,
            Pageable pageable);

    @Query("SELECT w FROM Workflow w WHERE " +
            "LOWER(w.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) AND w.template.id = :templateId")
    Page<Workflow> findByTitleContainingAndTemplateId(
            @Param("searchTerm") String searchTerm,
            @Param("templateId") UUID templateId,
            Pageable pageable);

    @Query("SELECT w FROM Workflow w WHERE " +
            "LOWER(w.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) AND " +
            "w.template.id = :templateId AND w.status = :status")
    Page<Workflow> findByTitleContainingAndTemplateIdAndStatus(
            @Param("searchTerm") String searchTerm,
            @Param("templateId") UUID templateId,
            @Param("status") String status,
            Pageable pageable);

    @Query("SELECT w FROM Workflow w JOIN WorkflowAssignment wa ON w.id = wa.workflow.id " +
            "WHERE wa.assignedTo.id = :userId AND wa.stepNumber = w.currentStep AND w.status = 'in_progress' " +
            "ORDER BY w.title ASC")
    List<Workflow> findWorkflowsAssignedToUserOrderByTitle(@Param("userId") UUID userId);

    @Query("SELECT w FROM Workflow w JOIN WorkflowAssignment wa ON w.id = wa.workflow.id " +
            "WHERE wa.assignedTo.id = :userId AND wa.stepNumber = w.currentStep AND w.status = 'in_progress' " +
            "AND w.template.id = :templateId ORDER BY w.title ASC")
    List<Workflow> findWorkflowsAssignedToUserByTemplateOrderByTitle(@Param("userId") UUID userId, @Param("templateId") UUID templateId);

    @Query("SELECT w FROM Workflow w JOIN WorkflowAssignment wa ON w.id = wa.workflow.id " +
            "WHERE wa.assignedTo.id = :userId AND wa.stepNumber = w.currentStep AND w.status = 'in_progress' " +
            "AND LOWER(w.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY w.title ASC")
    List<Workflow> findWorkflowsAssignedToUserByTitleContainingOrderByTitle(
            @Param("userId") UUID userId,
            @Param("searchTerm") String searchTerm);

    @Query("SELECT w FROM Workflow w JOIN WorkflowAssignment wa ON w.id = wa.workflow.id " +
            "WHERE wa.assignedTo.id = :userId AND wa.stepNumber = w.currentStep AND w.status = 'in_progress' " +
            "AND w.template.id = :templateId AND LOWER(w.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "ORDER BY w.title ASC")
    List<Workflow> findWorkflowsAssignedToUserByTemplateAndTitleContainingOrderByTitle(
            @Param("userId") UUID userId,
            @Param("templateId") UUID templateId,
            @Param("searchTerm") String searchTerm);

    @Query("SELECT w FROM Workflow w LEFT JOIN w.customStatus cs ORDER BY " +
            "CASE " +
            "WHEN w.customStatus IS NOT NULL THEN cs.orderIndex " +
            "WHEN w.status = 'in_progress' THEN 1000 " +
            "WHEN w.status = 'paused' THEN 2000 " +
            "WHEN w.status = 'completed' THEN 3000 " +
            "WHEN w.status = 'canceled' THEN 4000 " +
            "WHEN w.status = 'archived' THEN 5000 " +
            "ELSE 6000 END, w.title ASC")
    Page<Workflow> findAllGroupedByStatusAndCustomStatusOrderByTitle(Pageable pageable);

    @Query("SELECT w FROM Workflow w LEFT JOIN w.customStatus cs WHERE w.template.id = :templateId ORDER BY " +
            "CASE " +
            "WHEN w.customStatus IS NOT NULL THEN cs.orderIndex " +
            "WHEN w.status = 'in_progress' THEN 1000 " +
            "WHEN w.status = 'paused' THEN 2000 " +
            "WHEN w.status = 'completed' THEN 3000 " +
            "WHEN w.status = 'canceled' THEN 4000 " +
            "WHEN w.status = 'archived' THEN 5000 " +
            "ELSE 6000 END, w.title ASC")
    Page<Workflow> findByTemplateIdGroupedByStatusAndCustomStatusOrderByTitle(@Param("templateId") UUID templateId, Pageable pageable);

    @Query("SELECT w FROM Workflow w LEFT JOIN w.customStatus cs WHERE " +
            "LOWER(w.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY " +
            "CASE " +
            "WHEN w.customStatus IS NOT NULL THEN cs.orderIndex " +
            "WHEN w.status = 'in_progress' THEN 1000 " +
            "WHEN w.status = 'paused' THEN 2000 " +
            "WHEN w.status = 'completed' THEN 3000 " +
            "WHEN w.status = 'canceled' THEN 4000 " +
            "WHEN w.status = 'archived' THEN 5000 " +
            "ELSE 6000 END, w.title ASC")
    Page<Workflow> findByTitleContainingGroupedByStatusAndCustomStatusOrderByTitle(@Param("searchTerm") String searchTerm, Pageable pageable);

    @Query("SELECT w FROM Workflow w LEFT JOIN w.customStatus cs WHERE " +
            "LOWER(w.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) AND w.template.id = :templateId ORDER BY " +
            "CASE " +
            "WHEN w.customStatus IS NOT NULL THEN cs.orderIndex " +
            "WHEN w.status = 'in_progress' THEN 1000 " +
            "WHEN w.status = 'paused' THEN 2000 " +
            "WHEN w.status = 'completed' THEN 3000 " +
            "WHEN w.status = 'canceled' THEN 4000 " +
            "WHEN w.status = 'archived' THEN 5000 " +
            "ELSE 6000 END, w.title ASC")
    Page<Workflow> findByTitleContainingAndTemplateIdGroupedByStatusAndCustomStatusOrderByTitle(
            @Param("searchTerm") String searchTerm,
            @Param("templateId") UUID templateId,
            Pageable pageable);
}