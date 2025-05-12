package com.intranet.backend.repository;

import com.intranet.backend.model.WorkflowTemplateStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowTemplateStepRepository extends JpaRepository<WorkflowTemplateStep, UUID> {

    List<WorkflowTemplateStep> findByTemplateIdOrderByStepOrder(UUID templateId);

    @Query("SELECT COUNT(s) FROM WorkflowTemplateStep s WHERE s.template.id = :templateId")
    int countStepsByTemplateId(@Param("templateId") UUID templateId);

    @Query("SELECT s.name FROM WorkflowTemplateStep s WHERE s.template.id = :templateId AND s.stepOrder = :stepOrder")
    String findStepNameByTemplateIdAndStepOrder(@Param("templateId") UUID templateId, @Param("stepOrder") int stepOrder);
}
