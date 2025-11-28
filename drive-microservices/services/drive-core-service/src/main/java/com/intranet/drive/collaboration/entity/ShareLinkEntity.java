package com.intranet.drive.collaboration.entity;

import com.intranet.drive.file.entity.FileEntity;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "share_links", schema = "drive_files")
@Data
public class ShareLinkEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id", nullable = false)
    private FileEntity file;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "password_hash")
    private String passwordHash; // Pode ser null

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "max_downloads")
    private Integer maxDownloads;

    @Column(name = "download_count")
    private Integer downloadCount = 0;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "is_active")
    private Boolean isActive = true;

    // Lógica para verificar validade
    public boolean isValid() {
        if (!isActive) return false;
        if (expiresAt != null && LocalDateTime.now().isAfter(expiresAt)) return false;
        if (maxDownloads != null && downloadCount >= maxDownloads) return false;
        return true;
    }
}
