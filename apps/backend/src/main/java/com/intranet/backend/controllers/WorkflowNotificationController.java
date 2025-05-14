package com.intranet.backend.controllers;

import com.intranet.backend.dto.WorkflowNotificationDto;
import com.intranet.backend.model.User;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.service.WorkflowNotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workflow-notifications")
@RequiredArgsConstructor
public class WorkflowNotificationController {

    private static final Logger logger = LoggerFactory.getLogger(WorkflowNotificationController.class);
    private final WorkflowNotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Page<WorkflowNotificationDto>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        logger.info("Buscando notificações do usuário: {}", userId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<WorkflowNotificationDto> notifications;

        if (unreadOnly) {
            notifications = notificationService.getUnreadUserNotifications(userId, pageable);
        } else {
            notifications = notificationService.getUserNotifications(userId, pageable);
        }

        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<List<WorkflowNotificationDto>> getUnreadNotifications() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        logger.info("Buscando notificações não lidas do usuário: {}", userId);

        List<WorkflowNotificationDto> notifications = notificationService.getUnreadNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/count-unread")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Integer> countUnreadNotifications() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        logger.info("Contando notificações não lidas do usuário: {}", userId);

        int count = notificationService.countUnreadNotifications(userId);
        return ResponseEntity.ok(count);
    }

    @PostMapping("/{id}/mark-read")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Void> markNotificationAsRead(@PathVariable UUID id) {
        logger.info("Marcando notificação como lida: {}", id);

        notificationService.markNotificationAsRead(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/mark-all-read")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'SUPERVISOR', 'USER')")
    public ResponseEntity<Void> markAllNotificationsAsRead() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado com o email: " + email));

        UUID userId = user.getId();

        logger.info("Marcando todas as notificações do usuário como lidas: {}", userId);

        notificationService.markAllNotificationsAsRead(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/check-deadlines")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> checkAndSendDeadlineNotifications(
            @RequestParam(defaultValue = "3") int daysThreshold) {

        logger.info("Verificando fluxos com prazo próximo do vencimento (limite: {} dias)", daysThreshold);

        notificationService.checkAndSendDeadlineNotifications(daysThreshold);
        return ResponseEntity.noContent().build();
    }
}