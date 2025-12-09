package com.intranet.backend.controllers;

import com.intranet.backend.model.SystemNotification;
import com.intranet.backend.model.User;
import com.intranet.backend.model.UserNotificationRead;
import com.intranet.backend.repository.SystemNotificationRepository;
import com.intranet.backend.repository.UserNotificationReadRepository;
import com.intranet.backend.repository.UserRepository;
import com.intranet.backend.security.UserSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class SystemNotificationController {

    private final SystemNotificationRepository notificationRepository;
    private final UserNotificationReadRepository readRepository;
    private final UserRepository userRepository;
    private final UserSecurity userSecurity;

    @GetMapping("/pending")
    public ResponseEntity<List<SystemNotification>> getPendingNotifications() {
        UUID userId = userSecurity.getId(); // Método auxiliar para pegar ID do token
        if (userId == null) return ResponseEntity.status(401).build();

        return ResponseEntity.ok(notificationRepository.findPendingForUser(userId));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        UUID userId = userSecurity.getId();

        if (!readRepository.existsByUserIdAndNotificationId(userId, id)) {
            User user = userRepository.findById(userId).orElseThrow();
            SystemNotification notification = notificationRepository.findById(id).orElseThrow();

            UserNotificationRead read = new UserNotificationRead();
            read.setUser(user);
            read.setNotification(notification);
            read.setReadAt(java.time.LocalDateTime.now());

            readRepository.save(read);
        }
        return ResponseEntity.ok().build();
    }

    // Adicione endpoints POST/PUT para admin criar notificações aqui depois
}