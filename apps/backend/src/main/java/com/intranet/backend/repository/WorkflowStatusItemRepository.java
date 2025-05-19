package com.intranet.backend.repository;

import com.intranet.backend.model.WorkflowStatusItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowStatusItemRepository extends JpaRepository<WorkflowStatusItem, UUID> {

    List<WorkflowStatusItem> findByTemplateIdOrderByOrderIndex(UUID templateId);

    @Query("SELECT s FROM WorkflowStatusItem s WHERE s.template.id = :templateId AND s.isInitial = true")
    Optional<WorkflowStatusItem> findInitialStatusByTemplateId(@Param("templateId") UUID templateId);

    @Query("SELECT COUNT(s) FROM WorkflowStatusItem s WHERE s.template.id = :templateId")
    int countStatusItemsByTemplateId(@Param("templateId") UUID templateId);
}