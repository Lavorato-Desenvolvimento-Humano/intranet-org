package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "system_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class SystemNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    private String title;

    private String version; // Ex: v1.0.2 (para Changelog)

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // Markdown ou JSON Config

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "action_url")
    private String actionUrl; // Botão de ação (ex: "Ver novo dashboard")

    private boolean mandatory = false; // Se true, o usuário não pode fechar sem confirmar

    private boolean active = true;

    @Column(name = "target_roles")
    private String targetRoles; // Ex: "ROLE_ADMIN,ROLE_MEDICO" (null = todos)

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}