package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTransitionDto {
    private UUID id;
    private UUID workflowId;
    private Integer fromStep;
    private String fromStepName;
    private Integer toStep;
    private String toStepName;
    private String fromStatus;
    private String toStatus;
    private UUID fromUserId;
    private String fromUserName;
    private UUID toUserId;
    private String toUserName;
    private String comments;
    private String transitionType; // assignment, status_change, step_change
    private UUID createdById;
    private String createdByName;
    private LocalDateTime createdAt;
}