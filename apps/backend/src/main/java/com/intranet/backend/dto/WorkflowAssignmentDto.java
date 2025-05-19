package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowAssignmentDto {
    private UUID id;
    private UUID workflowId;
    private String workflowTitle;
    private int stepNumber;
    private String stepName;
    private String stepDescription;
    private UUID assignedToId;
    private String assignedToName;
    private String status; // pending, in_progress, completed
    private LocalDateTime startDate;
    private LocalDateTime completionDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}