package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "system_notifications")
@Data
public class SystemNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String type; // ex: 'info', 'warning', 'critical'

    private String title;
    private String version;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "action_url")
    private String actionUrl;

    private Boolean mandatory = false;
    private Boolean active = true;

    @Column(name = "target_roles")
    private String targetRoles; // Roles separadas por vírgula, ex: "ADMIN,USER"

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
