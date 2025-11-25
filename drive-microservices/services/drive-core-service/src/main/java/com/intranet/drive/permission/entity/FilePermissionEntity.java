package com.intranet.drive.permission.entity;

import com.intranet.drive.file.entity.FileEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "file_permissions", schema = "drive_files")
public class FilePermissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id", nullable = false)
    private FileEntity file;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private PermissionTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private String targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "permission_type", nullable = false)
    private PermissionType permissionType;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public FilePermissionEntity() {}

    public FilePermissionEntity(FileEntity file, PermissionTargetType targetType, String targetId, PermissionType permissionType) {
        this.file = file;
        this.targetType = targetType;
        this.targetId = targetId;
        this.permissionType = permissionType;
    }

    public Long getId() { return id; }
    public FileEntity getFile() { return file; }
    public PermissionTargetType getTargetType() { return targetType; }
    public String getTargetId() { return targetId; }
    public PermissionType getPermissionType() { return permissionType; }
    public void setPermissionType(PermissionType permissionType) { this.permissionType = permissionType; }
}
