package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowCreateDto {
    private UUID templateId;
    private String title;
    private String description;
    private String priority; // low, medium, high, urgent
    private String visibility; // public, restricted, team
    private LocalDateTime deadline;
    private UUID teamId;
    private UUID assignToId; // ID do usuário para a primeira etapa
    private UUID statusTemplateId;
}