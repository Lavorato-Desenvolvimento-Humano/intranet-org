package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStatusItemDto {
    private UUID id;
    private UUID templateId;
    private String name;
    private String description;
    private String color;
    private int orderIndex;
    private boolean isInitial;
    private boolean isFinal;
}