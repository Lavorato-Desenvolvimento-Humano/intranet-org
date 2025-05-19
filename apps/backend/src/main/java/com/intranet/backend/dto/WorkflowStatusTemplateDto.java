package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStatusTemplateDto {
    private UUID id;
    private String name;
    private String description;
    private UUID createdById;
    private String createdByName;
    private List<WorkflowStatusItemDto> statusItems;
    private int workflowCount; // Número de fluxos usando este template
    private boolean isDefault;
    private String createdAt;
    private String updatedAt;
}