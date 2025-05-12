package com.intranet.backend.service;

import com.intranet.backend.dto.WorkflowNotificationDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface WorkflowNotificationService {

    WorkflowNotificationDto createNotification(
            UUID workflowId,
            UUID userId,
            String title,
            String message,
            String type
    );

    WorkflowNotificationDto createAssignmentNotification(
            UUID workflowId,
            UUID userId,
            int stepNumber,
            String stepName
    );

    WorkflowNotificationDto createDeadlineNotification(
            UUID workflowId,
            UUID userId,
            int daysRemaining
    );

    WorkflowNotificationDto createStatusChangeNotification(
            UUID workflowId,
            UUID userId,
            String oldStatus,
            String newStatus
    );

    Page<WorkflowNotificationDto> getUserNotifications(UUID userId, Pageable pageable);

    List<WorkflowNotificationDto> getUnreadNotifications(UUID userId);

    void markNotificationAsRead(UUID notificationId);

    void markAllNotificationsAsRead(UUID userId);

    int countUnreadNotifications(UUID userId);

    void checkAndSendDeadlineNotifications(int daysThreshold);
}