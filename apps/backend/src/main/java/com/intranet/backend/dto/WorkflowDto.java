package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowDto {
    private UUID id;
    private UUID templateId;
    private String templateName;
    private String title;
    private String description;
    private String priority; // low, medium, high, urgent
    private String status; // in_progress, paused, completed, canceled, archived
    private String visibility; // public, restricted, team
    private LocalDateTime deadline;
    private UUID teamId;
    private String teamName;
    private UUID createdById;
    private String createdByName;
    private int currentStep;
    private int totalSteps;
    private int progressPercentage;
    private List<WorkflowAssignmentDto> assignments;
    private List<WorkflowTransitionDto> transitions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isOverdue;
    private boolean isNearDeadline;
    private int daysRemaining;
}