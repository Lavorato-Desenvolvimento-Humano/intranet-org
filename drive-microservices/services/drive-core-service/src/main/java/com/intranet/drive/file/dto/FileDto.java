package com.intranet.drive.file.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.intranet.drive.file.entity.FileEntity;

import java.time.LocalDateTime;

public class FileDto {
    private Long id;
    private String name;
    private String originalName;
    private String mimeType;
    private Long fileSize;
    private String storageKey;
    private String md5Hash;
    private Long folderId;
    private Long ownerId;
    private String ownerUsername;
    private Integer version;
    private Boolean isCurrentVersion;
    private Long parentFileId;
    private Long downloadCount;
    private Boolean isDeleted;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime deletedAt;

    // Propriedades calculadas
    private String fileSizeFormatted;
    private String fileExtension;
    private Boolean isImage;
    private Boolean isPdf;
    private Boolean isDocument;

    // Construtores
    public FileDto() {}

    public FileDto(FileEntity entity) {
        this.id = entity.getId();
        this.name = entity.getName();
        this.originalName = entity.getOriginalName();
        this.mimeType = entity.getMimeType();
        this.fileSize = entity.getFileSize();
        this.storageKey = entity.getStorageKey();
        this.md5Hash = entity.getMd5Hash();
        this.folderId = entity.getFolderId();
        this.ownerId = entity.getOwnerId();
        this.ownerUsername = entity.getOwnerUsername();
        this.version = entity.getVersion();
        this.isCurrentVersion = entity.getIsCurrentVersion();
        this.parentFileId = entity.getParentFileId();
        this.downloadCount = entity.getDownloadCount();
        this.isDeleted = entity.getIsDeleted();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
        this.deletedAt = entity.getDeletedAt();

        // Propriedades calculadas
        this.fileSizeFormatted = formatFileSize(entity.getFileSize());
        this.fileExtension = extractFileExtension(entity.getName());
        this.isImage = entity.isImage();
        this.isPdf = entity.isPdf();
        this.isDocument = entity.isDocument();
    }

    // Métodos auxiliares
    private String formatFileSize(Long size) {
        if (size == null) return "0 B";

        String[] units = {"B", "KB", "MB", "GB", "TB"};
        int unitIndex = 0;
        double sizeDouble = size.doubleValue();

        while (sizeDouble >= 1024 && unitIndex < units.length - 1) {
            sizeDouble /= 1024;
            unitIndex++;
        }

        return String.format("%.1f %s", sizeDouble, units[unitIndex]);
    }

    private String extractFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
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

    public String getFileSizeFormatted() { return fileSizeFormatted; }
    public void setFileSizeFormatted(String fileSizeFormatted) { this.fileSizeFormatted = fileSizeFormatted; }

    public String getFileExtension() { return fileExtension; }
    public void setFileExtension(String fileExtension) { this.fileExtension = fileExtension; }

    public Boolean getIsImage() { return isImage; }
    public void setIsImage(Boolean isImage) { this.isImage = isImage; }

    public Boolean getIsPdf() { return isPdf; }
    public void setIsPdf(Boolean isPdf) { this.isPdf = isPdf; }

    public Boolean getIsDocument() { return isDocument; }
    public void setIsDocument(Boolean isDocument) { this.isDocument = isDocument; }
}
