package com.intranet.drive.file.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "files", schema = "drive_files")
@EntityListeners(AuditingEntityListener.class)
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "storage_key", nullable = false, unique = true)
    private String storageKey;

    @Column(name = "md5_hash", nullable = false)
    private String md5Hash;

    @Column(name = "folder_id")
    private Long folderId;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "owner_username", nullable = false)
    private String ownerUsername;

    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Column(name = "is_current_version", nullable = false)
    private Boolean isCurrentVersion = true;

    @Column(name = "parent_file_id")
    private Long parentFileId;

    @Column(name = "download_count", nullable = false)
    private Long downloadCount;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "parentFileId", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FileEntity> versions = new ArrayList<>();

    //Construtores
    public FileEntity() {}

    public FileEntity(String name, String originalName, String mimeType, Long fileSize,
                      String filePath, String storageKey, String md5Hash, Long ownerId, String ownerUsername) {
        this.name = name;
        this.originalName = originalName;
        this.mimeType = mimeType;
        this.fileSize = fileSize;
        this.filePath = filePath;
        this.storageKey = storageKey;
        this.md5Hash = md5Hash;
        this.ownerId = ownerId;
        this.ownerUsername = ownerUsername;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String storageKey) { this.storageKey = storageKey; }

    public String getMd5Hash() { return md5Hash; }
    public void setMd5Hash(String md5Hash) { this.md5Hash = md5Hash; }

    public Long getFolderId() { return folderId; }
    public void setFolderId(Long folderId) { this.folderId = folderId; }

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }

    public String getOwnerUsername() { return ownerUsername; }
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public Boolean getIsCurrentVersion() { return isCurrentVersion; }
    public void setIsCurrentVersion(Boolean isCurrentVersion) { this.isCurrentVersion = isCurrentVersion; }

    public Long getParentFileId() { return parentFileId; }
    public void setParentFileId(Long parentFileId) { this.parentFileId = parentFileId; }

    public Long getDownloadCount() { return downloadCount; }
    public void setDownloadCount(Long downloadCount) { this.downloadCount = downloadCount; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    public List<FileEntity> getVersions() { return versions; }
    public void setVersions(List<FileEntity> versions) { this.versions = versions; }

    // Métodos auxiliares
    public void incrementDownloadCount() {
        this.downloadCount++;
    }

    public void markAsDeleted() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }

    public void restore() {
        this.isDeleted = false;
        this.deletedAt = null;
    }

    public boolean isImage() {
        return mimeType != null && mimeType.startsWith("image/");
    }

    public boolean isPdf() {
        return "application/pdf".equals(mimeType);
    }

    public boolean isDocument() {
        return mimeType != null && (
                mimeType.startsWith("application/msword") ||
                        mimeType.startsWith("application/vnd.openxmlformats-officedocument") ||
                        mimeType.equals("text/plain") ||
                        mimeType.startsWith("application/vnd.ms-excel")
        );
    }

    public String getFileExtension() {
        if (name == null || !name.contains(".")) {
            return "";
        }
        return name.substring(name.lastIndexOf(".") + 1).toLowerCase();
    }
}
