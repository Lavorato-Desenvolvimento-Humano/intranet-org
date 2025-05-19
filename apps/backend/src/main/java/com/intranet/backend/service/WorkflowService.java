package com.intranet.backend.service;

import com.intranet.backend.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface WorkflowService {

    WorkflowDto createWorkflow(WorkflowCreateDto workflowDto, UUID createdById);

    WorkflowDto getWorkflowById(UUID workflowId);

    Page<WorkflowSummaryDto> getAllWorkflows(Pageable pageable);

    Page<WorkflowSummaryDto> getWorkflowsByStatus(String status, Pageable pageable);

    // Método para obter fluxos por status personalizado
    Page<WorkflowSummaryDto> getWorkflowsByCustomStatus(UUID statusId, Pageable pageable);

    Page<WorkflowSummaryDto> getWorkflowsByTeam(UUID teamId, Pageable pageable);

    // Método para obter fluxos por etapa
    Page<WorkflowSummaryDto> getWorkflowsByStepNumber(int stepNumber, Pageable pageable);

    List<WorkflowSummaryDto> getWorkflowsAssignedToUser(UUID userId);

    Page<WorkflowSummaryDto> getVisibleWorkflows(UUID userId, Pageable pageable);

    WorkflowDto advanceToNextStep(UUID workflowId, UUID assignToId, String comments);

    WorkflowDto updateWorkflowStatus(UUID workflowId, String newStatus, String comments);

    // Método para atualizar o status personalizado de um fluxo
    WorkflowDto updateWorkflowCustomStatus(UUID workflowId, UUID statusId, String comments);

    WorkflowDto updateWorkflow(UUID workflowId, WorkflowCreateDto workflowDto);

    WorkflowAssignmentDto assignStep(UUID workflowId, int stepNumber, UUID assignToId, String comments);

    WorkflowAssignmentDto completeStep(UUID workflowId, int stepNumber, String comments);

    List<WorkflowTransitionDto> getWorkflowTransitions(UUID workflowId);

    WorkflowDto archiveWorkflow(UUID workflowId);

    WorkflowDto restoreWorkflow(UUID workflowId);

    boolean canUserModifyWorkflow(UUID userId, UUID workflowId);

    List<WorkflowSummaryDto> findOverdueWorkflows();

    List<WorkflowSummaryDto> findWorkflowsNearDeadline(int daysThreshold);

    WorkflowStatsDto getUserWorkflowStats(UUID userId);

    WorkflowStatsDto getGeneralWorkflowStats();

    List<UserWorkloadDto> getUsersWorkload();

    Map<String, Integer> getWorkflowCountByCustomStatus(UUID templateId);
}