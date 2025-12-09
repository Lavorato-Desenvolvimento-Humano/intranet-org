package com.intranet.backend.service;

import com.intranet.backend.model.SystemNotification;
import com.intranet.backend.model.User;
import com.intranet.backend.model.UserNotificationRead;
import com.intranet.backend.repository.SystemNotificationRepository;
import com.intranet.backend.repository.UserNotificationReadRepository;
import com.intranet.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SystemNotificationService {

    @Autowired
    private SystemNotificationRepository notificationRepository;

    @Autowired
    private UserNotificationReadRepository readRepository;

    @Autowired
    private UserRepository userRepository;

    public List<SystemNotification> getPendingNotifications(User user) {
        List<SystemNotification> unread = notificationRepository.findUnreadActiveNotifications(user.getId());

        // Filtra por Role se o campo target_roles estiver preenchido
        return unread.stream()
                .filter(notification -> isTargetedUser(notification, user))
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(UUID notificationId, User user) {
        SystemNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notificação não encontrada"));

        // Evita duplicidade se o usuário clicar duas vezes rápido
        if (!readRepository.existsByUserIdAndNotificationId(user.getId(), notificationId)) {
            UserNotificationRead read = new UserNotificationRead();
            read.setUser(user);
            read.setNotification(notification);
            read.setReadAt(LocalDateTime.now());
            readRepository.save(read);
        }
    }

    private boolean isTargetedUser(SystemNotification notification, User user) {
        if (notification.getTargetRoles() == null || notification.getTargetRoles().isEmpty()) {
            return true; // Se não tem role definida, é para todos
        }

        // Pega as roles do usuário (assumindo que user.getRoles() retorna Set<Role>)
        List<String> userRoles = user.getUserRoles().stream()
                .map(role -> role.getRole().getName()) // Ajuste conforme seu Enum/Model
                .collect(Collectors.toList());

        String[] requiredRoles = notification.getTargetRoles().split(",");

        for (String required : requiredRoles) {
            if (userRoles.contains(required.trim())) {
                return true;
            }
        }
        return false;
    }
}