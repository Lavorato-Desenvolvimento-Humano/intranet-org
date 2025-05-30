package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowNotificationDto {
    private UUID id;
    private UUID workflowId;
    private String workflowTitle;
    private UUID userId;
    private String title;
    private String message;
    private String type; // assignment, deadline, status_change
    private boolean read;
    private LocalDateTime createdAt;
}