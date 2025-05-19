package com.intranet.backend.repository;

import com.intranet.backend.model.WorkflowStatusTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowStatusTemplateRepository extends JpaRepository<WorkflowStatusTemplate, UUID> {

    List<WorkflowStatusTemplate> findByCreatedById(UUID createdById);

    @Query("SELECT t FROM WorkflowStatusTemplate t WHERE t.createdBy.id = :userId " +
            "OR EXISTS (SELECT 1 FROM UserRole ur " +
            "JOIN RolePermission rp ON ur.role.id = rp.role.id " +
            "JOIN Permission p ON rp.permission.id = p.id " +
            "WHERE ur.user.id = :userId AND p.name = 'workflow_status:manage')")
    List<WorkflowStatusTemplate> findAvailableTemplates(@Param("userId") UUID userId);

    @Query("SELECT COUNT(w) FROM Workflow w WHERE w.statusTemplate.id = :templateId")
    int countWorkflowsByTemplateId(@Param("templateId") UUID templateId);

    @Query("SELECT t FROM WorkflowStatusTemplate t LEFT JOIN FETCH t.createdBy WHERE t.id = :id")
    Optional<WorkflowStatusTemplate> findByIdWithCreatedBy(@Param("id") UUID id);

    @Query("SELECT DISTINCT t FROM WorkflowStatusTemplate t LEFT JOIN FETCH t.createdBy")
    Page<WorkflowStatusTemplate> findAllWithCreatedBy(Pageable pageable);
}