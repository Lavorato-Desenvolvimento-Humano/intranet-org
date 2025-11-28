package com.intranet.drive.quota.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_quotas", schema = "drive_files")
public class UserQuotaEntity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "total_space_bytes", nullable = false)
    private Long totalSpaceBytes;

    @Column(name = "used_space_bytes", nullable = false)
    private Long usedSpaceBytes;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public UserQuotaEntity() {}

    public UserQuotaEntity(Long userId, Long initialQuota) {
        this.userId = userId;
        this.totalSpaceBytes = initialQuota;
        this.usedSpaceBytes = 0L;
        this.updatedAt = LocalDateTime.now();
    }

    // Getters e Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getTotalSpaceBytes() { return totalSpaceBytes; }
    public void setTotalSpaceBytes(Long totalSpaceBytes) { this.totalSpaceBytes = totalSpaceBytes; }
    public Long getUsedSpaceBytes() { return usedSpaceBytes; }
    public void setUsedSpaceBytes(Long usedSpaceBytes) { this.usedSpaceBytes = usedSpaceBytes; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
