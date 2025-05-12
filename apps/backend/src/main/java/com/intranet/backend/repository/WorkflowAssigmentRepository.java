package com.intranet.backend.repository;

import com.intranet.backend.model.WorkflowAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowAssigmentRepository extends JpaRepository<WorkflowAssignment,  UUID> {

    List<WorkflowAssignment> findByWorkflowIdOrderByStepNumber(UUID workflowId);

    List<WorkflowAssignment> findByAssignedToIdAndStatus(UUID assignedToId, String status);

    @Query("SELECT wa FROM WorkflowAssignment wa WHERE wa.workflow.id = :workflowId AND wa.stepNumber = :stepNumber")
    Optional<WorkflowAssignment> findByWorkflowIdAndStepNumber(
            @Param("workflowId") UUID workflowId,
            @Param("stepNumber") int stepNumber
    );

    @Query("SELECT COUNT(wa) FROM WorkflowAssignment wa WHERE wa.assignedTo.id = :userId AND wa.status = 'in_progress'")
    int countActiveAssignmentsByUserId(@Param("userId") UUID userId);

    @Query("SELECT wa FROM WorkflowAssignment wa WHERE wa.workflow.id = :workflowId AND wa.workflow.currentStep = wa.stepNumber")
    Optional<WorkflowAssignment> findCurrentAssignment(@Param("workflowId") UUID workflowId);
}
