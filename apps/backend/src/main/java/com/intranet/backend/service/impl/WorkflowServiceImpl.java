package com.intranet.backend.service.impl;

import com.intranet.backend.dto.*;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.*;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.WorkflowNotificationService;
import com.intranet.backend.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowServiceImpl implements WorkflowService {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowServiceImpl.class);

    private final WorkflowRepository workflowRepository;
    private final WorkflowTemplateRepository templateRepository;
    private final WorkflowTemplateStepRepository stepRepository;
    private final WorkflowAssigmentRepository assignmentRepository;
    private final WorkflowTransitionRepository transitionRepository;
    private final UserRepository userRepository;
    private final EquipeRepository equipeRepository;
    private final WorkflowNotificationService notificationService;
    private final WorkflowStatusTemplateRepository statusTemplateRepository;
    private final WorkflowStatusItemRepository statusItemRepository;

    // Constante para definir quando um fluxo está próximo do vencimento (em dias)
    private static final int NEAR_DEADLINE_DAYS = 3;

    // Constante para definir o limite de carga de trabalho para um usuário (número de tarefas ativas)
    private static final int WORKLOAD_THRESHOLD = 10;

    @Override
    @Transactional
    public WorkflowDto createWorkflow(WorkflowCreateDto workflowDto, UUID createdById) {
        logger.info("Criando novo fluxo de trabalho para usuário: {}", createdById);

        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + createdById));

        WorkflowTemplate template = templateRepository.findById(workflowDto.getTemplateId())
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + workflowDto.getTemplateId()));

        // Verificar se o template tem passos
        int stepsCount = stepRepository.countStepsByTemplateId(template.getId());
        if (stepsCount == 0) {
            throw new IllegalStateException("O template selecionado não possui etapas definidas.");
        }

        Equipe team = null;
        if (workflowDto.getTeamId() != null) {
            team = equipeRepository.findById(workflowDto.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Equipe não encontrada com o ID: " + workflowDto.getTeamId()));
        }

        // Criar o fluxo
        Workflow workflow = new Workflow();
        workflow.setTemplate(template);
        workflow.setTitle(workflowDto.getTitle());
        workflow.setDescription(workflowDto.getDescription());
        workflow.setPriority(workflowDto.getPriority());
        workflow.setStatus("in_progress");
        workflow.setVisibility(workflowDto.getVisibility());
        workflow.setDeadline(workflowDto.getDeadline());
        workflow.setTeam(team);
        workflow.setCreatedBy(createdBy);
        workflow.setCurrentStep(1);
        workflow.setProgressPercentage(0);

        if (workflowDto.getStatusTemplateId() != null) {
            WorkflowStatusTemplate statusTemplate = statusTemplateRepository.findById(workflowDto.getStatusTemplateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Template de status não encontrado com o ID: " + workflowDto.getStatusTemplateId()));

            workflow.setStatusTemplate(statusTemplate);

            // Buscar o status inicial
            Optional<WorkflowStatusItem> initialStatus = statusItemRepository.findInitialStatusByTemplateId(statusTemplate.getId());
            initialStatus.ifPresent(workflow::setCustomStatus);
        }

        Workflow savedWorkflow = workflowRepository.save(workflow);

        // Criar a primeira atribuição
        User assignedTo;
        if (workflowDto.getAssignToId() != null) {
            assignedTo = userRepository.findById(workflowDto.getAssignToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + workflowDto.getAssignToId()));
        } else {
            // Se não foi especificado um usuário, atribuir ao criador
            assignedTo = createdBy;
        }

        // Buscar o nome da primeira etapa
        String stepName = stepRepository.findStepNameByTemplateIdAndStepOrder(template.getId(), 1);

        WorkflowAssignment assignment = new WorkflowAssignment();
        assignment.setWorkflow(savedWorkflow);
        assignment.setStepNumber(1);
        assignment.setAssignedTo(assignedTo);
        assignment.setStatus("in_progress");
        assignment.setStartDate(LocalDateTime.now());

        WorkflowAssignment savedAssignment = assignmentRepository.save(assignment);

        // Registrar a transição (criação do fluxo)
        WorkflowTransition transition = new WorkflowTransition();
        transition.setWorkflow(savedWorkflow);
        transition.setFromStep(null);
        transition.setToStep(1);
        transition.setFromStatus(null);
        transition.setToStatus("in_progress");
        transition.setFromUser(null);
        transition.setToUser(assignedTo);
        transition.setComments("Fluxo criado");
        transition.setTransitionType("creation");
        transition.setCreatedBy(createdBy);

        transitionRepository.save(transition);

        // Enviar notificação se o destinatário for diferente do criador
        if (!assignedTo.getId().equals(createdBy.getId())) {
            notificationService.createAssignmentNotification(
                    savedWorkflow.getId(),
                    assignedTo.getId(),
                    1,
                    stepName
            );
        }

        logger.info("Fluxo de trabalho criado com sucesso: {}", savedWorkflow.getId());
        return mapToWorkflowDto(savedWorkflow);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDto getWorkflowById(UUID workflowId) {
        logger.info("Buscando fluxo de trabalho por ID: {}", workflowId);

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        return mapToWorkflowDto(workflow);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> getAllWorkflows(Pageable pageable) {
        logger.info("Buscando todos os fluxos de trabalho com paginação e ordenação alfabética");

        // Criar um novo Pageable com ordenação por título
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.ASC, "title")
        );

        Page<Workflow> workflows = workflowRepository.findAll(sortedPageable);
        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> getWorkflowsByStatus(String status, Pageable pageable) {
        logger.info("Buscando fluxos de trabalho com status: {}", status);

        Page<Workflow> workflows = workflowRepository.findByStatus(status, pageable);

        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> getWorkflowsByCustomStatus(UUID statusId, Pageable pageable) {
        logger.info("Buscando fluxos de trabalho com status personalizado: {}", statusId);

        Page<Workflow> workflows = workflowRepository.findByCustomStatusId(statusId, pageable);

        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> getWorkflowsByTeam(UUID teamId, Pageable pageable) {
        logger.info("Buscando fluxos de trabalho da equipe: {}", teamId);

        Page<Workflow> workflows = workflowRepository.findByTeamId(teamId, pageable);

        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> getWorkflowsByStepNumber(int stepNumber, Pageable pageable) {
        logger.info("Buscando fluxos de trabalho na etapa: {}", stepNumber);

        Page<Workflow> workflows = workflowRepository.findByCurrentStep(stepNumber, pageable);

        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Integer> getWorkflowCountByCustomStatus(UUID templateId) {
        logger.info("Contando fluxos de trabalho por status personalizado para o template: {}", templateId);

        List<Object[]> results = workflowRepository.countByCustomStatusInTemplate(templateId);

        Map<String, Integer> counts = new HashMap<>();
        for (Object[] result : results) {
            String statusName = (String) result[0];
            String statusColor = (String) result[1];
            Integer count = ((Number) result[2]).intValue();

            counts.put(statusName, count);
        }

        return counts;
    }

    @Transactional(readOnly = true)
    public List<WorkflowSummaryDto> getWorkflowsAssignedToUser(UUID userId) {
        logger.info("Buscando fluxos de trabalho atribuídos ao usuário: {}", userId);

        List<Workflow> workflows = workflowRepository.findWorkflowsAssignedToUserOrderByTitle(userId);

        return workflows.stream()
                .map(this::mapToWorkflowSummaryDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> getVisibleWorkflows(UUID userId, Pageable pageable) {
        logger.info("Buscando fluxos de trabalho visíveis para o usuário: {}", userId);

        Page<Workflow> workflows = workflowRepository.findVisibleWorkflows(userId, pageable);

        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> getWorkflowsByTemplate(UUID templateId, Pageable pageable) {
        logger.info("Buscando fluxos de trabalho do template: {}", templateId);

        // Verificar se o template existe
        templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        // Consultar os workflows com o template especificado
        Page<Workflow> workflows = workflowRepository.findByTemplateId(templateId, pageable);

        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> getWorkflowsByTemplateAndStatus(UUID templateId, String status, Pageable pageable) {
        logger.info("Buscando fluxos de trabalho do template: {} com status: {}", templateId, status);

        // Verificar se o template existe
        templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        // Consultar os workflows com o template e status especificados
        Page<Workflow> workflows = workflowRepository.findByTemplateIdAndStatus(templateId, status, pageable);

        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowSummaryDto> getWorkflowsAssignedToUserByTemplate(UUID userId, UUID templateId) {
        logger.info("Buscando fluxos de trabalho atribuídos ao usuário: {} filtrados pelo template: {}", userId, templateId);

        // Verificar se o template existe
        templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        List<Workflow> workflows = workflowRepository.findWorkflowsAssignedToUserByTemplateOrderByTitle(userId, templateId);

        return workflows.stream()
                .map(this::mapToWorkflowSummaryDto)
                .collect(Collectors.toList());
    }


    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> searchWorkflows(String searchTerm, Pageable pageable) {
        logger.info("Pesquisando fluxos de trabalho com termo: {}", searchTerm);

        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllWorkflows(pageable);
        }

        Page<Workflow> workflows = workflowRepository.findByTitleContaining(searchTerm.trim(), pageable);
        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> searchWorkflowsByStatus(String searchTerm, String status, Pageable pageable) {
        logger.info("Pesquisando fluxos de trabalho com termo: {} e status: {}", searchTerm, status);

        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getWorkflowsByStatus(status, pageable);
        }

        Page<Workflow> workflows = workflowRepository.findByTitleContainingAndStatus(
                searchTerm.trim(), status, pageable);
        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> searchWorkflowsByTemplate(String searchTerm, UUID templateId, Pageable pageable) {
        logger.info("Pesquisando fluxos de trabalho com termo: {} do template: {}", searchTerm, templateId);

        // Verificar se o template existe
        templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getWorkflowsByTemplate(templateId, pageable);
        }

        Page<Workflow> workflows = workflowRepository.findByTitleContainingAndTemplateId(
                searchTerm.trim(), templateId, pageable);
        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> searchWorkflowsByTemplateAndStatus(
            String searchTerm, UUID templateId, String status, Pageable pageable) {
        logger.info("Pesquisando fluxos de trabalho com termo: {} do template: {} com status: {}",
                searchTerm, templateId, status);

        // Verificar se o template existe
        templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getWorkflowsByTemplateAndStatus(templateId, status, pageable);
        }

        Page<Workflow> workflows = workflowRepository.findByTitleContainingAndTemplateIdAndStatus(
                searchTerm.trim(), templateId, status, pageable);
        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowSummaryDto> searchWorkflowsAssignedToUser(UUID userId, String searchTerm) {
        logger.info("Pesquisando fluxos de trabalho atribuídos ao usuário: {} com termo: {}", userId, searchTerm);

        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getWorkflowsAssignedToUser(userId);
        }

        List<Workflow> workflows = workflowRepository.findWorkflowsAssignedToUserByTitleContainingOrderByTitle(
                userId, searchTerm.trim());

        return workflows.stream()
                .map(this::mapToWorkflowSummaryDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> getAllWorkflowsGroupedByStatus(Pageable pageable) {
        logger.info("Buscando todos os fluxos de trabalho agrupados por status (incluindo status personalizados)");

        Page<Workflow> workflows = workflowRepository.findAllGroupedByStatusAndCustomStatusOrderByTitle(pageable);
        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> getWorkflowsByTemplateGroupedByStatus(UUID templateId, Pageable pageable) {
        logger.info("Buscando fluxos de trabalho do template {} agrupados por status (incluindo status personalizados)", templateId);

        // Verificar se o template existe
        templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        Page<Workflow> workflows = workflowRepository.findByTemplateIdGroupedByStatusAndCustomStatusOrderByTitle(templateId, pageable);
        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> searchWorkflowsGroupedByStatus(String searchTerm, Pageable pageable) {
        logger.info("Pesquisando fluxos de trabalho agrupados por status (incluindo status personalizados) com termo: {}", searchTerm);

        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllWorkflowsGroupedByStatus(pageable);
        }

        Page<Workflow> workflows = workflowRepository.findByTitleContainingGroupedByStatusAndCustomStatusOrderByTitle(searchTerm.trim(), pageable);
        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowSummaryDto> searchWorkflowsByTemplateGroupedByStatus(String searchTerm, UUID templateId, Pageable pageable) {
        logger.info("Pesquisando fluxos de trabalho do template {} agrupados por status (incluindo status personalizados) com termo: {}", templateId, searchTerm);

        // Verificar se o template existe
        templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getWorkflowsByTemplateGroupedByStatus(templateId, pageable);
        }

        Page<Workflow> workflows = workflowRepository.findByTitleContainingAndTemplateIdGroupedByStatusAndCustomStatusOrderByTitle(
                searchTerm.trim(), templateId, pageable);
        return workflows.map(this::mapToWorkflowSummaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowSummaryDto> searchWorkflowsAssignedToUserByTemplate(
            UUID userId, UUID templateId, String searchTerm) {
        logger.info("Pesquisando fluxos de trabalho atribuídos ao usuário: {} filtrados pelo template: {} com termo: {}",
                userId, templateId, searchTerm);

        // Verificar se o template existe
        templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getWorkflowsAssignedToUserByTemplate(userId, templateId);
        }

        List<Workflow> workflows = workflowRepository.findWorkflowsAssignedToUserByTemplateAndTitleContainingOrderByTitle(
                userId, templateId, searchTerm.trim());

        return workflows.stream()
                .map(this::mapToWorkflowSummaryDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WorkflowDto advanceToNextStep(UUID workflowId, UUID assignToId, String comments) {
        logger.info("Avançando fluxo {} para a próxima etapa, atribuindo para usuário: {}", workflowId, assignToId);

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        // Verificar se o fluxo está em andamento
        if (!"in_progress".equals(workflow.getStatus())) {
            throw new IllegalStateException("Não é possível avançar um fluxo que não está em andamento.");
        }

        // Buscar a atribuição atual
        WorkflowAssignment currentAssignment = assignmentRepository.findByWorkflowIdAndStepNumber(
                        workflowId, workflow.getCurrentStep())
                .orElseThrow(() -> new IllegalStateException("Não foi encontrada uma atribuição para a etapa atual."));

        // Marcar a etapa atual como concluída
        currentAssignment.setStatus("completed");
        currentAssignment.setCompletionDate(LocalDateTime.now());
        assignmentRepository.save(currentAssignment);

        // Buscar total de etapas no template
        int totalSteps = stepRepository.countStepsByTemplateId(workflow.getTemplate().getId());

        // Verificar se esta é a última etapa
        if (workflow.getCurrentStep() >= totalSteps) {
            // Se for a última etapa, marcar o fluxo como concluído
            workflow.setStatus("completed");
            workflow.setProgressPercentage(100);

            // Registrar a transição
            WorkflowTransition transition = new WorkflowTransition();
            transition.setWorkflow(workflow);
            transition.setFromStatus("in_progress");
            transition.setToStatus("completed");
            transition.setFromStep(workflow.getCurrentStep());
            transition.setToStep(workflow.getCurrentStep());
            transition.setFromUser(currentAssignment.getAssignedTo());
            transition.setToUser(null);
            transition.setComments(comments);
            transition.setTransitionType("status_change");
            transition.setCreatedBy(currentAssignment.getAssignedTo());

            transitionRepository.save(transition);

            // Enviar notificação ao criador do fluxo
            notificationService.createStatusChangeNotification(
                    workflow.getId(),
                    workflow.getCreatedBy().getId(),
                    "in_progress",
                    "completed"
            );

            Workflow updatedWorkflow = workflowRepository.save(workflow);
            return mapToWorkflowDto(updatedWorkflow);
        }

        // Avançar para a próxima etapa
        int nextStepNumber = workflow.getCurrentStep() + 1;
        workflow.setCurrentStep(nextStepNumber);

        // Em vez de usar a coleção lazy do workflow, buscar as atribuições diretamente
        List<WorkflowAssignment> assignments = assignmentRepository.findByWorkflowIdOrderByStepNumber(workflowId);

        // Contar atribuições completadas de forma segura
        int completedSteps = 0;
        for (WorkflowAssignment assignment : assignments) {
            if ("completed".equals(assignment.getStatus())) {
                completedSteps++;
            }
        }

        // Ajuste do progresso baseado em etapas completadas
        int progressPercentage = totalSteps > 0
                ? (int) Math.floor((double) completedSteps / totalSteps * 100)
                : 0;

        workflow.setProgressPercentage(progressPercentage);

        // Buscar usuário para atribuição
        User assignedTo = userRepository.findById(assignToId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + assignToId));

        // Buscar o nome da próxima etapa
        String nextStepName = stepRepository.findStepNameByTemplateIdAndStepOrder(
                workflow.getTemplate().getId(), nextStepNumber);

        // Criar nova atribuição
        WorkflowAssignment newAssignment = new WorkflowAssignment();
        newAssignment.setWorkflow(workflow);
        newAssignment.setStepNumber(nextStepNumber);
        newAssignment.setAssignedTo(assignedTo);
        newAssignment.setStatus("in_progress");
        newAssignment.setStartDate(LocalDateTime.now());

        assignmentRepository.save(newAssignment);

        // Registrar a transição
        WorkflowTransition transition = new WorkflowTransition();
        transition.setWorkflow(workflow);
        transition.setFromStep(workflow.getCurrentStep() - 1);
        transition.setToStep(workflow.getCurrentStep());
        transition.setFromStatus("in_progress");
        transition.setToStatus("in_progress");
        transition.setFromUser(currentAssignment.getAssignedTo());
        transition.setToUser(assignedTo);
        transition.setComments(comments);
        transition.setTransitionType("step_change");
        transition.setCreatedBy(currentAssignment.getAssignedTo());

        transitionRepository.save(transition);

        // Enviar notificação ao novo responsável
        notificationService.createAssignmentNotification(
                workflow.getId(),
                assignedTo.getId(),
                nextStepNumber,
                nextStepName
        );

        Workflow updatedWorkflow = workflowRepository.save(workflow);
        logger.info("Fluxo avançado para a etapa {}", nextStepNumber);

        return mapToWorkflowDto(updatedWorkflow);
    }

    @Override
    @Transactional
    public WorkflowDto updateWorkflowStatus(UUID workflowId, String newStatus, String comments) {
        logger.info("Atualizando status do fluxo {} para: {}", workflowId, newStatus);

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        // Verificar se o status é válido
        if (!Arrays.asList("in_progress", "paused", "completed", "canceled", "archived").contains(newStatus)) {
            throw new IllegalArgumentException("Status inválido: " + newStatus);
        }

        // Verificar se o fluxo já está no status desejado
        if (workflow.getStatus().equals(newStatus)) {
            logger.info("O fluxo já está no status {}", newStatus);
            return mapToWorkflowDto(workflow);
        }

        String oldStatus = workflow.getStatus();
        workflow.setStatus(newStatus);

        // Buscar total de etapas no template
        int totalSteps = stepRepository.countStepsByTemplateId(workflow.getTemplate().getId());

        // Se estiver sendo concluído, definir progresso como 100%
        if ("completed".equals(newStatus)) {
            workflow.setProgressPercentage(100);
        } else if ("in_progress".equals(newStatus)) {
            // Se estiver sendo retomado, recalcular com base nas etapas concluídas
            // Buscar atribuições diretamente do repositório para evitar ConcurrentModificationException
            List<WorkflowAssignment> assignments = assignmentRepository.findByWorkflowIdOrderByStepNumber(workflowId);

            // Contar atribuições completadas de forma segura
            int completedSteps = 0;
            for (WorkflowAssignment assignment : assignments) {
                if ("completed".equals(assignment.getStatus())) {
                    completedSteps++;
                }
            }

            // Ajuste do progresso baseado em etapas completadas
            int progressPercentage = totalSteps > 0
                    ? (int) Math.floor((double) completedSteps / totalSteps * 100)
                    : 0;

            workflow.setProgressPercentage(progressPercentage);
        }
        // Para outros status (pausado, cancelado, arquivado), manter o percentual atual

        // Buscar a atribuição atual, se houver
        Optional<WorkflowAssignment> currentAssignmentOpt = assignmentRepository.findByWorkflowIdAndStepNumber(
                workflowId, workflow.getCurrentStep());

        User fromUser = null;
        if (currentAssignmentOpt.isPresent()) {
            WorkflowAssignment currentAssignment = currentAssignmentOpt.get();
            fromUser = currentAssignment.getAssignedTo();

            // Se o fluxo estiver sendo concluído ou cancelado, finalizar a atribuição atual
            if ("completed".equals(newStatus) || "canceled".equals(newStatus)) {
                currentAssignment.setStatus("completed");
                currentAssignment.setCompletionDate(LocalDateTime.now());
                assignmentRepository.save(currentAssignment);
            }
        }

        // Registrar a transição
        WorkflowTransition transition = new WorkflowTransition();
        transition.setWorkflow(workflow);
        transition.setFromStatus(oldStatus);
        transition.setToStatus(newStatus);
        transition.setFromStep(workflow.getCurrentStep());
        transition.setToStep(workflow.getCurrentStep());
        transition.setFromUser(fromUser);
        transition.setToUser(fromUser);
        transition.setComments(comments);
        transition.setTransitionType("status_change");
        transition.setCreatedBy(fromUser != null ? fromUser : workflow.getCreatedBy());

        transitionRepository.save(transition);

        // Enviar notificação ao criador do fluxo
        notificationService.createStatusChangeNotification(
                workflow.getId(),
                workflow.getCreatedBy().getId(),
                oldStatus,
                newStatus
        );

        // Se houver responsável atual e for diferente do criador, notificar também
        if (fromUser != null && !fromUser.getId().equals(workflow.getCreatedBy().getId())) {
            notificationService.createStatusChangeNotification(
                    workflow.getId(),
                    fromUser.getId(),
                    oldStatus,
                    newStatus
            );
        }

        Workflow updatedWorkflow = workflowRepository.save(workflow);
        logger.info("Status do fluxo atualizado para: {}", newStatus);

        return mapToWorkflowDto(updatedWorkflow);
    }

    @Override
    @Transactional
    public WorkflowDto updateWorkflowCustomStatus(UUID workflowId, UUID statusId, String comments) {
        logger.info("Atualizando status personalizado do fluxo {} para: {}", workflowId, statusId);

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        // Verificar se o fluxo tem um template de status
        if (workflow.getStatusTemplate() == null) {
            throw new IllegalStateException("Este fluxo não possui um template de status associado.");
        }

        // Buscar o novo status
        WorkflowStatusItem newStatus = statusItemRepository.findById(statusId)
                .orElseThrow(() -> new ResourceNotFoundException("Status não encontrado com o ID: " + statusId));

        // Verificar se o status pertence ao template do fluxo
        if (!newStatus.getTemplate().getId().equals(workflow.getStatusTemplate().getId())) {
            throw new IllegalArgumentException("O status não pertence ao template de status do fluxo.");
        }

        // Guardar o status anterior para o histórico
        WorkflowStatusItem oldStatus = workflow.getCustomStatus();

        // Atualizar o status
        workflow.setCustomStatus(newStatus);

        // Se o status for final, atualizar o status padrão do fluxo
        if (newStatus.isFinal()) {
            if (newStatus.getName().toLowerCase().contains("conclu")) {
                workflow.setStatus("completed");
            } else if (newStatus.getName().toLowerCase().contains("cancel")) {
                workflow.setStatus("canceled");
            }
        }

        // Registrar a transição
        WorkflowTransition transition = new WorkflowTransition();
        transition.setWorkflow(workflow);
        transition.setFromStatus(oldStatus != null ? oldStatus.getName() : null);
        transition.setToStatus(newStatus.getName());
        transition.setFromStep(workflow.getCurrentStep());
        transition.setToStep(workflow.getCurrentStep());
        transition.setComments(comments);
        transition.setTransitionType("custom_status_change");

        // Buscar o usuário atual para o histórico
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        transition.setCreatedBy(user);
        transitionRepository.save(transition);

        // Salvar o fluxo atualizado
        Workflow updatedWorkflow = workflowRepository.save(workflow);

        return mapToWorkflowDto(updatedWorkflow);
    }

    @Override
    @Transactional
    public WorkflowDto updateWorkflow(UUID workflowId, WorkflowCreateDto workflowDto) {
        logger.info("Atualizando fluxo de trabalho: {}", workflowId);

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        // Verificar se o fluxo pode ser modificado
        if (Arrays.asList("completed", "canceled", "archived").contains(workflow.getStatus())) {
            throw new IllegalStateException("Não é possível modificar um fluxo que está concluído, cancelado ou arquivado.");
        }

        // Atualizar os campos básicos
        workflow.setTitle(workflowDto.getTitle());
        workflow.setDescription(workflowDto.getDescription());
        workflow.setPriority(workflowDto.getPriority());
        workflow.setVisibility(workflowDto.getVisibility());
        workflow.setDeadline(workflowDto.getDeadline());

        // Atualizar a equipe, se fornecida
        if (workflowDto.getTeamId() != null) {
            Equipe team = equipeRepository.findById(workflowDto.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Equipe não encontrada com o ID: " + workflowDto.getTeamId()));
            workflow.setTeam(team);
        } else {
            workflow.setTeam(null);
        }

        Workflow updatedWorkflow = workflowRepository.save(workflow);
        logger.info("Fluxo de trabalho atualizado com sucesso: {}", updatedWorkflow.getId());

        return mapToWorkflowDto(updatedWorkflow);
    }

    @Override
    @Transactional
    public WorkflowAssignmentDto assignStep(UUID workflowId, int stepNumber, UUID assignToId, String comments) {
        logger.info("Atribuindo etapa {} do fluxo {} para usuário: {}", stepNumber, workflowId, assignToId);

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        // Verificar se o fluxo está em andamento
        if (!"in_progress".equals(workflow.getStatus())) {
            throw new IllegalStateException("Não é possível atribuir etapas de um fluxo que não está em andamento.");
        }

        // Verificar se a etapa é válida
        int totalSteps = stepRepository.countStepsByTemplateId(workflow.getTemplate().getId());
        if (stepNumber < 1 || stepNumber > totalSteps) {
            throw new IllegalArgumentException("Número de etapa inválido: " + stepNumber);
        }

        // Verificar se é a etapa atual
        if (stepNumber != workflow.getCurrentStep()) {
            throw new IllegalStateException("Só é possível atribuir a etapa atual do fluxo.");
        }

        // Buscar a atribuição atual
        WorkflowAssignment currentAssignment = assignmentRepository.findByWorkflowIdAndStepNumber(
                        workflowId, stepNumber)
                .orElseThrow(() -> new IllegalStateException("Não foi encontrada uma atribuição para a etapa atual."));

        // Verificar se já está atribuída ao mesmo usuário
        if (currentAssignment.getAssignedTo().getId().equals(assignToId)) {
            logger.info("A etapa já está atribuída ao usuário: {}", assignToId);
            return mapToAssignmentDto(currentAssignment);
        }

        // Buscar usuário para atribuição
        User assignedTo = userRepository.findById(assignToId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + assignToId));

        // Registrar quem era o responsável anterior
        User previousAssignee = currentAssignment.getAssignedTo();

        // Atualizar a atribuição
        currentAssignment.setAssignedTo(assignedTo);

        // Registrar a transição
        WorkflowTransition transition = new WorkflowTransition();
        transition.setWorkflow(workflow);
        transition.setFromStep(stepNumber);
        transition.setToStep(stepNumber);
        transition.setFromStatus(currentAssignment.getStatus());
        transition.setToStatus(currentAssignment.getStatus());
        transition.setFromUser(previousAssignee);
        transition.setToUser(assignedTo);
        transition.setComments(comments);
        transition.setTransitionType("assignment");
        transition.setCreatedBy(previousAssignee);

        transitionRepository.save(transition);

        // Enviar notificação ao novo responsável
        String stepName = stepRepository.findStepNameByTemplateIdAndStepOrder(
                workflow.getTemplate().getId(), stepNumber);

        notificationService.createAssignmentNotification(
                workflow.getId(),
                assignedTo.getId(),
                stepNumber,
                stepName
        );

        WorkflowAssignment updatedAssignment = assignmentRepository.save(currentAssignment);
        logger.info("Etapa atribuída com sucesso ao usuário: {}", assignToId);

        return mapToAssignmentDto(updatedAssignment);
    }

    @Override
    @Transactional
    public WorkflowAssignmentDto completeStep(UUID workflowId, int stepNumber, String comments) {
        logger.info("Concluindo etapa {} do fluxo {}", stepNumber, workflowId);

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        // Verificar se o fluxo está em andamento
        if (!"in_progress".equals(workflow.getStatus())) {
            throw new IllegalStateException("Não é possível concluir etapas de um fluxo que não está em andamento.");
        }

        // Verificar se a etapa é válida
        int totalSteps = stepRepository.countStepsByTemplateId(workflow.getTemplate().getId());
        if (stepNumber < 1 || stepNumber > totalSteps) {
            throw new IllegalArgumentException("Número de etapa inválido: " + stepNumber);
        }

        // Verificar se é a etapa atual
        if (stepNumber != workflow.getCurrentStep()) {
            throw new IllegalStateException("Só é possível concluir a etapa atual do fluxo.");
        }

        // Buscar a atribuição atual
        WorkflowAssignment currentAssignment = assignmentRepository.findByWorkflowIdAndStepNumber(
                        workflowId, stepNumber)
                .orElseThrow(() -> new IllegalStateException("Não foi encontrada uma atribuição para a etapa atual."));

        // Verificar se já está concluída
        if ("completed".equals(currentAssignment.getStatus())) {
            logger.info("A etapa já está concluída");
            return mapToAssignmentDto(currentAssignment);
        }

        // Marcar como concluída
        currentAssignment.setStatus("completed");
        currentAssignment.setCompletionDate(LocalDateTime.now());

        WorkflowAssignment updatedAssignment = assignmentRepository.save(currentAssignment);
        logger.info("Etapa concluída com sucesso");

        return mapToAssignmentDto(updatedAssignment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowTransitionDto> getWorkflowTransitions(UUID workflowId) {
        logger.info("Buscando histórico de transições do fluxo: {}", workflowId);

        List<WorkflowTransition> transitions = transitionRepository.findByWorkflowIdOrderByCreatedAtDesc(workflowId);

        return transitions.stream()
                .map(this::mapToTransitionDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowStatsDto getGeneralWorkflowStatsByTemplate(UUID templateId) {
        logger.info("Obtendo estatísticas gerais de fluxos para o template: {}", templateId);

        // Verificar se o template existe
        templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template não encontrado com o ID: " + templateId));

        WorkflowStatsDto stats = new WorkflowStatsDto();

        // Contagens por status
        stats.setInProgressCount(workflowRepository.countByTemplateIdAndStatus(templateId, "in_progress"));
        stats.setPausedCount(workflowRepository.countByTemplateIdAndStatus(templateId, "paused"));
        stats.setCompletedCount(workflowRepository.countByTemplateIdAndStatus(templateId, "completed"));
        stats.setCanceledCount(workflowRepository.countByTemplateIdAndStatus(templateId, "canceled"));
        stats.setArchivedCount(workflowRepository.countByTemplateIdAndStatus(templateId, "archived"));

        stats.setTotalWorkflows(stats.getInProgressCount() + stats.getPausedCount() +
                stats.getCompletedCount() + stats.getCanceledCount() + stats.getArchivedCount());

        // Fluxos atrasados
        LocalDateTime now = LocalDateTime.now();
        stats.setOverdueCount(workflowRepository.countOverdueWorkflowsByTemplateId(templateId, now));

        return stats;
    }


    @Override
    @Transactional(readOnly = true)
    public WorkflowStatsDto getGeneralWorkflowStatsByStatusTemplate(UUID statusTemplateId) {
        logger.info("Obtendo estatísticas gerais de fluxos para o template de status: {}", statusTemplateId);

        // Verificar se o template de status existe
        statusTemplateRepository.findById(statusTemplateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template de status não encontrado com o ID: " + statusTemplateId));

        WorkflowStatsDto stats = new WorkflowStatsDto();

        // Contagens por status
        stats.setInProgressCount(workflowRepository.countByStatusTemplateIdAndStatus(statusTemplateId, "in_progress"));
        stats.setPausedCount(workflowRepository.countByStatusTemplateIdAndStatus(statusTemplateId, "paused"));
        stats.setCompletedCount(workflowRepository.countByStatusTemplateIdAndStatus(statusTemplateId, "completed"));
        stats.setCanceledCount(workflowRepository.countByStatusTemplateIdAndStatus(statusTemplateId, "canceled"));
        stats.setArchivedCount(workflowRepository.countByStatusTemplateIdAndStatus(statusTemplateId, "archived"));

        stats.setTotalWorkflows(stats.getInProgressCount() + stats.getPausedCount() +
                stats.getCompletedCount() + stats.getCanceledCount() + stats.getArchivedCount());

        // Fluxos atrasados
        LocalDateTime now = LocalDateTime.now();
        stats.setOverdueCount(workflowRepository.countOverdueWorkflowsByStatusTemplateId(statusTemplateId, now));

        return stats;
    }

    @Override
    @Transactional
    public WorkflowDto archiveWorkflow(UUID workflowId) {
        logger.info("Arquivando fluxo de trabalho: {}", workflowId);

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        // Verificar se o fluxo já está arquivado
        if ("archived".equals(workflow.getStatus())) {
            logger.info("O fluxo já está arquivado");
            return mapToWorkflowDto(workflow);
        }

        // Verificar se o fluxo pode ser arquivado (deve estar concluído ou cancelado)
        if (!Arrays.asList("completed", "canceled").contains(workflow.getStatus())) {
            throw new IllegalStateException("Só é possível arquivar fluxos concluídos ou cancelados.");
        }

        String oldStatus = workflow.getStatus();
        workflow.setStatus("archived");

        // Registrar a transição
        WorkflowTransition transition = new WorkflowTransition();
        transition.setWorkflow(workflow);
        transition.setFromStatus(oldStatus);
        transition.setToStatus("archived");
        transition.setFromStep(workflow.getCurrentStep());
        transition.setToStep(workflow.getCurrentStep());
        transition.setComments("Fluxo arquivado");
        transition.setTransitionType("status_change");
        transition.setCreatedBy(workflow.getCreatedBy());

        transitionRepository.save(transition);

        Workflow updatedWorkflow = workflowRepository.save(workflow);
        logger.info("Fluxo arquivado com sucesso: {}", workflowId);

        return mapToWorkflowDto(updatedWorkflow);
    }

    @Override
    @Transactional
    public WorkflowDto restoreWorkflow(UUID workflowId) {
        logger.info("Restaurando fluxo de trabalho: {}", workflowId);

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        // Verificar se o fluxo está arquivado
        if (!"archived".equals(workflow.getStatus())) {
            throw new IllegalStateException("Só é possível restaurar fluxos arquivados.");
        }

        // Restaurar o status anterior (buscar do histórico)
        List<WorkflowTransition> transitions = transitionRepository.findByWorkflowIdAndTransitionType(
                workflowId, "status_change");

        String previousStatus = "completed"; // Status padrão se não for possível determinar o anterior

        if (!transitions.isEmpty()) {
            // Ordenar do mais recente para o mais antigo
            transitions.sort(Comparator.comparing(WorkflowTransition::getCreatedAt).reversed());

            // Buscar a transição para arquivamento
            for (WorkflowTransition transition : transitions) {
                if ("archived".equals(transition.getToStatus())) {
                    previousStatus = transition.getFromStatus();
                    break;
                }
            }
        }

        workflow.setStatus(previousStatus);

        // Registrar a transição
        WorkflowTransition transition = new WorkflowTransition();
        transition.setWorkflow(workflow);
        transition.setFromStatus("archived");
        transition.setToStatus(previousStatus);
        transition.setFromStep(workflow.getCurrentStep());
        transition.setToStep(workflow.getCurrentStep());
        transition.setComments("Fluxo restaurado");
        transition.setTransitionType("status_change");
        transition.setCreatedBy(workflow.getCreatedBy());

        transitionRepository.save(transition);

        Workflow updatedWorkflow = workflowRepository.save(workflow);
        logger.info("Fluxo restaurado com sucesso para o status: {}", previousStatus);

        return mapToWorkflowDto(updatedWorkflow);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserModifyWorkflow(UUID userId, UUID workflowId) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        // Verificar se o usuário é o criador do fluxo
        if (workflow.getCreatedBy().getId().equals(userId)) {
            return true;
        }

        // Verificar se o usuário é o responsável pela etapa atual
        boolean isCurrentAssignee = assignmentRepository.findByWorkflowIdAndStepNumber(workflowId, workflow.getCurrentStep())
                .map(assignment -> assignment.getAssignedTo().getId().equals(userId))
                .orElse(false);

        if (isCurrentAssignee) {
            return true;
        }

        List<String> roles = userRepository.findRoleNamesByUserId(userId);
        return roles.stream().anyMatch(role ->
                role.equals("EDITOR") || role.equals("ROLE_EDITOR") || role.equals("ADMIN") || role.equals("ROLE_ADMIN"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowSummaryDto> findOverdueWorkflows() {
        logger.info("Buscando fluxos de trabalho com prazo vencido");

        LocalDateTime now = LocalDateTime.now();
        List<Workflow> workflows = workflowRepository.findOverdueWorkflows(now);

        return workflows.stream()
                .map(this::mapToWorkflowSummaryDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowSummaryDto> findWorkflowsNearDeadline(int daysThreshold) {
        logger.info("Buscando fluxos de trabalho com prazo próximo do vencimento (limite: {} dias)", daysThreshold);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thresholdDate = now.plusDays(daysThreshold);

        List<Workflow> workflows = workflowRepository.findWorkflowsWithDeadlineBetween(now, thresholdDate);

        return workflows.stream()
                .map(this::mapToWorkflowSummaryDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowStatsDto getUserWorkflowStats(UUID userId) {
        logger.info("Obtendo estatísticas de fluxos para o usuário: {}", userId);

        // Verificar se o usuário existe
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + userId));

        WorkflowStatsDto stats = new WorkflowStatsDto();

        // Contagens por status
        stats.setInProgressCount(workflowRepository.countByCreatedByIdAndStatus(userId, "in_progress"));
        stats.setPausedCount(workflowRepository.countByCreatedByIdAndStatus(userId, "paused"));
        stats.setCompletedCount(workflowRepository.countByCreatedByIdAndStatus(userId, "completed"));
        stats.setCanceledCount(workflowRepository.countByCreatedByIdAndStatus(userId, "canceled"));
        stats.setArchivedCount(workflowRepository.countByCreatedByIdAndStatus(userId, "archived"));

        stats.setTotalWorkflows(stats.getInProgressCount() + stats.getPausedCount() +
                stats.getCompletedCount() + stats.getCanceledCount() + stats.getArchivedCount());

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowStatsDto getGeneralWorkflowStats() {
        logger.info("Obtendo estatísticas gerais de fluxos");

        WorkflowStatsDto stats = new WorkflowStatsDto();

        // Contagens por status
        stats.setInProgressCount(workflowRepository.countByStatus("in_progress"));
        stats.setPausedCount(workflowRepository.countByStatus("paused"));
        stats.setCompletedCount(workflowRepository.countByStatus("completed"));
        stats.setCanceledCount(workflowRepository.countByStatus("canceled"));
        stats.setArchivedCount(workflowRepository.countByStatus("archived"));

        stats.setTotalWorkflows(stats.getInProgressCount() + stats.getPausedCount() +
                stats.getCompletedCount() + stats.getCanceledCount() + stats.getArchivedCount());

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserWorkloadDto> getUsersWorkload() {
        logger.info("Obtendo carga de trabalho dos usuários");

        // Buscar todos os usuários ativos
        List<User> users = userRepository.findAll().stream()
                .filter(User::isActive)
                .collect(Collectors.toList());

        List<UserWorkloadDto> workloads = new ArrayList<>();

        for (User user : users) {
            UserWorkloadDto workload = new UserWorkloadDto();
            workload.setUserId(user.getId());
            workload.setUserName(user.getFullName());
            workload.setUserEmail(user.getEmail());
            workload.setProfileImage(user.getProfileImage());

            // Buscar atribuições ativas do usuário
            List<WorkflowAssignment> activeAssignments = assignmentRepository.findByAssignedToIdAndStatus(
                    user.getId(), "in_progress");

            workload.setActiveAssignmentsCount(activeAssignments.size());

            // Buscar atribuições pendentes
            List<WorkflowAssignment> pendingAssignments = assignmentRepository.findByAssignedToIdAndStatus(
                    user.getId(), "pending");

            workload.setPendingAssignmentsCount(pendingAssignments.size());
            workload.setTotalAssignmentsCount(activeAssignments.size() + pendingAssignments.size());

            // Calcular atribuições com prazo vencido
            LocalDateTime now = LocalDateTime.now();
            int overdueCount = 0;

            for (WorkflowAssignment assignment : activeAssignments) {
                if (assignment.getWorkflow().getDeadline() != null &&
                        assignment.getWorkflow().getDeadline().isBefore(now)) {
                    overdueCount++;
                }
            }

            workload.setOverdueAssignmentsCount(overdueCount);

            // Calcular porcentagem de carga de trabalho
            double workloadPercentage = ((double) workload.getActiveAssignmentsCount() / WORKLOAD_THRESHOLD) * 100;
            workload.setWorkloadPercentage(Math.min(workloadPercentage, 100)); // Máximo de 100%

            // Determinar se está sobrecarregado
            workload.setOverloaded(workload.getActiveAssignmentsCount() > WORKLOAD_THRESHOLD);

            // Mapear atribuições ativas
            workload.setActiveAssignments(activeAssignments.stream()
                    .map(this::mapToAssignmentDto)
                    .collect(Collectors.toList()));

            workloads.add(workload);
        }

        // Ordenar por carga de trabalho (mais sobrecarregados primeiro)
        workloads.sort(Comparator.comparing(UserWorkloadDto::getWorkloadPercentage).reversed());

        return workloads;
    }

    /**
     * Mapeia um Workflow para um WorkflowDto
     */
    private WorkflowDto mapToWorkflowDto(Workflow workflow) {
        WorkflowDto dto = new WorkflowDto();
        dto.setId(workflow.getId());
        dto.setTemplateId(workflow.getTemplate().getId());
        dto.setTemplateName(workflow.getTemplate().getName());
        dto.setTitle(workflow.getTitle());
        dto.setDescription(workflow.getDescription());
        dto.setPriority(workflow.getPriority());
        dto.setStatus(workflow.getStatus());
        dto.setVisibility(workflow.getVisibility());
        dto.setDeadline(workflow.getDeadline());

        if (workflow.getTeam() != null) {
            dto.setTeamId(workflow.getTeam().getId());
            dto.setTeamName(workflow.getTeam().getNome());
        }

        dto.setCreatedById(workflow.getCreatedBy().getId());
        dto.setCreatedByName(workflow.getCreatedBy().getFullName());
        dto.setCurrentStep(workflow.getCurrentStep());

        // Obter número total de passos do template
        int totalSteps = stepRepository.countStepsByTemplateId(workflow.getTemplate().getId());
        dto.setTotalSteps(totalSteps);

        // Verificar o status do workflow para definir o percentual
        if ("completed".equals(workflow.getStatus())) {
            // Se o workflow estiver concluído, percentual é 100%
            dto.setProgressPercentage(100);
        } else {
            // Caso contrário, carregar as atribuições de forma segura e calcular com base nas etapas concluídas
            // Buscar atribuições diretamente do repositório para evitar ConcurrentModificationException
            List<WorkflowAssignment> assignments = assignmentRepository.findByWorkflowIdOrderByStepNumber(workflow.getId());

            // Contar atribuições completadas de forma segura
            int completedSteps = 0;
            for (WorkflowAssignment assignment : assignments) {
                if ("completed".equals(assignment.getStatus())) {
                    completedSteps++;
                }
            }

            // Ajuste do progresso baseado em etapas completadas
            int progressPercentage = totalSteps > 0
                    ? (int) Math.floor((double) completedSteps / totalSteps * 100)
                    : 0;

            dto.setProgressPercentage(progressPercentage);
        }

        dto.setCreatedAt(workflow.getCreatedAt());
        dto.setUpdatedAt(workflow.getUpdatedAt());

        // Calcular se está atrasado e dias restantes
        LocalDateTime now = LocalDateTime.now();
        if (workflow.getDeadline() != null) {
            dto.setOverdue(workflow.getDeadline().isBefore(now));

            // Verificar se está próximo do prazo
            dto.setNearDeadline(!dto.isOverdue() &&
                    ChronoUnit.DAYS.between(now, workflow.getDeadline()) <= NEAR_DEADLINE_DAYS);

            // Calcular dias restantes
            if (dto.isOverdue()) {
                dto.setDaysRemaining(-1 * (int) ChronoUnit.DAYS.between(workflow.getDeadline(), now));
            } else {
                dto.setDaysRemaining((int) ChronoUnit.DAYS.between(now, workflow.getDeadline()));
            }
        }

        // Buscar atribuições de forma segura
        List<WorkflowAssignment> assignments = assignmentRepository.findByWorkflowIdOrderByStepNumber(workflow.getId());
        dto.setAssignments(assignments.stream()
                .map(this::mapToAssignmentDto)
                .collect(Collectors.toList()));

        // Buscar transições de forma segura
        List<WorkflowTransition> transitions = transitionRepository.findByWorkflowIdOrderByCreatedAtDesc(workflow.getId());
        dto.setTransitions(transitions.stream()
                .map(this::mapToTransitionDto)
                .collect(Collectors.toList()));

        if (workflow.getStatusTemplate() != null) {
            dto.setStatusTemplateId(workflow.getStatusTemplate().getId());
            dto.setStatusTemplateName(workflow.getStatusTemplate().getName());
        }

        if (workflow.getCustomStatus() != null) {
            dto.setCustomStatusId(workflow.getCustomStatus().getId());
            dto.setCustomStatusName(workflow.getCustomStatus().getName());
            dto.setCustomStatusColor(workflow.getCustomStatus().getColor());
        }

        return dto;
    }

    /**
     * Mapeia um Workflow para um WorkflowSummaryDto
     */
    private WorkflowSummaryDto mapToWorkflowSummaryDto(Workflow workflow) {
        WorkflowSummaryDto dto = new WorkflowSummaryDto();
        dto.setId(workflow.getId());
        dto.setTitle(workflow.getTitle());
        dto.setTemplateName(workflow.getTemplate().getName());
        dto.setPriority(workflow.getPriority());
        dto.setStatus(workflow.getStatus());
        dto.setDeadline(workflow.getDeadline());

        if (workflow.getTeam() != null) {
            dto.setTeamName(workflow.getTeam().getNome());
        }

        dto.setCreatedByName(workflow.getCreatedBy().getFullName());
        dto.setCurrentStep(workflow.getCurrentStep());

        // Obter número total de passos do template
        int totalSteps = stepRepository.countStepsByTemplateId(workflow.getTemplate().getId());
        dto.setTotalSteps(totalSteps);

        // Verificar o status do workflow para definir o percentual
        if ("completed".equals(workflow.getStatus())) {
            // Se o workflow estiver concluído, percentual é 100%
            dto.setProgressPercentage(100);
        } else {
            // Caso contrário, carregar as atribuições de forma segura e calcular com base nas etapas concluídas
            // Buscar atribuições diretamente do repositório para evitar ConcurrentModificationException
            List<WorkflowAssignment> assignments = assignmentRepository.findByWorkflowIdOrderByStepNumber(workflow.getId());

            // Contar atribuições completadas de forma segura
            int completedSteps = 0;
            for (WorkflowAssignment assignment : assignments) {
                if ("completed".equals(assignment.getStatus())) {
                    completedSteps++;
                }
            }

            // Ajuste do progresso baseado em etapas completadas
            int progressPercentage = totalSteps > 0
                    ? (int) Math.floor((double) completedSteps / totalSteps * 100)
                    : 0;

            dto.setProgressPercentage(progressPercentage);
        }

        // Buscar responsável atual de forma segura, evitando acesso lazy
        Optional<WorkflowAssignment> currentAssignment = assignmentRepository.findByWorkflowIdAndStepNumber(
                workflow.getId(), workflow.getCurrentStep());

        currentAssignment.ifPresent(assignment -> {
            dto.setCurrentAssigneeId(assignment.getAssignedTo().getId());
            dto.setCurrentAssigneeName(assignment.getAssignedTo().getFullName());
        });

        dto.setCreatedAt(workflow.getCreatedAt());
        dto.setUpdatedAt(workflow.getUpdatedAt());

        // Calcular se está atrasado e dias restantes
        LocalDateTime now = LocalDateTime.now();
        if (workflow.getDeadline() != null) {
            dto.setOverdue(workflow.getDeadline().isBefore(now));

            // Verificar se está próximo do prazo
            dto.setNearDeadline(!dto.isOverdue() &&
                    ChronoUnit.DAYS.between(now, workflow.getDeadline()) <= NEAR_DEADLINE_DAYS);

            // Calcular dias restantes
            if (dto.isOverdue()) {
                dto.setDaysRemaining(-1 * (int) ChronoUnit.DAYS.between(workflow.getDeadline(), now));
            } else {
                dto.setDaysRemaining((int) ChronoUnit.DAYS.between(now, workflow.getDeadline()));
            }
        }

        if (workflow.getCustomStatus() != null) {
            dto.setCustomStatusId(workflow.getCustomStatus().getId());
            dto.setCustomStatusName(workflow.getCustomStatus().getName());
            dto.setCustomStatusColor(workflow.getCustomStatus().getColor());
        }

        return dto;
    }

    /**
     * Mapeia um WorkflowAssignment para um WorkflowAssignmentDto
     */
    private WorkflowAssignmentDto mapToAssignmentDto(WorkflowAssignment assignment) {
        WorkflowAssignmentDto dto = new WorkflowAssignmentDto();
        dto.setId(assignment.getId());
        dto.setWorkflowId(assignment.getWorkflow().getId());
        dto.setWorkflowTitle(assignment.getWorkflow().getTitle());
        dto.setStepNumber(assignment.getStepNumber());

        // Buscar o nome da etapa
        String stepName = stepRepository.findStepNameByTemplateIdAndStepOrder(
                assignment.getWorkflow().getTemplate().getId(), assignment.getStepNumber());
        dto.setStepName(stepName != null ? stepName : "Etapa " + assignment.getStepNumber());
        
        String stepDescription = stepRepository.findStepDescriptionByTemplateIdAndStepOrder(
                assignment.getWorkflow().getTemplate().getId(), assignment.getStepNumber()
        );

        dto.setStepDescription(stepDescription);
        dto.setAssignedToId(assignment.getAssignedTo().getId());
        dto.setAssignedToName(assignment.getAssignedTo().getFullName());
        dto.setStatus(assignment.getStatus());
        dto.setStartDate(assignment.getStartDate());
        dto.setCompletionDate(assignment.getCompletionDate());
        dto.setCreatedAt(assignment.getCreatedAt());
        dto.setUpdatedAt(assignment.getUpdatedAt());

        return dto;
    }

    /**
     * Mapeia um WorkflowTransition para um WorkflowTransitionDto
     */
    private WorkflowTransitionDto mapToTransitionDto(WorkflowTransition transition) {
        WorkflowTransitionDto dto = new WorkflowTransitionDto();
        dto.setId(transition.getId());
        dto.setWorkflowId(transition.getWorkflow().getId());
        dto.setFromStep(transition.getFromStep());
        dto.setToStep(transition.getToStep());
        dto.setFromStatus(transition.getFromStatus());
        dto.setToStatus(transition.getToStatus());

        // Obter nomes das etapas
        if (transition.getFromStep() != null) {
            String fromStepName = stepRepository.findStepNameByTemplateIdAndStepOrder(
                    transition.getWorkflow().getTemplate().getId(), transition.getFromStep());
            dto.setFromStepName(fromStepName != null ? fromStepName : "Etapa " + transition.getFromStep());
        }

        if (transition.getToStep() != null) {
            String toStepName = stepRepository.findStepNameByTemplateIdAndStepOrder(
                    transition.getWorkflow().getTemplate().getId(), transition.getToStep());
            dto.setToStepName(toStepName != null ? toStepName : "Etapa " + transition.getToStep());
        }

        if (transition.getFromUser() != null) {
            dto.setFromUserId(transition.getFromUser().getId());
            dto.setFromUserName(transition.getFromUser().getFullName());
        }

        if (transition.getToUser() != null) {
            dto.setToUserId(transition.getToUser().getId());
            dto.setToUserName(transition.getToUser().getFullName());
        }

        dto.setComments(transition.getComments());
        dto.setTransitionType(transition.getTransitionType());
        dto.setCreatedById(transition.getCreatedBy().getId());
        dto.setCreatedByName(transition.getCreatedBy().getFullName());
        dto.setCreatedAt(transition.getCreatedAt());

        return dto;
    }
}