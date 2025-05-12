package com.intranet.backend.repository;

import com.intranet.backend.model.WorkflowNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowNotificationRepository extends JpaRepository<WorkflowNotification, UUID> {

    Page<WorkflowNotification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<WorkflowNotification> findByUserIdAndReadOrderByCreatedAtDesc(UUID userId, boolean read);

    @Query("SELECT COUNT(wn) FROM WorkflowNotification wn WHERE wn.user.id = :userId AND wn.read = false")
    int countUnreadNotifications(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE WorkflowNotification wn SET wn.read = true WHERE wn.id = :id")
    void markAsRead(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE WorkflowNotification wn SET wn.read = true WHERE wn.user.id = :userId")
    void markAllAsRead(@Param("userId") UUID userId);

    @Query("SELECT wn FROM WorkflowNotification wn WHERE wn.workflow.id = :workflowId AND wn.user.id = :userId")
    List<WorkflowNotification> findByWorkflowIdAndUserId(
            @Param("workflowId") UUID workflowId,
            @Param("userId") UUID userId
    );
}