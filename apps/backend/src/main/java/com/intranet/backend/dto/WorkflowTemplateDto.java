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
public class WorkflowTemplateDto {
    private UUID id;
    private String name;
    private String description;
    private String visibility; // public, restricted, team
    private UUID createdById;
    private String createdByName;
    private List<WorkflowTemplateStepDto> steps;
    private int workflowCount; // Número de fluxos criados a partir deste template
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}