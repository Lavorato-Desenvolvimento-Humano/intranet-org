package com.intranet.backend.service;

import com.intranet.backend.dto.WorkflowTemplateCreateDto;
import com.intranet.backend.dto.WorkflowTemplateDto;
import com.intranet.backend.dto.WorkflowTemplateStepDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface WorkflowTemplateService {

    WorkflowTemplateDto createTemplate(WorkflowTemplateCreateDto templateDto, UUID createdById);

    WorkflowTemplateDto updateTemplate(UUID templateId, WorkflowTemplateCreateDto templateDto);

    WorkflowTemplateDto getTemplateById(UUID templateId);

    Page<WorkflowTemplateDto> getAllTemplates(Pageable pageable);

    List<WorkflowTemplateDto> getTemplatesByCreatedBy(UUID createdById);

    List<WorkflowTemplateDto> getVisibleTemplates(UUID userId);

    List<WorkflowTemplateStepDto> getTemplateSteps(UUID TemplateId);

    void deleteTemplate(UUID templateId);

    boolean canUserModifyTemplate(UUID userId, UUID templateId);
}
