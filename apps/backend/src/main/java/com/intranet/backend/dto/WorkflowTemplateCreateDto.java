package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTemplateCreateDto {
    private String name;
    private String description;
    private String visibility; // public, restricted, team
    private List<WorkflowTemplateStepCreateDto> steps;
}