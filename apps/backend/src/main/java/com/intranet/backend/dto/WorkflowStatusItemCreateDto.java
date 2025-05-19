package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStatusItemCreateDto {
    private String name;
    private String description;
    private String color;
    private int orderIndex;
    private boolean isInitial;
    private boolean isFinal;
}