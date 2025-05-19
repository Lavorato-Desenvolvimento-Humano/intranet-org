package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowStatusTemplateCreateDto {
    private String name;
    private String description;
    private List<WorkflowStatusItemCreateDto> statusItems;
    private boolean isDefault;
}