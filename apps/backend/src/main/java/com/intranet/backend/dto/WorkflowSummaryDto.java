package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowSummaryDto {
    private UUID id;
    private String title;
    private String templateName;
    private String priority;
    private String status;
    private LocalDateTime deadline;
    private String teamName;
    private String createdByName;
    private int currentStep;
    private int totalSteps;
    private int progressPercentage;
    private UUID currentAssigneeId;
    private String currentAssigneeName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isOverdue;
    private boolean isNearDeadline;
    private int daysRemaining;
}