package com.intranet.backend.repository;

import com.intranet.backend.model.WorkflowTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowTemplateRepository extends JpaRepository<WorkflowTemplate, UUID> {

    List<WorkflowTemplate> findByCreatedById(UUID createdById);

    @Query("SELECT t FROM WorkflowTemplate t WHERE t.visibility = 'public' OR " +
            "(t.visibility = 'team' AND EXISTS (SELECT 1 FROM UserEquipe ue WHERE ue.user.id = :userId AND ue.equipe.id = :teamId)) OR " +
            "t.createdBy.id = :userId")
    List<WorkflowTemplate> findVisibleTemplates(@Param("userId") UUID userId, @Param("teamId") UUID teamId);

    @Query("SELECT t FROM WorkflowTemplate t WHERE t.visibility = 'public'")
    List<WorkflowTemplate> findPublicTemplates();

    @Query("SELECT COUNT(w) FROM Workflow w WHERE w.template.id = :templateId")
    int countWorkflowsByTemplateId(@Param("templateId") UUID templateId);
}