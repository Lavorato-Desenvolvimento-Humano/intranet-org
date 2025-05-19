package com.intranet.backend.service;

import com.intranet.backend.dto.WorkflowStatusTemplateCreateDto;
import com.intranet.backend.dto.WorkflowStatusTemplateDto;
import com.intranet.backend.dto.WorkflowStatusItemDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface WorkflowStatusService {

    WorkflowStatusTemplateDto createStatusTemplate(WorkflowStatusTemplateCreateDto templateDto, UUID createdById);

    WorkflowStatusTemplateDto updateStatusTemplate(UUID templateId, WorkflowStatusTemplateCreateDto templateDto);

    WorkflowStatusTemplateDto getStatusTemplateById(UUID templateId);

    Page<WorkflowStatusTemplateDto> getAllStatusTemplates(Pageable pageable);

    List<WorkflowStatusTemplateDto> getStatusTemplatesByCreatedBy(UUID createdById);

    List<WorkflowStatusTemplateDto> getAvailableStatusTemplates(UUID userId);

    List<WorkflowStatusItemDto> getStatusItems(UUID templateId);

    void deleteStatusTemplate(UUID templateId);

    boolean canUserModifyStatusTemplate(UUID userId, UUID templateId);

    WorkflowStatusItemDto getInitialStatus(UUID templateId);
}