package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTemplateStepCreateDto {
    private String name;
    private String description;
    private int stepOrder;
}