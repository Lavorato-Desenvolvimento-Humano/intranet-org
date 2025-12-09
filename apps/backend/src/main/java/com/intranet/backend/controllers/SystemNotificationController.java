package com.intranet.backend.controllers;

import com.intranet.backend.model.SystemNotification;
import com.intranet.backend.model.User;
import com.intranet.backend.model.UserNotificationRead;
import com.intranet.backend.repository.SystemNotificationRepository;
import com.intranet.backend.repository.UserNotificationReadRepository;
import com.intranet.backend.repository.UserRepository; // Import do repositório de usuários
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class SystemNotificationController {

    @Autowired
    private SystemNotificationRepository notificationRepository;

    @Autowired
    private UserNotificationReadRepository readRepository;

    @Autowired
    private UserRepository userRepository; // Injetado diretamente

    @GetMapping("/pending")
    public ResponseEntity<List<SystemNotification>> getPending(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        // 1. Busca avisos não lidos
        List<SystemNotification> unread = notificationRepository.findUnreadActiveNotifications(user.getId());

        // 2. Filtra por Role (Permissões)
        List<SystemNotification> filtered = unread.stream()
                .filter(n -> {
                    if (n.getTargetRoles() == null || n.getTargetRoles().isEmpty()) return true;

                    List<String> userRoles = user.getUserRoles().stream()
                            .map(r -> r.getRole().getName())
                            .toList();

                    String[] requiredRoles = n.getTargetRoles().split(",");
                    for (String req : requiredRoles) {
                        if (userRoles.contains(req.trim())) return true;
                    }
                    return false;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(filtered);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (!readRepository.existsByUserIdAndNotificationId(user.getId(), id)) {
            SystemNotification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Aviso não encontrado"));

            UserNotificationRead read = new UserNotificationRead();
            read.setUser(user);
            read.setNotification(notification);
            read.setReadAt(LocalDateTime.now());

            readRepository.save(read);
        }

        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<SystemNotification> create(@RequestBody SystemNotification notification) {
        if (notification.getActive() == null) notification.setActive(true);
        if (notification.getMandatory() == null) notification.setMandatory(false);

        SystemNotification saved = notificationRepository.save(notification);
        return ResponseEntity.ok(saved);
    }
}