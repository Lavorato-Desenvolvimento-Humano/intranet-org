package com.intranet.backend.service.impl;

import com.intranet.backend.dto.WorkflowNotificationDto;
import com.intranet.backend.exception.ResourceNotFoundException;
import com.intranet.backend.model.User;
import com.intranet.backend.model.Workflow;
import com.intranet.backend.model.WorkflowNotification;
import com.intranet.backend.repository.*;
import com.intranet.backend.service.EmailService;
import com.intranet.backend.service.WorkflowNotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowNotificationServiceImpl implements WorkflowNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowNotificationServiceImpl.class);

    private final WorkflowNotificationRepository notificationRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkflowAssigmentRepository workflowAssigmentRepository;
    private final UserRepository userRepository;
    private final WorkflowTemplateStepRepository stepRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public WorkflowNotificationDto createNotification(
            UUID workflowId,
            UUID userId,
            String title,
            String message,
            String type) {

        logger.info("Criando notificação do tipo {} para usuário {} no fluxo {}", type, userId, workflowId);

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + userId));

        WorkflowNotification notification = new WorkflowNotification();
        notification.setWorkflow(workflow);
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRead(false);

        WorkflowNotification savedNotification = notificationRepository.save(notification);

        // Enviar e-mail de notificação (como implementação futura)
        try {
            // emailService.sendNotificationEmail(user.getEmail(), title, message);
            logger.info("E-mail de notificação enviado para: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Erro ao enviar e-mail de notificação: {}", e.getMessage(), e);
            // Não falhar a operação se o e-mail não puder ser enviado
        }

        return mapToNotificationDto(savedNotification);
    }

    @Override
    @Transactional
    public WorkflowNotificationDto createAssignmentNotification(
            UUID workflowId,
            UUID userId,
            int stepNumber,
            String stepName) {

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        if (stepName == null || stepName.isEmpty()) {
            // Se o nome da etapa não foi fornecido, buscar do banco de dados
            stepName = stepRepository.findStepNameByTemplateIdAndStepOrder(
                    workflow.getTemplate().getId(), stepNumber);

            if (stepName == null) {
                stepName = "Etapa " + stepNumber;
            }
        }

        String title = "Nova atribuição: " + workflow.getTitle();
        String message = "Você foi atribuído à etapa \"" + stepName + "\" no fluxo \"" + workflow.getTitle() + "\".";

        return createNotification(workflowId, userId, title, message, "assignment");
    }

    @Override
    @Transactional
    public WorkflowNotificationDto createDeadlineNotification(
            UUID workflowId,
            UUID userId,
            int daysRemaining) {

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        String title = "Prazo se aproximando: " + workflow.getTitle();
        String message;

        if (daysRemaining <= 0) {
            message = "O prazo do fluxo \"" + workflow.getTitle() + "\" venceu hoje!";
        } else if (daysRemaining == 1) {
            message = "O prazo do fluxo \"" + workflow.getTitle() + "\" vence amanhã.";
        } else {
            message = "O prazo do fluxo \"" + workflow.getTitle() + "\" vence em " + daysRemaining + " dias.";
        }

        return createNotification(workflowId, userId, title, message, "deadline");
    }

    @Override
    @Transactional
    public WorkflowNotificationDto createStatusChangeNotification(
            UUID workflowId,
            UUID userId,
            String oldStatus,
            String newStatus) {

        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Fluxo não encontrado com o ID: " + workflowId));

        String title = "Fluxo " + getStatusDisplayName(newStatus) + ": " + workflow.getTitle();
        String message = "O fluxo \"" + workflow.getTitle() + "\" mudou de " +
                getStatusDisplayName(oldStatus) + " para " + getStatusDisplayName(newStatus) + ".";

        return createNotification(workflowId, userId, title, message, "status_change");
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowNotificationDto> getUserNotifications(UUID userId, Pageable pageable) {
        logger.info("Buscando notificações do usuário: {}", userId);

        Page<WorkflowNotification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return notifications.map(this::mapToNotificationDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowNotificationDto> getUnreadNotifications(UUID userId) {
        logger.info("Buscando notificações não lidas do usuário: {}", userId);

        List<WorkflowNotification> notifications = notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(userId, false);

        return notifications.stream()
                .map(this::mapToNotificationDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowNotificationDto> getUnreadUserNotifications(UUID userId, Pageable pageable) {
        Page<WorkflowNotification> notifications = notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(userId, false, pageable);
        return notifications.map(this::mapToNotificationDto);
    }

    @Override
    @Transactional
    public void markNotificationAsRead(UUID notificationId) {
        logger.info("Marcando notificação como lida: {}", notificationId);

        notificationRepository.markAsRead(notificationId);
    }

    @Override
    @Transactional
    public void markAllNotificationsAsRead(UUID userId) {
        logger.info("Marcando todas as notificações do usuário como lidas: {}", userId);

        notificationRepository.markAllAsRead(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public int countUnreadNotifications(UUID userId) {
        return notificationRepository.countUnreadNotifications(userId);
    }

    @Override
    @Transactional
    public void checkAndSendDeadlineNotifications(int daysThreshold) {
        logger.info("Verificando fluxos com prazo próximo do vencimento (limite: {} dias)", daysThreshold);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thresholdDate = now.plusDays(daysThreshold);

        // Buscar fluxos com prazo entre agora e o limite
        List<Workflow> workflows = workflowRepository.findWorkflowsWithDeadlineBetween(now, thresholdDate);

        for (Workflow workflow : workflows) {
            // Calcular dias restantes
            int daysRemaining = (int) ChronoUnit.DAYS.between(now, workflow.getDeadline());

            // Verificar se já existe notificação para este fluxo hoje
            List<WorkflowNotification> existingNotifications = notificationRepository.findByWorkflowIdAndUserId(
                    workflow.getId(), workflow.getCreatedBy().getId());

            boolean alreadyNotified = existingNotifications.stream()
                    .anyMatch(notification ->
                            notification.getType().equals("deadline") &&
                                    notification.getCreatedAt().toLocalDate().equals(now.toLocalDate()));

            if (!alreadyNotified) {
                // Notificar o criador do fluxo
                createDeadlineNotification(workflow.getId(), workflow.getCreatedBy().getId(), daysRemaining);

                // Também notificar o responsável atual, se for diferente do criador
                workflowAssigmentRepository.findCurrentAssignment(workflow.getId())
                        .ifPresent(assignment -> {
                            if (!assignment.getAssignedTo().getId().equals(workflow.getCreatedBy().getId())) {
                                createDeadlineNotification(
                                        workflow.getId(), assignment.getAssignedTo().getId(), daysRemaining);
                            }
                        });
            }
        }

        // Buscar fluxos com prazo vencido (overdue)
        List<Workflow> overdueWorkflows = workflowRepository.findOverdueWorkflows(now);

        for (Workflow workflow : overdueWorkflows) {
            // Verificar se já existe notificação para este fluxo hoje
            List<WorkflowNotification> existingNotifications = notificationRepository.findByWorkflowIdAndUserId(
                    workflow.getId(), workflow.getCreatedBy().getId());

            boolean alreadyNotified = existingNotifications.stream()
                    .anyMatch(notification ->
                            notification.getType().equals("deadline") &&
                                    notification.getCreatedAt().toLocalDate().equals(now.toLocalDate()));

            if (!alreadyNotified) {
                // Notificar o criador do fluxo
                createDeadlineNotification(workflow.getId(), workflow.getCreatedBy().getId(), 0);

                // Também notificar o responsável atual, se for diferente do criador
                workflowAssigmentRepository.findCurrentAssignment(workflow.getId())
                        .ifPresent(assignment -> {
                            if (!assignment.getAssignedTo().getId().equals(workflow.getCreatedBy().getId())) {
                                createDeadlineNotification(
                                        workflow.getId(), assignment.getAssignedTo().getId(), 0);
                            }
                        });
            }
        }
    }

    /**
     * Mapeia uma WorkflowNotification para um WorkflowNotificationDto
     */
    private WorkflowNotificationDto mapToNotificationDto(WorkflowNotification notification) {
        WorkflowNotificationDto dto = new WorkflowNotificationDto();
        dto.setId(notification.getId());
        dto.setWorkflowId(notification.getWorkflow().getId());
        dto.setWorkflowTitle(notification.getWorkflow().getTitle());
        dto.setUserId(notification.getUser().getId());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }

    /**
     * Retorna um nome legível para um status de fluxo
     */
    private String getStatusDisplayName(String status) {
        switch (status) {
            case "in_progress":
                return "Em Andamento";
            case "paused":
                return "Pausado";
            case "completed":
                return "Concluído";
            case "canceled":
                return "Cancelado";
            case "archived":
                return "Arquivado";
            default:
                return status;
        }
    }
}