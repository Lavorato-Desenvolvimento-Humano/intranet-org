package com.intranet.backend.repository;

import com.intranet.backend.model.WorkflowTransition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowTransitionRepository extends JpaRepository<WorkflowTransition, UUID> {

    List<WorkflowTransition> findByWorkflowIdOrderByCreatedAtDesc(UUID workflowId);

    Page<WorkflowTransition> findByWorkflowId(UUID workflowId, Pageable pageable);

    @Query("SELECT wt FROM WorkflowTransition wt WHERE wt.workflow.id = :workflowId AND wt.transitionType = :transitionType")
    List<WorkflowTransition> findByWorkflowIdAndTransitionType(
            @Param("workflowId") UUID workflowId,
            @Param("transitionType") String transitionType
    );

    @Query("SELECT COUNT(wt) FROM WorkflowTransition wt WHERE wt.workflow.id = :workflowId")
    int  CountByWorkflowId(@Param("workflowId") UUID workflowId);
}
